import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id: user_id } = req.user;
    const { searchParams } = new URL(req.url);
    const product = searchParams.get('product');
    const color = searchParams.get('color');
    const model = searchParams.get('model');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const rows = await sql`
      SELECT l.id, p.name as product_name, p.color, p.model, p.image_url, l.quantity_change, l.created_at
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE l.user_id = ${user_id}
      ${product ? sql` AND p.name = ${product}` : sql``}
      ${color ? sql` AND p.color = ${color}` : sql``}
      ${model ? sql` AND p.model = ${model}` : sql``}
      ${startDate ? sql` AND l.created_at >= ${startDate}` : sql``}
      ${endDate ? sql` AND l.created_at < ${(new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))).toISOString().split('T')[0]}` : sql``}
      ORDER BY l.created_at DESC
    `;
    
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});