import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-utils';
import sql from '../../../../lib/db';
import logger from '../../../../lib/logger';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { id } = context.params;
    const { rows } = await sql`SELECT name FROM organizations WHERE id = ${id}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch organization');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  
  try {
    const { name } = await req.json();
    const { id } = context.params;
    const { organization_id, role } = authResult.user;

    if (!['super_admin', 'admin'].includes(role as string) || Number(id) !== organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const { rows } = await sql`
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
    logger.error({ err }, 'Failed to update organization');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}