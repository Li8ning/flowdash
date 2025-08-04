import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    const todayQuery = sql`
      SELECT COALESCE(SUM(quantity_change), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE
    `;

    const weekQuery = sql`
      SELECT COALESCE(SUM(quantity_change), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const monthQuery = sql`
      SELECT COALESCE(SUM(quantity_change), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const totalLogsQuery = sql`
      SELECT COUNT(*) as total
      FROM inventory_logs l
      JOIN users u ON l.user_id = u.id
      WHERE u.organization_id = ${organization_id}
    `;

    const [todayResult, weekResult, monthResult, totalLogsResult] = await Promise.all([
      todayQuery,
      weekQuery,
      monthQuery,
      totalLogsQuery,
    ]);

    return NextResponse.json({
      today: todayResult[0].total,
      week: weekResult[0].total,
      month: monthResult[0].total,
      totalLogs: totalLogsResult[0].total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});