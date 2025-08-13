import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-utils';
import sql from '../../../../../lib/db';
import { z } from 'zod';
import { handleError, NotFoundError, ForbiddenError, BadRequestError } from '../../../../../lib/errors';

interface RouteContext {
  params: { id: string };
}

const updateLogSchema = z.object({
  produced: z.number().int().min(1),
  quality: z.string().min(1),
  packaging_type: z.string().min(1),
});

// PUT handler to update a log entry
export const PUT = handleError(async (req: NextRequest, { params }: RouteContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id: logId } = params;
  const { id: userId, role } = authResult.user;
  
  const body = await req.json();
  const validation = updateLogSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid input', validation.error.flatten());
  }
  const { produced, quality, packaging_type } = validation.data;

  const { rows: [log] } = await sql`
    SELECT user_id, created_at FROM inventory_logs WHERE id = ${logId}
  `;

  if (!log) {
    throw new NotFoundError('Log not found');
  }

  const isOwner = log.user_id === userId;
  const isWithin24Hours = (Date.now() - new Date(log.created_at).getTime()) < 24 * 60 * 60 * 1000;

  if (!['super_admin', 'admin'].includes(role as string) && !(isOwner && isWithin24Hours)) {
    throw new ForbiddenError('You do not have permission to update this log.');
  }

  await sql`
    UPDATE inventory_logs
    SET produced = ${produced}, quality = ${quality}, packaging_type = ${packaging_type}
    WHERE id = ${logId}
  `;
  
  const { rows: [result] } = await sql`
    SELECT l.id, p.name as product_name, p.color, p.design, l.produced, l.created_at, l.quality, l.packaging_type, p.image_url
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE l.id = ${logId}
  `;

  return NextResponse.json(result);
});

// DELETE handler to remove a log entry
export const DELETE = handleError(async (req: NextRequest, { params }: RouteContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id: logId } = params;
  const { id: userId, role } = authResult.user;

  const { rows: [log] } = await sql`
    SELECT user_id, created_at FROM inventory_logs WHERE id = ${logId}
  `;

  if (!log) {
    throw new NotFoundError('Log not found');
  }

  const isOwner = log.user_id === userId;
  const isWithin24Hours = (Date.now() - new Date(log.created_at).getTime()) < 24 * 60 * 60 * 1000;

  if (!['super_admin', 'admin'].includes(role as string) && !(role === 'floor_staff' && isOwner && isWithin24Hours)) {
    throw new ForbiddenError('You do not have permission to delete this log.');
  }

  const { rowCount } = await sql`
    DELETE FROM inventory_logs WHERE id = ${logId}
  `;

  if (rowCount === 0) {
    // This case should ideally not be reached if the log was found before
    throw new NotFoundError('Log not found during deletion');
  }

  return NextResponse.json({ message: 'Log deleted successfully' });
});