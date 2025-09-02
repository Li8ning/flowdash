import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql, { db } from '../../../../lib/db';
import { z } from 'zod';
import { handleError, BadRequestError } from '../../../../lib/errors';
import { VercelPoolClient } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { organization_id } = authResult.user;
  if (!organization_id) {
    return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  
  const search = searchParams.get('search');
  const userId = searchParams.get('userId');
  const product = searchParams.get('product');
  const color = searchParams.get('color');
  const design = searchParams.get('design');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const quality = searchParams.get('quality');
  const packaging_type = searchParams.get('packaging_type');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const offset = (page - 1) * limit;
  const getTotal = searchParams.get('getTotal') === 'true';

  const conditions = [`p.organization_id = $1`];
  const params: (string | number)[] = [organization_id as number];
  let paramIndex = 2;

  if (search) {
    conditions.push(`(p.name || ' ' || p.color || ' ' || p.design) ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }
  if (userId) {
    const parsedUserId = parseInt(userId, 10);
    if (!isNaN(parsedUserId)) {
      conditions.push(`l.user_id = $${paramIndex++}`);
      params.push(parsedUserId);
    }
  }
  if (product) { conditions.push(`p.name = $${paramIndex++}`); params.push(product); }
  if (color) { conditions.push(`p.color = $${paramIndex++}`); params.push(color); }
  if (design) { conditions.push(`p.design = $${paramIndex++}`); params.push(design); }
  if (quality) { conditions.push(`l.quality = $${paramIndex++}`); params.push(quality); }
  if (packaging_type) { conditions.push(`l.packaging_type = $${paramIndex++}`); params.push(packaging_type); }
  if (startDate) { conditions.push(`l.created_at >= $${paramIndex++}`); params.push(startDate); }
  if (endDate) {
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(`l.created_at < $${paramIndex++}`);
    params.push(nextDay.toISOString().split('T')[0]);
  }

  const whereClause = conditions.join(' AND ');

  const logsQuery = `
    SELECT l.id, l.product_id, p.name as product_name, p.color, p.design, p.image_url, u.name as username, l.produced, l.created_at, l.quality, l.packaging_type
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    JOIN users u ON l.user_id = u.id
    WHERE ${whereClause}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  const countQuery = `
    SELECT COUNT(*) FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    JOIN users u ON l.user_id = u.id
    WHERE ${whereClause}
  `;

  const logsResult = await sql.query(logsQuery, [...params, limit, offset]);
  
  let totalCount = 0;
  if (getTotal) {
    const countResult = await sql.query(countQuery, params);
    totalCount = parseInt(countResult.rows[0].count, 10);
  }

  return NextResponse.json({ data: logsResult.rows, totalCount: getTotal ? totalCount : undefined });
});

const logEntrySchema = z.object({
  product_id: z.number().int().positive(),
  produced: z.number().int().min(1),
  quality: z.string().min(1),
  packaging_type: z.string().min(1),
});

const createLogsSchema = z.array(logEntrySchema).nonempty();

export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id: user_id } = authResult.user;
  const body = await req.json();

  const validation = createLogsSchema.safeParse(body);
  if (!validation.success) {
    throw new BadRequestError('Invalid log entry data', validation.error.flatten());
  }

  const logsToCreate = validation.data;

  const client: VercelPoolClient = await db.connect();
  try {
    await client.query('BEGIN');
    // Prepare data for bulk insert
    const productIds = logsToCreate.map(log => log.product_id);
    const producedValues = logsToCreate.map(log => log.produced);
    const qualityValues = logsToCreate.map(log => log.quality);
    const packagingValues = logsToCreate.map(log => log.packaging_type);
    const userIds = Array(logsToCreate.length).fill(user_id);

    // 1. Bulk insert into inventory_logs
    const { rows: insertedLogs } = await client.query(
      `
      INSERT INTO inventory_logs (product_id, user_id, produced, quality, packaging_type)
      SELECT * FROM UNNEST(
        $1::int[], $2::int[], $3::int[], $4::text[], $5::text[]
      )
      RETURNING *
      `,
      [productIds, userIds, producedValues, qualityValues, packagingValues]
    );

    // 2. Update inventory_summary table with UPSERT for each product/quality/packaging combination
    for (const log of logsToCreate) {
      await client.query(
        `
        INSERT INTO inventory_summary (product_id, quality, packaging_type, quantity, last_updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (product_id, quality, packaging_type)
        DO UPDATE SET
          quantity = inventory_summary.quantity + EXCLUDED.quantity,
          last_updated_at = NOW()
        `,
        [log.product_id, log.quality, log.packaging_type, log.produced]
      );
    }
    
    await client.query('COMMIT');
    return NextResponse.json(insertedLogs, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});