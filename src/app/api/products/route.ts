import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth';
import sql from '../../../lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const rows = await sql`
      SELECT *
      FROM products
      WHERE organization_id = ${organization_id}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { organization_id } = req.user;
    const { name, color, model, quantity } = await req.json();
    
    if (!name || !color || !model || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO products (name, color, model, quantity, organization_id)
      VALUES (${name}, ${color}, ${model}, ${quantity}, ${organization_id})
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});