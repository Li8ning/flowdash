import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import logger from '../../../../lib/logger';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id } = req.user;
    const { rows } = await sql`SELECT id, username, name, role, organization_id, is_active, language FROM users WHERE id = ${id}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch user');
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
});