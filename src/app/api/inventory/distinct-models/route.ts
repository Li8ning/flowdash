import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const rows = await sql`
      SELECT DISTINCT model
      FROM products
      WHERE organization_id = ${organization_id}
    `;
    return NextResponse.json(rows.map((row: any) => row.model));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});