import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;

    const result = await sql`
      SELECT DISTINCT color FROM products
      WHERE organization_id = ${organization_id} AND color IS NOT NULL AND color != ''
      ORDER BY color
    `;

    const colors = result.map((row: any) => row.color);
    return NextResponse.json(colors);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});