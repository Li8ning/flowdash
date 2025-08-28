import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-utils';
import sql from '../../../../../lib/db';
import { handleError } from '../../../../../lib/errors';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { id: user_id, organization_id } = authResult.user;

  if (!organization_id) {
    return NextResponse.json({ data: [], totalCount: 0 });
  }

  const { searchParams } = new URL(req.url);
  const product = searchParams.get('product');
  const color = searchParams.get('color');
  const design = searchParams.get('design');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const quality = searchParams.get('quality');
  const packaging_type = searchParams.get('packaging_type');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const conditions = [`l.user_id = $1`, `p.organization_id = $2`];
  const params: (string | number)[] = [user_id as number, organization_id as number];
  let paramIndex = 3;

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
    SELECT l.id, l.product_id, p.name as product_name, p.color, p.design, p.image_url, l.produced, l.created_at, l.quality, l.packaging_type
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  const countQuery = `
    SELECT COUNT(*) FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE ${whereClause}
  `;

  const [logsResult, countResult] = await Promise.all([
    sql.query(logsQuery, [...params, limit, offset]),
    sql.query(countQuery, params)
  ]);

  const totalCount = parseInt(countResult.rows[0].count, 10);

  return NextResponse.json({ data: logsResult.rows, totalCount });
});