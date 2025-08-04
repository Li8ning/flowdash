import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

// Get production report
const getHandler = async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const { organization_id } = req.user;

  try {
    let query = sql`
      SELECT p.name as product_name, p.model, p.color, SUM(l.quantity_change) as total_production
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.quantity_change > 0
    `;

    if (startDate) {
      query = sql`${query} AND DATE(l.created_at) >= ${startDate}`;
    }
    if (endDate) {
      query = sql`${query} AND DATE(l.created_at) <= ${endDate}`;
    }

    query = sql`${query} GROUP BY p.name, p.model, p.color ORDER BY p.name, p.model, p.color`;

    const reportData = await query;

    return NextResponse.json(reportData);
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler, ['factory_admin']);