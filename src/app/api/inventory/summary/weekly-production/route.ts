import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth';
import sql from '../../../../../lib/db';
import logger from '../../../../../lib/logger';

interface WeeklyDataRow {
  date: string;
  total: string; // The count from the DB is a string
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

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
        WHERE p.organization_id = ${organization_id} AND l.created_at >= CURRENT_DATE - INTERVAL '6 days'
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    logger.error({ err }, 'Failed to fetch weekly production summary');
    return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
  }
});