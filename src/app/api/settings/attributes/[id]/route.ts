import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, HandlerContext } from '@/lib/auth';
import sql from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

const attributeUpdateSchema = z.object({
  value: z.string().min(1, 'Value cannot be empty'),
});

// PATCH endpoint to update a specific attribute
export const PATCH = withAuth(async (req: AuthenticatedRequest, context: HandlerContext) => {
  try {
    const { organization_id } = req.user;
    const { id: idParam } = context.params;
    const body = await req.json();

    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json({ error: 'Invalid attribute ID' }, { status: 400 });
    }
    const attributeId = parseInt(id, 10);

    const validation = attributeUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { value } = validation.data;

    const { rows } = await sql`
      UPDATE product_attributes
      SET value = ${value}
      WHERE id = ${attributeId} AND organization_id = ${organization_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found or you do not have permission to edit it' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (err) {
    logger.error({ err }, 'Failed to update product attribute');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}, ['factory_admin']);

// DELETE endpoint to remove a specific attribute
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: HandlerContext) => {
  try {
    const { organization_id } = req.user;
    const { id: idParam } = context.params;

    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id || isNaN(parseInt(id, 10))) {
      return NextResponse.json({ error: 'Invalid attribute ID' }, { status: 400 });
    }

    const attributeId = parseInt(id, 10);

    const { rows } = await sql`
      DELETE FROM product_attributes
      WHERE id = ${attributeId} AND organization_id = ${organization_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      // This can happen if the attribute doesn't exist or doesn't belong to the user's organization
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Attribute deleted successfully' }, { status: 200 });
  } catch (err) {
    logger.error({ err }, 'Failed to delete product attribute');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}, ['factory_admin']);