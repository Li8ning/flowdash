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
    const design = searchParams.get('design');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const quality = searchParams.get('quality');
    const packaging_type = searchParams.get('packaging_type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const conditions = [`p.organization_id = $1`];
    const params: (string | number)[] = [organization_id];
    let paramIndex = 2;

    if (user) {
      conditions.push(`u.name = $${paramIndex++}`);
      params.push(user);
    }
    if (product) {
      conditions.push(`p.name = $${paramIndex++}`);
      params.push(product);
    }
    if (color) {
      conditions.push(`p.color = $${paramIndex++}`);
      params.push(color);
    }
    if (design) {
      conditions.push(`p.design = $${paramIndex++}`);
      params.push(design);
    }
    if (quality) {
      conditions.push(`l.quality = $${paramIndex++}`);
      params.push(quality);
    }
    if (packaging_type) {
      conditions.push(`l.packaging_type = $${paramIndex++}`);
      params.push(packaging_type);
    }
    if (startDate) {
      conditions.push(`l.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`l.created_at < $${paramIndex++}`);
      params.push((new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))).toISOString().split('T')[0]);
    }

    const whereClause = conditions.join(' AND ');

    const logsQuery = `
      SELECT l.id, l.product_id, p.name as product_name, p.color, p.design, p.image_url, u.name as username, l.produced, l.created_at, l.quality, l.packaging_type
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      JOIN users u ON l.user_id = u.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `;
    
    const countQuery = `
      SELECT COUNT(*)
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      JOIN users u ON l.user_id = u.id
      WHERE ${whereClause}
    `;

    const logsPromise = sql.query(logsQuery, [...params, limit, offset]);
    const countPromise = sql.query(countQuery, params);

    const [logsResult, countResult] = await Promise.all([logsPromise, countPromise]);

    const totalCount = parseInt(countResult.rows[0].count, 10);

    return NextResponse.json({
      data: logsResult.rows,
      totalCount,
    });
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

    const values = logsToCreate.map(log => {
      const { product_id, produced, quality, packaging_type } = log;
      if (!product_id || !Number.isInteger(produced) || produced < 1 || !quality || !packaging_type) {
        throw new Error('Invalid log entry data');
      }
      return [product_id, user_id, produced, quality, packaging_type];
    });

    const flatValues = values.flat();
    const valuePlaceholders = values.map((_, i) =>
      `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
    ).join(',');

    const query = `
      INSERT INTO inventory_logs (product_id, user_id, produced, quality, packaging_type)
      VALUES ${valuePlaceholders}
      RETURNING *
    `;

    const { rows: insertedLogs } = await client.query(query, flatValues);

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