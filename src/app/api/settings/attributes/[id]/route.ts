import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import sql from '@/lib/db';
import { z } from 'zod';
import { handleError, BadRequestError, ForbiddenError, NotFoundError } from '@/lib/errors';

interface HandlerContext {
  params: { id: string };
}

const attributeUpdateSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty').transform(val => val.trim()),
});

export const PATCH = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('You do not have permission to update attributes.');
  }

  const { organization_id } = authResult.user;
  const attributeId = parseInt(params.id, 10);
  if (isNaN(attributeId)) {
    throw new BadRequestError('Invalid attribute ID');
  }

  const body = await req.json();
  const validation = attributeUpdateSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid input', validation.error.flatten());
  }
  const { value } = validation.data;

  const { rows } = await sql`
    UPDATE product_attributes
    SET value = ${value}
    WHERE id = ${attributeId} AND organization_id = ${organization_id as number}
    RETURNING *
  `;

  if (rows.length === 0) {
    throw new NotFoundError('Attribute not found or not authorized');
  }

  return NextResponse.json(rows[0]);
});

export const DELETE = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError('You do not have permission to delete attributes.');
  }

  const { organization_id } = authResult.user;
  const attributeId = parseInt(params.id, 10);
  if (isNaN(attributeId)) {
    throw new BadRequestError('Invalid attribute ID');
  }

  const { rowCount } = await sql`
    DELETE FROM product_attributes
    WHERE id = ${attributeId} AND organization_id = ${organization_id as number}
  `;

  if (rowCount === 0) {
    throw new NotFoundError('Attribute not found or not authorized');
  }

  return new NextResponse(null, { status: 204 });
});