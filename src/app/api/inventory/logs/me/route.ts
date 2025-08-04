import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id: user_id } = req.user;

    const rows = await sql`
      SELECT l.id, p.name as product_name, p.color, p.model, l.quantity_change, l.created_at
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE l.user_id = ${user_id}
      ORDER BY l.created_at DESC
    `;
    
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});