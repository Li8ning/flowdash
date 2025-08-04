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
    const { name, sku, model, color, image_url } = await req.json();
    
    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required fields' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO products (name, sku, model, color, image_url, organization_id)
      VALUES (${name}, ${sku}, ${model}, ${color}, ${image_url}, ${organization_id})
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});