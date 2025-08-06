import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql, { db } from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    const product = searchParams.get('product');
    const color = searchParams.get('color');
    const model = searchParams.get('model');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT l.id, l.product_id, p.name as product_name, p.color, p.model, p.image_url, u.name as username, l.produced, l.created_at, l.quality, l.packaging_type
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      JOIN users u ON l.user_id = u.id
      WHERE p.organization_id = $1
    `;
    const params: any[] = [organization_id];
    let paramIndex = 2;

    if (user) {
      query += ` AND u.name = $${paramIndex++}`;
      params.push(user);
    }
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
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const { id: user_id } = req.user;
  const logsToCreate = await req.json();

  if (!Array.isArray(logsToCreate) || logsToCreate.length === 0) {
    return NextResponse.json({ error: 'Request body must be a non-empty array of logs' }, { status: 400 });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const insertedLogs = [];
    for (const log of logsToCreate) {
      const { product_id, produced, quality, packaging_type } = log;

      if (!product_id || !Number.isInteger(produced) || produced < 1 || !quality || !packaging_type) {
        throw new Error('Invalid log entry data');
      }

      const { rows } = await client.query(
        `INSERT INTO inventory_logs (product_id, user_id, produced, quality, packaging_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [product_id, user_id, produced, quality, packaging_type]
      );
      insertedLogs.push(rows[0]);
    }
    await client.query('COMMIT');
    return NextResponse.json(insertedLogs, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err instanceof Error && err.message === 'Invalid log entry data') {
      return NextResponse.json({ error: 'One or more log entries were invalid.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
});