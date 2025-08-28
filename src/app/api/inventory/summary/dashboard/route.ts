import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-utils';
import sql from '../../../../../lib/db';
import { handleError } from '../../../../../lib/errors';
import { NextRequest } from 'next/server';

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { organization_id } = authResult.user;

  const orgId = organization_id as number;
  if (!orgId) {
    return NextResponse.json({ error: 'User is not associated with an organization' }, { status: 400 });
  }

  const todayQuery = sql`
    SELECT COALESCE(SUM(produced), 0) as total
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE p.organization_id = ${orgId} AND l.created_at >= CURRENT_DATE
  `;

  const weekQuery = sql`
    SELECT COALESCE(SUM(produced), 0) as total
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE p.organization_id = ${orgId} AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'
  `;

  const monthQuery = sql`
    SELECT COALESCE(SUM(produced), 0) as total
    FROM inventory_logs l
    JOIN products p ON l.product_id = p.id
    WHERE p.organization_id = ${orgId} AND l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  `;

  const todaysLogsQuery = sql`
    SELECT COUNT(*) as total
    FROM inventory_logs l
    JOIN users u ON l.user_id = u.id
    WHERE u.organization_id = ${orgId} AND l.created_at >= CURRENT_DATE
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
});