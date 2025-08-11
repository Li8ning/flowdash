import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import sql from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

const attributeSchema = z.object({
  type: z.enum(['category', 'design', 'color', 'quality', 'packaging_type']),
  value: z.string().min(1, "Value cannot be empty"),
});

// GET endpoint to fetch all attributes, with optional filtering by type
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let query;

    if (type) {
      query = sql`SELECT * FROM product_attributes WHERE organization_id = ${organization_id} AND type = ${type} ORDER BY value ASC`;
    } else {
      query = sql`SELECT * FROM product_attributes WHERE organization_id = ${organization_id} ORDER BY value ASC`;
    }

    const { rows } = await query;
    return NextResponse.json(rows);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch product attributes');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});

// POST endpoint to create a new attribute
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const body = await req.json();

    const validation = attributeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', issues: validation.error.issues }, { status: 400 });
    }

    const { type, value } = validation.data;

    const { rows } = await sql`
      INSERT INTO product_attributes (organization_id, type, value)
      VALUES (${organization_id}, ${type}, ${value})
      ON CONFLICT (organization_id, type, value) DO NOTHING
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Attribute already exists.' }, { status: 409 });
    }

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Failed to create product attribute');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}, ['factory_admin']);