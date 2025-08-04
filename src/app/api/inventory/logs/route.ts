import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    const product = searchParams.get('product');
    const color = searchParams.get('color');
    const model = searchParams.get('model');

    let query = `
      SELECT l.id, p.name as product_name, p.color, p.model, u.name as username, l.quantity_change, l.created_at
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      JOIN users u ON l.user_id = u.id
      WHERE p.organization_id = ${organization_id}
    `;
    
    if (user) query += ` AND u.name = '${user}'`;
    if (product) query += ` AND p.name = '${product}'`;
    if (color) query += ` AND p.color = '${color}'`;
    if (model) query += ` AND p.model = '${model}'`;

    query += ' ORDER BY l.created_at DESC';

    const rows = await sql.query(query);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id, id: user_id } = req.user;
    const { product_id, quantity_change } = await req.json();

    if (!product_id || !Number.isInteger(quantity_change) || quantity_change < 1) {
      return NextResponse.json({ error: 'Product ID and a valid quantity greater than 0 are required' }, { status: 400 });
    }

    const [newLog] = await sql`
      INSERT INTO inventory_logs (product_id, user_id, quantity_change)
      VALUES (${product_id}, ${user_id}, ${quantity_change})
      RETURNING *
    `;

    return NextResponse.json(newLog, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});