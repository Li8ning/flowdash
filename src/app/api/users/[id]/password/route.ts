import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleError, ForbiddenError, BadRequestError, NotFoundError, UnauthorizedError } from '@/lib/errors';

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
});

interface HandlerContext {
  params: { id: string };
}

// Change user password
export const PUT = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const userId = parseInt(params.id, 10);

  // For now, only allow users to change their own password.
  if (authResult.user.id !== userId) {
    throw new ForbiddenError();
  }

  const body = await req.json();
  const validationResult = passwordSchema.safeParse(body);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }

  const { currentPassword, newPassword } = validationResult.data;

  const { rows: [userRecord] } = await sql`
    SELECT password_hash FROM users WHERE id = ${userId}
  `;

  if (!userRecord) {
    throw new NotFoundError('User not found.');
  }

  const isMatch = await bcrypt.compare(currentPassword, userRecord.password_hash as string);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid current password.');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

  await sql`
    UPDATE users
    SET password_hash = ${password_hash}
    WHERE id = ${userId}
  `;

  return NextResponse.json({ message: 'Password updated successfully.' });
});