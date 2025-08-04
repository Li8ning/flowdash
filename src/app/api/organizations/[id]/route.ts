import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const rows = await sql`SELECT name FROM organizations WHERE id = ${id}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const { name } = await req.json();
    const { organization_id, role } = req.user;

    if (role !== 'factory_admin' || Number(id) !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE organizations 
      SET name = ${name} 
      WHERE id = ${id} 
      RETURNING id, name
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});