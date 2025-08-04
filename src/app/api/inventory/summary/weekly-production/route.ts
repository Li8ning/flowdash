import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    const result = await sql`
      SELECT DATE(l.created_at) as date, SUM(l.quantity_change) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(l.created_at)
      ORDER BY date
    `;

    const labels = result.map((row: any) => new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }));
    const data = result.map((row: any) => row.total);

    return NextResponse.json({ labels, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});