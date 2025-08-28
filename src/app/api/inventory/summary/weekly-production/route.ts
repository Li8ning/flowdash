import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-utils';
import sql from '../../../../../lib/db';
import { handleError } from '../../../../../lib/errors';
import { NextRequest } from 'next/server';

interface WeeklyDataRow {
  date: string;
  total: string;
}

export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const { organization_id } = authResult.user;

  const { rows: result } = await sql`
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'
      )::date AS date
    ),
    daily_logs AS (
      SELECT
        DATE(l.created_at) as log_date,
        SUM(l.produced) as total
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.id
      WHERE p.organization_id = ${organization_id as number} AND l.created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY log_date
    )
    SELECT
      d.date,
      COALESCE(dl.total, 0) as total
    FROM date_series d
    LEFT JOIN daily_logs dl ON d.date = dl.log_date
    ORDER BY d.date;
  `;

  const typedResult = result as WeeklyDataRow[];
  const labels = typedResult.map((row) => new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' }));
  const data = typedResult.map((row) => Number(row.total));

  return NextResponse.json({ labels, data });
});