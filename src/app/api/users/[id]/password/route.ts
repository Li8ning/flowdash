import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// Change user password
const putHandler = async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const userId = parseInt(params.id, 10);
  const { currentPassword, newPassword } = await req.json();
  const { id: currentUserId } = req.user;

  // A user can change their own password, or an admin can change any user's password.
  // For simplicity, we'll only allow users to change their own password for now.
  if (currentUserId !== userId) {
    return NextResponse.json({ msg: 'You are not authorized to perform this action.' }, { status: 403 });
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ msg: 'Current password and new password are required.' }, { status: 400 });
  }

  try {
    const { rows: [userRecord] } = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;

    if (!userRecord) {
      return NextResponse.json({ msg: 'User not found.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRecord.password_hash as string);
    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid current password.' }, { status: 401 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await sql`
      UPDATE users
      SET password_hash = ${password_hash}
      WHERE id = ${userId}
    `;

    return NextResponse.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err }, 'Failed to update password');
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = withAuth(putHandler);