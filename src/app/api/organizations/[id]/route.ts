import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import logger from '../../../../lib/logger';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
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
});

export const PUT = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const { name } = await req.json();
    const { id } = context.params;
    const { organization_id, role } = req.user;

    if (role !== 'factory_admin' || Number(id) !== organization_id) {
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
});