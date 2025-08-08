import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { SignJWT } from 'jose';
import { HandlerContext } from '@/lib/auth';

// Change user password
const putHandler = async (req: AuthenticatedRequest, context: HandlerContext) => {
  const { params } = context;
  const userId = parseInt(params.id as string, 10);
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

    const { rows: [updatedUser] } = await sql`
      SELECT id, name, username, role, language, is_active, organization_id FROM users WHERE id = ${userId}
    `;

    const token = await new SignJWT({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      organization_id: updatedUser.organization_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    const response = NextResponse.json({ user: updatedUser });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (err) {
    logger.error({ err }, 'Failed to update password');
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PUT = withAuth(putHandler);