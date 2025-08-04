import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const { name, color, model, quantity } = await req.json();
    const { organization_id } = req.user;

    if (!name || !color || !model || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE products
      SET name = ${name}, color = ${color}, model = ${model}, quantity = ${quantity}
      WHERE id = ${id} AND organization_id = ${organization_id}
      RETURNING *
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

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const { organization_id } = req.user;

    const result = await sql`
      DELETE FROM products WHERE id = ${id} AND organization_id = ${organization_id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});