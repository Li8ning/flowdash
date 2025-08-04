import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

// PUT handler to update a log entry
export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: RouteContext) => {
  try {
    const { id: logId } = params;
    const { id: userId, role } = req.user;
    const { quantity_change } = await req.json();

    if (!quantity_change || isNaN(Number(quantity_change))) {
      return NextResponse.json({ error: 'Invalid quantity provided' }, { status: 400 });
    }

    const [log] = await sql`
      SELECT user_id, created_at FROM inventory_logs WHERE id = ${logId}
    `;

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    const isOwner = log.user_id === userId;
    const logTime = new Date(log.created_at).getTime();
    const currentTime = new Date().getTime();
    const isWithin24Hours = (currentTime - logTime) < 24 * 60 * 60 * 1000;

    if (role === 'factory_admin' || (isOwner && isWithin24Hours)) {
      const [updatedLog] = await sql`
        UPDATE inventory_logs
        SET quantity_change = ${quantity_change}
        WHERE id = ${logId}
        RETURNING *
      `;
      
      const [result] = await sql`
        SELECT l.id, p.name as product_name, p.color, p.model, l.quantity_change, l.created_at
        FROM inventory_logs l
        JOIN products p ON l.product_id = p.id
        WHERE l.id = ${logId}
      `;

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});

// DELETE handler to remove a log entry
export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: RouteContext) => {
  try {
    const { id: logId } = params;
    const { role } = req.user;

    if (role !== 'factory_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sql`
      DELETE FROM inventory_logs WHERE id = ${logId} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Log not found or you do not have permission to delete it' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Log deleted successfully' });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});