import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

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
    const params: any[] = [organization_id];
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
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler, ['factory_admin']);