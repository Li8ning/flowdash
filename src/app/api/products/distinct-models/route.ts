import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    const result = await sql`
      SELECT DISTINCT model FROM products
      WHERE organization_id = ${organization_id} AND model IS NOT NULL AND model != ''
      ORDER BY model
    `;

    const models = result.map((row: any) => row.model);
    return NextResponse.json(models);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});