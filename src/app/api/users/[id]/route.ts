import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import { z } from 'zod';
import { handleError, ForbiddenError, BadRequestError, NotFoundError, ConflictError } from '@/lib/errors';

// Reserved words that cannot be used as usernames
const RESERVED_WORDS = [
  'admin', 'root', 'system', 'superuser', 'administrator',
  'support', 'help', 'info', 'contact', 'webmaster',
  'api', 'test', 'demo', 'guest', 'user', 'null', 'undefined'
];

const baseUpdateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty.").optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens.")
    .refine((username) => !/^[._-]/.test(username), "Username cannot start with special characters.")
    .refine((username) => !/[._-]$/.test(username), "Username cannot end with special characters.")
    .refine((username) => !/[._-]{2,}/.test(username), "Username cannot have consecutive special characters.")
    .refine((username) => !RESERVED_WORDS.includes(username.toLowerCase()), "This username is not allowed.")
    .optional(),
  language: z.string().optional(),
});

const getUpdateUserSchema = (currentUserRole: string) => {
  if (currentUserRole === 'super_admin') {
    return baseUpdateUserSchema.extend({
      role: z.enum(['admin', 'floor_staff']).optional(),
    }).strict();
  }
  return baseUpdateUserSchema.extend({
    role: z.literal('floor_staff').optional(),
  }).strict();
};

interface HandlerContext {
  params: { id: string };
}

export const PATCH = handleError(async (req: NextRequest, { params }: HandlerContext) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  const body = await req.json();
  const { role: currentUserRole } = authResult.user;

  const updateUserSchema = getUpdateUserSchema(currentUserRole as string);
  const validationResult = updateUserSchema.safeParse(body);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }

  const { name, language, username, role: newRole } = validationResult.data;
  const userId = parseInt(params.id, 10);
  const { id: currentUserId, organization_id } = authResult.user;

  const isSelf = (currentUserId as number) === userId;
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';

  if (!isSelf && !isAdmin) {
    throw new ForbiddenError();
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