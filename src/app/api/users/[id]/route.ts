import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import logger from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

const patchHandler = async (req: AuthenticatedRequest, context: RouteParams) => {
  const { name, language } = await req.json();
  const userId = parseInt(context.params.id, 10);
  const { id: currentUserId, role } = req.user;

  if (currentUserId !== userId && role !== 'factory_admin') {
    return NextResponse.json({ msg: 'You are not authorized to perform this action.' }, { status: 403 });
  }

  if (!name && !language) {
    return NextResponse.json({ msg: 'No update information provided.' }, { status: 400 });
  }

  try {
    const { rows: [userRecord] } = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (!userRecord) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const newName = name || userRecord.name;
    const newLanguage = language || userRecord.language;

    const { rows: [updatedUser] } = await sql`
      UPDATE users
      SET name = ${newName}, language = ${newLanguage}
      WHERE id = ${userId}
      RETURNING id, name, username, role, language, is_active, organization_id
    `;

    return NextResponse.json(updatedUser);
  } catch (err) {
    logger.error({ err }, 'Failed to update user');
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PATCH = withAuth(patchHandler);