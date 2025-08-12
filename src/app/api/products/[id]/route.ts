import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import { z } from 'zod';
import logger from '../../../../lib/logger';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const { id } = context.params;
    const { organization_id } = req.user;

    const { rows } = await sql`
      SELECT *
      FROM products
      WHERE id = ${id} AND organization_id = ${organization_id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch product');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
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
}).partial();

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const { id } = context.params;
    const { organization_id } = req.user;
    const body = await req.json();

    const validation = productUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', issues: validation.error.issues }, { status: 400 });
    }
    
    const { rows: existingResult } = await sql`
      SELECT * FROM products WHERE id = ${id} AND organization_id = ${organization_id}
    `;

    if (existingResult.length === 0) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 });
    }

    const existingProduct = existingResult[0];
    const updatedData = { ...existingProduct, ...validation.data };
    
    const finalPackagingTypes = Array.isArray(updatedData.available_packaging_types)
      ? [...new Set([...updatedData.available_packaging_types, 'Open'])]
      : ['Open'];

    const { rows } = await sql`
      UPDATE products
      SET
        name = ${updatedData.name},
        sku = ${updatedData.sku},
        color = ${updatedData.color},
        category = ${updatedData.category},
        design = ${updatedData.design},
        image_url = ${updatedData.image_url},
        available_qualities = ${updatedData.available_qualities ? `{${updatedData.available_qualities.join(',')}}` : null},
        available_packaging_types = ${`{${finalPackagingTypes.join(',')}}`}
      WHERE id = ${id} AND organization_id = ${organization_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to update product');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}, ['factory_admin']);