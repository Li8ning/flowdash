import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    const todayQuery = sql`
      SELECT COALESCE(SUM(produced), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE
    `;

    const weekQuery = sql`
      SELECT COALESCE(SUM(produced), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;

    const monthQuery = sql`
      SELECT COALESCE(SUM(produced), 0) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id} AND l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    const todaysLogsQuery = sql`
      SELECT COUNT(*) as total
      FROM inventory_logs l
      JOIN users u ON l.user_id = u.id
      WHERE u.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE
    `;

    const [todayResult, weekResult, monthResult, todaysLogsResult] = await Promise.all([
      todayQuery,
      weekQuery,
      monthQuery,
      todaysLogsQuery,
    ]);

    return NextResponse.json({
      today: todayResult.rows[0].total,
      week: weekResult.rows[0].total,
      month: monthResult.rows[0].total,
      todaysLogs: todaysLogsResult.rows[0].total,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});