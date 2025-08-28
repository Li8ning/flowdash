import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import logger from '@/lib/logger';
import { NextRequest } from 'next/server';

// Get production report
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const { organization_id } = authResult.user;

  try {
    let query = `
      SELECT p.name as product_name, p.design, p.color, SUM(l.produced) as total_production
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = $1 AND l.produced > 0
    `;
    const params: (string | number)[] = [organization_id as number];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND DATE(l.created_at) >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(l.created_at) <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` GROUP BY p.name, p.design, p.color ORDER BY p.name, p.design, p.color`;

    const { rows } = await sql.query(query, params);

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    logger.error({ err }, 'Failed to fetch production report');
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
}