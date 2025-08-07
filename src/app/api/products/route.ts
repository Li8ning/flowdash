import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import sql, { db } from '../../../lib/db';
import { z } from 'zod';
import logger from '../../../lib/logger';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const productsPromise = sql`
      SELECT *
      FROM products
      WHERE organization_id = ${organization_id}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    const countPromise = sql`
      SELECT COUNT(*) FROM products WHERE organization_id = ${organization_id}
    `;

    const [productsResult, countResult] = await Promise.all([productsPromise, countPromise]);

    const totalCount = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      data: productsResult.rows,
      totalCount,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch products');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  model: z.string().optional(),
  color: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  available_qualities: z.array(z.string()).optional(),
  available_packaging_types: z.array(z.string()).optional(),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { organization_id } = req.user;
    const body = await req.json();
    
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', issues: validation.error.issues }, { status: 400 });
    }

    const { name, sku, model, color, image_url, available_qualities } = validation.data;
    let { available_packaging_types } = validation.data;

    const { rows: existingProducts } = await client.query(
      `SELECT id FROM products WHERE sku = $1 AND organization_id = $2`,
      [sku, organization_id]
    );

    if (existingProducts.length > 0) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
    }

    // Ensure 'Open' is always a packaging type
    if (!available_packaging_types) {
      available_packaging_types = ['Open'];
    } else if (!available_packaging_types.includes('Open')) {
      available_packaging_types.push('Open');
    }

    const { rows } = await client.query(
      `INSERT INTO products (name, sku, model, color, image_url, organization_id, available_qualities, available_packaging_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, sku, model, color, image_url, organization_id, available_qualities, available_packaging_types]
    );
    
    await client.query('COMMIT');
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Failed to create product');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}, ['factory_admin']);