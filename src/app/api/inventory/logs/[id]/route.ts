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

  // Get the current log values BEFORE updating
  const { rows: [currentLog] } = await sql`
    SELECT user_id, created_at, product_id, produced as old_produced,
           quality as old_quality, packaging_type as old_packaging_type
    FROM inventory_logs WHERE id = ${logId}
  `;

  if (!currentLog) {
    throw new NotFoundError('Log not found');
  }

  const isOwner = currentLog.user_id === userId;
  const isWithin24Hours = (Date.now() - new Date(currentLog.created_at).getTime()) < 24 * 60 * 60 * 1000;

  if (!['super_admin', 'admin'].includes(role as string) && !(isOwner && isWithin24Hours)) {
    throw new ForbiddenError('You do not have permission to update this log.');
  }

  // Check if quality, packaging_type, or quantity changed
  const qualityChanged = currentLog.old_quality !== quality;
  const packagingChanged = currentLog.old_packaging_type !== packaging_type;
  const quantityChanged = currentLog.old_produced !== produced;

  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // 1. Update the inventory_logs table
    await client.query(
      `UPDATE inventory_logs
       SET produced = $1, quality = $2, packaging_type = $3
       WHERE id = $4`,
      [produced, quality, packaging_type, logId]
    );

    // 2. Adjust inventory_summary if any values changed
    if (qualityChanged || packagingChanged || quantityChanged) {
      // Subtract from the old combination
      await client.query(
        `UPDATE inventory_summary
         SET quantity = quantity - $1, last_updated_at = NOW()
         WHERE product_id = $2 AND quality = $3 AND packaging_type = $4`,
        [currentLog.old_produced, currentLog.product_id, currentLog.old_quality, currentLog.old_packaging_type]
      );

      // Add to the new combination (or same combination if only quantity changed)
      await client.query(
        `INSERT INTO inventory_summary (product_id, quality, packaging_type, quantity, last_updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (product_id, quality, packaging_type)
         DO UPDATE SET
           quantity = inventory_summary.quantity + EXCLUDED.quantity,
           last_updated_at = NOW()`,
        [currentLog.product_id, quality, packaging_type, produced]
      );

      // Clean up any inventory_summary entries that became zero or negative
      await client.query(
        `DELETE FROM inventory_summary
         WHERE product_id = $1 AND quality = $2 AND packaging_type = $3 AND quantity <= 0`,
        [currentLog.product_id, currentLog.old_quality, currentLog.old_packaging_type]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  
  const { rows: [result] } = await sql`
    SELECT l.id, p.name as product_name, p.color, p.design, l.produced, l.created_at, l.quality, l.packaging_type, p.image_url, u.username
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ${logId}
  `;

  return NextResponse.json(result);
});

export const PATCH = PUT;

// DELETE handler to remove a log entry
export const DELETE = handleError(async (req: NextRequest, { params }: RouteContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id: logId } = params;
  const { id: userId, role } = authResult.user;

  // Get the log details BEFORE deleting (needed for inventory adjustment)
  const { rows: [log] } = await sql`
    SELECT user_id, created_at, product_id, produced, quality, packaging_type
    FROM inventory_logs WHERE id = ${logId}
  `;

  if (!log) {
    throw new NotFoundError('Log not found');
  }

  const isOwner = log.user_id === userId;
  const isWithin24Hours = (Date.now() - new Date(log.created_at).getTime()) < 24 * 60 * 60 * 1000;

  if (!['super_admin', 'admin'].includes(role as string) && !(role === 'floor_staff' && isOwner && isWithin24Hours)) {
    throw new ForbiddenError('You do not have permission to delete this log.');
  }

  const client = await sql.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete the log entry
    const { rowCount } = await client.query(
      `DELETE FROM inventory_logs WHERE id = $1`,
      [logId]
    );

    if (rowCount === 0) {
      throw new NotFoundError('Log not found during deletion');
    }

    // 2. Adjust inventory_summary by subtracting the deleted quantity
    await client.query(
      `UPDATE inventory_summary
       SET quantity = quantity - $1, last_updated_at = NOW()
       WHERE product_id = $2 AND quality = $3 AND packaging_type = $4`,
      [log.produced, log.product_id, log.quality, log.packaging_type]
    );

    // 3. Clean up any inventory_summary entries that became zero or negative
    await client.query(
      `DELETE FROM inventory_summary
       WHERE product_id = $1 AND quality = $2 AND packaging_type = $3 AND quantity <= 0`,
      [log.product_id, log.quality, log.packaging_type]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return NextResponse.json({ message: 'Log deleted successfully' });
});