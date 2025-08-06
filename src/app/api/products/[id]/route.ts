import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const { id } = context.params;
    const { organization_id } = req.user;

    const { rows } = await sql`
      SELECT *
      FROM products
      WHERE id = ${id} AND organization_id = ${organization_id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});