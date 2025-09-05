import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/auth-utils';
import sql, { db } from '../../../lib/db';
import {
  handleError,
  ForbiddenError,
} from '../../../lib/errors';
import { productSchema } from '@/schemas/product';
import { withValidation } from '@/lib/validations';

interface Attribute {
  id: number;
  value: string;
}

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
  }
  const { organization_id } = authResult.user;

  if (!organization_id) {
    return NextResponse.json({ data: [], totalCount: 0 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const offset = (page - 1) * limit;
  const getTotal = searchParams.get('getTotal') === 'true';
  const color = searchParams.get('color');
  const category = searchParams.get('category');
  const design = searchParams.get('design');

  const name = searchParams.get('name');
 
  const whereClauses = [
    'p.organization_id = $1',
    '(p.is_archived IS NULL OR p.is_archived = false)',
  ];
  const queryParams: (string | number)[] = [organization_id as number];
  let paramIndex = 2;
 
  if (name) {
    whereClauses.push(`(p.name ILIKE $${paramIndex++} OR p.category ILIKE $${paramIndex++} OR p.design ILIKE $${paramIndex++} OR p.color ILIKE $${paramIndex++})`);
    queryParams.push(`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`);
  }
  if (color) {
    whereClauses.push(`color = $${paramIndex++}`);
    queryParams.push(color);
  }
  if (category) {
    whereClauses.push(`category = $${paramIndex++}`);
    queryParams.push(category);
  }
  if (design) {
    whereClauses.push(`design = $${paramIndex++}`);
    queryParams.push(design);
  }

  const whereString = whereClauses.join(' AND ');


  const productsPromise = sql.query(
    `SELECT
        p.*,
        COALESCE(qualities.list, '{}') AS available_qualities,
        COALESCE(packaging.list, '{}') AS available_packaging_types,
        m.filepath as image_url,
        pi.media_id
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN media_library m ON pi.media_id = m.id
      LEFT JOIN (
        SELECT
          ptq.product_id,
          ARRAY_AGG(pa.value ORDER BY pa.value) as list
        FROM product_to_quality ptq
        JOIN product_attributes pa ON ptq.attribute_id = pa.id
        GROUP BY ptq.product_id
      ) AS qualities ON p.id = qualities.product_id
      LEFT JOIN (
        SELECT
          ptpt.product_id,
          ARRAY_AGG(pa.value ORDER BY pa.value) as list
        FROM product_to_packaging_type ptpt
        JOIN product_attributes pa ON ptpt.attribute_id = pa.id
        GROUP BY ptpt.product_id
      ) AS packaging ON p.id = packaging.product_id
      WHERE ${whereString}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, limit, offset]
  );

  const productsResult = await productsPromise;

  let totalCount = 0;
  if (getTotal) {
    const countResult = await sql.query(
      `SELECT COUNT(DISTINCT p.id) FROM products p
       LEFT JOIN product_images pi ON p.id = pi.product_id
       LEFT JOIN media_library m ON pi.media_id = m.id
       WHERE ${whereString}`,
      queryParams
    );
    totalCount = parseInt(countResult.rows[0].count, 10);
  }

  return NextResponse.json({
    data: productsResult.rows,
    totalCount: getTotal ? totalCount : undefined,
  });
});

export const POST = handleError(
  withValidation(productSchema, async (req, body) => {
    const authResult = await verifyAuth(req);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status }
      );
    }
    if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
      throw new ForbiddenError();
    }

    const { organization_id } = authResult.user;
    const {
      name,
      sku,
      color,
      media_id,
      available_qualities,
      category,
      design,
    } = body;

    const finalMediaId = media_id;
    let { available_packaging_types } = body;

    // Ensure 'Open' is always a packaging type
    if (!available_packaging_types) {
      available_packaging_types = ['Open'];
    } else if (!available_packaging_types.includes('Open')) {
      available_packaging_types.push('Open');
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert the base product without the array columns
      const {
        rows: [newProduct],
      } = await client.query(
        `INSERT INTO products (name, sku, color, organization_id, category, design)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          name,
          sku,
          color,
          organization_id as number,
          category,
          design,
        ]
      );

      const newProductId = newProduct.id;

      // 2. Handle media relationship
      if (finalMediaId) {
        await client.query(
          `INSERT INTO product_images (product_id, media_id) VALUES ($1, $2)`,
          [newProductId, finalMediaId]
        );
      }

      // 3. Handle qualities
      if (available_qualities && available_qualities.length > 0) {
        const qualitiesResult = await client.query(
          `SELECT id, value FROM product_attributes WHERE type = 'quality' AND value = ANY($1::text[])`,
          [available_qualities]
        );
        const qualityIdMap = new Map(
          qualitiesResult.rows.map((r: Attribute) => [r.value, r.id])
        );

        for (const qualityName of available_qualities) {
          const attributeId = qualityIdMap.get(qualityName);
          if (attributeId) {
            await client.query(
              `INSERT INTO product_to_quality (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [newProductId, attributeId]
            );
          }
        }
      }

      // 4. Handle packaging types
      if (available_packaging_types && available_packaging_types.length > 0) {
        const packagingResult = await client.query(
          `SELECT id, value FROM product_attributes WHERE type = 'packaging_type' AND TRIM(value) = ANY($1::text[])`,
          [available_packaging_types]
        );
        const packagingIdMap = new Map(
          packagingResult.rows.map((r: Attribute) => [r.value.trim(), r.id])
        );

        for (const packagingName of available_packaging_types) {
          const attributeId = packagingIdMap.get(packagingName);
          if (attributeId) {
            await client.query(
              `INSERT INTO product_to_packaging_type (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [newProductId, attributeId]
            );
          }
        }
      }


      await client.query('COMMIT');

      // Return the full product with aggregated arrays and media URL for consistency
      const { rows: [finalProduct] } = await client.query(
        `SELECT
          p.*,
          COALESCE(qualities.list, '{}') AS available_qualities,
          COALESCE(packaging.list, '{}') AS available_packaging_types,
          m.filepath as image_url,
          pi.media_id
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN media_library m ON pi.media_id = m.id
        LEFT JOIN (
          SELECT
            ptq.product_id,
            ARRAY_AGG(pa.value) as list
          FROM product_to_quality ptq
          JOIN product_attributes pa ON ptq.attribute_id = pa.id
          GROUP BY ptq.product_id
        ) AS qualities ON p.id = qualities.product_id
        LEFT JOIN (
          SELECT
            ptpt.product_id,
            ARRAY_AGG(pa.value) as list
          FROM product_to_packaging_type ptpt
          JOIN product_attributes pa ON ptpt.attribute_id = pa.id
          GROUP BY ptpt.product_id
        ) AS packaging ON p.id = packaging.product_id
        WHERE p.id = $1
        GROUP BY p.id, qualities.list, packaging.list, m.filepath, pi.media_id`,
        [newProductId]
      );

      return NextResponse.json(finalProduct, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err; // Re-throw to be handled by the handleError wrapper
    } finally {
      client.release();
    }
  })
);