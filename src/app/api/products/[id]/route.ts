import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import { z } from 'zod';
import { handleError, NotFoundError, BadRequestError, ForbiddenError } from '../../../../lib/errors';

interface HandlerContext {
  params: { id: string };
}

export const GET = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id } = params;
  const { organization_id } = authResult.user;

  const { rows: [product] } = await sql`
    SELECT
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
      WHERE p.id = ${id} AND p.organization_id = ${organization_id as number}
      GROUP BY p.id, i.quantity_on_hand, qualities.list, packaging.list
  `;

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return NextResponse.json(product);
});

const productUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  sku: z.string().min(1, "SKU cannot be empty").optional(),
  color: z.string().optional(),
  category: z.string().optional(),
  design: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  available_qualities: z.array(z.string()).optional(),
  available_packaging_types: z.array(z.string()).optional(),
  is_archived: z.boolean().optional(),
}).strict();

export const PATCH = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const { id } = params;
  const productId = parseInt(id, 10);
  const { organization_id } = authResult.user;
  const body = await req.json();

  const validation = productUpdateSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid input', validation.error.flatten());
  }
  
  const { available_qualities, available_packaging_types, ...productData } = validation.data;

  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if product exists
    const { rows: [existingProduct] } = await client.query(
      `SELECT id FROM products WHERE id = $1 AND organization_id = $2`,
      [productId, organization_id as number]
    );

    if (!existingProduct) {
      throw new NotFoundError('Product not found or not authorized');
    }

    // 2. Update the scalar properties of the product if any are provided
    const updateFields = Object.entries(productData).filter(([, value]) => value !== undefined);
    if (updateFields.length > 0) {
      const setClauses = updateFields.map(([key], i) => `${key} = $${i + 1}`);
      const updateValues = updateFields.map(([, value]) => value);
      await client.query(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${updateFields.length + 1}`,
        [...updateValues, productId]
      );
    }

    // 3. Update qualities if provided
    if (available_qualities) {
      await client.query(`DELETE FROM product_to_quality WHERE product_id = $1`, [productId]);
      if (available_qualities.length > 0) {
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
              [productId, attributeId]
            );
          }
        }
      }
    }

    // 4. Update packaging types if provided
    if (available_packaging_types) {
      const finalPackagingTypes = [...new Set([...available_packaging_types, 'Open'])];
      await client.query(`DELETE FROM product_to_packaging_type WHERE product_id = $1`, [productId]);
      if (finalPackagingTypes.length > 0) {
        const packagingResult = await client.query(
          `SELECT id, value FROM product_attributes WHERE type = 'packaging_type' AND TRIM(value) = ANY($1::text[])`,
          [finalPackagingTypes]
        );
        const packagingIdMap = new Map(packagingResult.rows.map(r => [r.value.trim(), r.id]));
        for (const packagingName of finalPackagingTypes) {
          const attributeId = packagingIdMap.get(packagingName);
          if (attributeId) {
            await client.query(
              `INSERT INTO product_to_packaging_type (product_id, attribute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [productId, attributeId]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    // 5. Fetch and return the updated product, ensuring data is consistent
    const { rows: [updatedProduct] } = await client.query(
      `SELECT
          p.*,
          i.quantity_on_hand,
          COALESCE(qualities.list, '{}') AS available_qualities,
          COALESCE(packaging.list, '{}') AS available_packaging_types
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id
        LEFT JOIN (
          SELECT ptq.product_id, ARRAY_AGG(pa.value) as list
          FROM product_to_quality ptq
          JOIN product_attributes pa ON ptq.attribute_id = pa.id
          GROUP BY ptq.product_id
        ) AS qualities ON p.id = qualities.product_id
        LEFT JOIN (
          SELECT ptpt.product_id, ARRAY_AGG(pa.value) as list
          FROM product_to_packaging_type ptpt
          JOIN product_attributes pa ON ptpt.attribute_id = pa.id
          GROUP BY ptpt.product_id
        ) AS packaging ON p.id = packaging.product_id
        WHERE p.id = $1 AND p.organization_id = $2
        GROUP BY p.id, i.quantity_on_hand, qualities.list, packaging.list`,
      [productId, organization_id as number]
    );

    return NextResponse.json(updatedProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

export const DELETE = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const { id } = params;
  const productId = parseInt(id, 10);
  const { organization_id } = authResult.user;

  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if product exists
    const { rows: [existingProduct] } = await client.query(
      `SELECT id FROM products WHERE id = $1 AND organization_id = $2`,
      [productId, organization_id as number]
    );

    if (!existingProduct) {
      throw new NotFoundError('Product not found or not authorized');
    }

    // 2. Archive the product
    await client.query(
      `UPDATE products SET is_archived = true WHERE id = $1`,
      [productId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Product archived successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});