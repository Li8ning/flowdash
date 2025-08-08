import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import logger from '@/lib/logger';

import { HandlerContext } from '@/lib/auth';

const patchHandler = async (req: AuthenticatedRequest, context: HandlerContext) => {
  const { name, language, username } = await req.json();
  const userId = parseInt(context.params.id as string, 10);
  const { id: currentUserId, role } = req.user;

  if (currentUserId !== userId && role !== 'factory_admin') {
    return NextResponse.json({ msg: 'You are not authorized to perform this action.' }, { status: 403 });
  }

  if (!name && !language && !username) {
    return NextResponse.json({ msg: 'No update information provided.' }, { status: 400 });
  }

  try {
    const { rows: [userRecord] } = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (!userRecord) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    if (username && username !== userRecord.username) {
      const { rows: [existingUser] } = await sql`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${username})
      `;
      if (existingUser) {
        return NextResponse.json({ msg: 'Username is already taken.' }, { status: 409 });
      }
    }

    const newName = name || userRecord.name;
    const newLanguage = language || userRecord.language;
    const newUsername = username || userRecord.username;

    const { rows: [updatedUser] } = await sql`
      UPDATE users
      SET name = ${newName}, language = ${newLanguage}, username = ${newUsername}
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

const deleteHandler = async (req: AuthenticatedRequest, context: HandlerContext) => {
  const userId = parseInt(context.params.id as string, 10);
  const { id: currentUserId, role } = req.user;

  if (role !== 'factory_admin') {
    return NextResponse.json({ msg: 'You are not authorized to perform this action.' }, { status: 403 });
  }

  if (currentUserId === userId) {
    return NextResponse.json({ msg: 'You cannot delete your own account.' }, { status: 400 });
  }

  try {
    await sql`
      UPDATE users
      SET is_active = false
      WHERE id = ${userId}
    `;

    return NextResponse.json({ msg: 'User deactivated successfully.' });
  } catch (err) {
    logger.error({ err }, 'Failed to deactivate user');
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const DELETE = withAuth(deleteHandler);