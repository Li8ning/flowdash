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

    let query = `
      SELECT l.id, l.product_id, p.name as product_name, p.color, p.model, p.image_url, l.produced, l.created_at, l.quality, l.packaging_type
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE l.user_id = $1
    `;
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (product) {
      query += ` AND p.name = $${paramIndex++}`;
      params.push(product);
    }
    if (color) {
      query += ` AND p.color = $${paramIndex++}`;
      params.push(color);
    }
    if (model) {
      query += ` AND p.model = $${paramIndex++}`;
      params.push(model);
    }
    if (startDate) {
      query += ` AND l.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND l.created_at < $${paramIndex++}`;
      params.push((new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))).toISOString().split('T')[0]);
    }

    query += ` ORDER BY l.created_at DESC`;

    const { rows } = await sql.query(query, params);

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});