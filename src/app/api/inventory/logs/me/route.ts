import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id: user_id, organization_id } = req.user;

    if (!organization_id) {
      // If user has no organization, they have no logs.
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
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
    const params: (string | number)[] = [user_id, organization_id];
    let paramIndex = 3;

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
      SELECT l.id, l.product_id, p.name as product_name, p.color, p.design, p.image_url, l.produced, l.created_at, l.quality, l.packaging_type
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `;
    
    const countQuery = `
      SELECT COUNT(*)
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Failed to fetch personal inventory logs:', message);
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
});