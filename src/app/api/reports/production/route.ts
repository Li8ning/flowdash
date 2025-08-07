import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import logger from '@/lib/logger';

// Get production report
const getHandler = async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const { organization_id } = req.user;

  try {
    let query = `
      SELECT p.name as product_name, p.model, p.color, SUM(l.produced) as total_production
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = $1 AND l.produced > 0
    `;
    const params: (string | number)[] = [organization_id];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND DATE(l.created_at) >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(l.created_at) <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` GROUP BY p.name, p.model, p.color ORDER BY p.name, p.model, p.color`;

    const { rows } = await sql.query(query, params);

    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    logger.error({ err }, 'Failed to fetch production report');
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler, ['factory_admin']);