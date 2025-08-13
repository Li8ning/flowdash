import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import sql from '@/lib/db';
import { z } from 'zod';
import { handleError, BadRequestError, ForbiddenError, ConflictError } from '@/lib/errors';

const attributeSchema = z.object({
  type: z.enum(['category', 'design', 'color', 'quality', 'packaging_type']),
  value: z.string().min(1, "Value cannot be empty").transform(val => val.trim()),
});

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { organization_id } = authResult.user;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  let query;
  if (type) {
    query = sql`SELECT * FROM product_attributes WHERE organization_id = ${organization_id as number} AND type = ${type} ORDER BY value ASC`;
  } else {
    query = sql`SELECT * FROM product_attributes WHERE organization_id = ${organization_id as number} ORDER BY value ASC`;
  }

  const { rows } = await query;
  return NextResponse.json(rows);
});

export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('You do not have permission to create attributes.');
  }

  const { organization_id } = authResult.user;
  const body = await req.json();

  const validation = attributeSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid input', validation.error.flatten());
  }

  const { type, value } = validation.data;

  const { rows } = await sql`
    INSERT INTO product_attributes (organization_id, type, value)
    VALUES (${organization_id as number}, ${type}, ${value})
    ON CONFLICT (organization_id, type, value) DO NOTHING
    RETURNING *
  `;

  if (rows.length === 0) {
    throw new ConflictError('This attribute already exists.');
  }

  return NextResponse.json(rows[0], { status: 201 });
});