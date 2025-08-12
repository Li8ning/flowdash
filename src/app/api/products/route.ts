import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { z } from 'zod';
import logger from '../../../lib/logger';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    if (!organization_id) {
      // If user has no organization, they have no products.
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const color = searchParams.get('color');
    const category = searchParams.get('category');
    const design = searchParams.get('design');

    const whereClauses = ['organization_id = $1'];
    const queryParams: (string | number)[] = [organization_id];
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

    const productsPromise = db.query(
      `SELECT *
       FROM products
       WHERE ${whereString}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++}
       OFFSET $${paramIndex++}`,
      [...queryParams, limit, offset]
    );
    
    const countPromise = db.query(
      `SELECT COUNT(*) FROM products WHERE ${whereString}`,
      queryParams
    );

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
  color: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  available_qualities: z.array(z.string()).optional(),
  available_packaging_types: z.array(z.string()).optional(),
  category: z.string().optional(),
  design: z.string().optional(),
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

    const { name, sku, color, image_url, available_qualities, category, design } = validation.data;
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
      `INSERT INTO products (name, sku, color, image_url, organization_id, available_qualities, available_packaging_types, category, design)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, sku, color, image_url, organization_id, available_qualities, available_packaging_types, category, design]
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