import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import { handleError, ForbiddenError, BadRequestError, NotFoundError, ConflictError } from '@/lib/errors';

const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").optional(),
  username: z.string().min(3, "Username must be at least 3 characters.").optional(),
  language: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'floor_staff']).optional(),
}).strict();

interface HandlerContext {
  params: { id: string };
}

export const PATCH = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const body = await req.json();
  const validationResult = updateUserSchema.safeParse(body);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }

  const { name, language, username, role: newRole } = validationResult.data;
  const userId = parseInt(params.id, 10);
  const { id: currentUserId, role: currentUserRole, organization_id } = authResult.user;

  const isSelf = (currentUserId as number) === userId;
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';

  if (!isSelf && !isAdmin) {
    throw new ForbiddenError();
  }

  if (newRole) {
    if (!isAdmin) {
      throw new ForbiddenError('You are not authorized to change roles.');
    }
    if (newRole === 'super_admin' && currentUserRole !== 'super_admin') {
      throw new ForbiddenError('Only super_admins can assign super_admin role.');
    }
  }

  const { rows: [userRecord] } = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (!userRecord) {
    throw new NotFoundError('User not found.');
  }

  if (username && username.toLowerCase() !== userRecord.username.toLowerCase()) {
    const { rows: [existingUser] } = await sql`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND id != ${userId}
    `;
    if (existingUser) {
      throw new ConflictError('Username is already taken.');
    }
  }

  if (isSelf && newRole && newRole !== currentUserRole && (currentUserRole === 'super_admin' || currentUserRole === 'admin')) {
    const { rowCount } = await sql`
      SELECT 1 FROM users
      WHERE organization_id = ${organization_id as number} AND role = ${currentUserRole as string} AND id != ${currentUserId as number}
    `;
    if (rowCount === 0) {
      throw new ForbiddenError(`Cannot demote the last ${currentUserRole}.`);
    }
  }

  const newName = name || userRecord.name;
  const newLanguage = language || userRecord.language;
  const newUsername = username || userRecord.username;
  const finalRole = newRole || userRecord.role;

  const { rows: [updatedUser] } = await sql`
    UPDATE users
    SET name = ${newName}, language = ${newLanguage}, username = ${newUsername}, role = ${finalRole}
    WHERE id = ${userId}
    RETURNING id, name, username, role, language, is_active, organization_id
  `;

  return NextResponse.json(updatedUser);
});

export const DELETE = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const userId = parseInt(params.id, 10);
  const { id: currentUserId, role: currentUserRole } = authResult.user;

  if (!['admin', 'super_admin'].includes(currentUserRole as string)) {
    throw new ForbiddenError();
  }

  if ((currentUserId as number) === userId) {
    throw new BadRequestError('You cannot delete your own account.');
  }

  const { rowCount } = await sql`
    UPDATE users SET is_active = false WHERE id = ${userId}
  `;

  if (rowCount === 0) {
    throw new NotFoundError('User not found.');
  }

  return NextResponse.json({ message: 'User deactivated successfully.' });
});