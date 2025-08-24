import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/auth-utils';
import sql, { db } from '../../../lib/db';
import { z } from 'zod';
import { handleError, BadRequestError, ForbiddenError } from '../../../lib/errors';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { organization_id } = authResult.user;

  if (!organization_id) {
    return NextResponse.json({ data: [], totalCount: 0 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const color = searchParams.get('color');
  const category = searchParams.get('category');
  const design = searchParams.get('design');

  const whereClauses = ['organization_id = $1', '(p.is_archived IS NULL OR p.is_archived = false)'];
  const queryParams: (string | number)[] = [organization_id as number];
  let paramIndex = 2;

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
        i.quantity_on_hand,
        COALESCE(qualities.list, '{}') AS available_qualities,
        COALESCE(packaging.list, '{}') AS available_packaging_types
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
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
      WHERE ${whereString}
      GROUP BY p.id, i.quantity_on_hand, qualities.list, packaging.list
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...queryParams, limit, offset]
  );
  
  const countPromise = sql.query(
    `SELECT COUNT(p.*) FROM products p WHERE ${whereString}`,
    queryParams
  );

  const [productsResult, countResult] = await Promise.all([productsPromise, countPromise]);
  const totalCount = parseInt(countResult.rows[0].count, 10);

  return NextResponse.json({
    data: productsResult.rows,
    totalCount,
  });
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  available_qualities: z.array(z.string()).optional(),
  available_packaging_types: z.array(z.string()).optional(),
  category: z.string().optional(),
  design: z.string().optional(),
});

export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const { organization_id } = authResult.user;
  const body = await req.json();
  
  const validation = productSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid input', validation.error.flatten());
  }

  const { name, sku, color, image_url, available_qualities, category, design } = validation.data;
  let { available_packaging_types } = validation.data;

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
    const { rows: [newProduct] } = await client.query(
      `INSERT INTO products (name, sku, color, image_url, organization_id, category, design)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, sku, color, image_url, organization_id as number, category, design]
    );

    const newProductId = newProduct.id;

    // 2. Handle qualities
    if (available_qualities && available_qualities.length > 0) {
      const qualitiesResult = await client.query(
        `SELECT id, value FROM product_attributes WHERE type = 'quality' AND value = ANY($1::text[])`,
        [available_qualities]
      );
      const qualityIdMap = new Map(qualitiesResult.rows.map(r => [r.value, r.id]));

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

    // 3. Handle packaging types
    if (available_packaging_types && available_packaging_types.length > 0) {
      const packagingResult = await client.query(
        `SELECT id, value FROM product_attributes WHERE type = 'packaging_type' AND TRIM(value) = ANY($1::text[])`,
        [available_packaging_types]
      );
      const packagingIdMap = new Map(packagingResult.rows.map(r => [r.value.trim(), r.id]));
      
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

    // 4. Create inventory entry
    await client.query(
      `INSERT INTO inventory (product_id, quantity_on_hand) VALUES ($1, 0)`,
      [newProductId]
    );
    
    await client.query('COMMIT');
    
    // Return the full product with aggregated arrays for consistency
    const finalProductResult = await sql.query(
      `SELECT
          p.*,
          i.quantity_on_hand,
          COALESCE(qualities.list, '{}') AS available_qualities,
          COALESCE(packaging.list, '{}') AS available_packaging_types
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
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
        GROUP BY p.id, i.quantity_on_hand, qualities.list, packaging.list`,
      [newProductId]
    );

    return NextResponse.json(finalProductResult.rows[0], { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // Re-throw to be handled by the handleError wrapper
  } finally {
    client.release();
  }
});