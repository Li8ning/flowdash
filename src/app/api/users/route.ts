import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { handleError, ForbiddenError, BadRequestError, ConflictError } from '@/lib/errors';

const UserRole = z.enum(['admin', 'floor_staff']);

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  name: z.string().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  role: UserRole,
});

// Get all users in the admin's organization
export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'active', 'inactive', or 'all'
  const search = searchParams.get('search');
  const { organization_id, role: requesterRole } = authResult.user;

  let query = `SELECT id, username, name, role, is_active FROM users WHERE organization_id = $1`;
  const params: (string | number)[] = [organization_id as number];
  let paramIndex = 2;

  if (requesterRole === 'admin') {
    query += ` AND role != 'super_admin'`;
  }

  if (status === 'inactive') {
    query += ` AND is_active = false`;
  } else if (status !== 'all') {
    query += ` AND (is_active = true OR is_active IS NULL)`;
  }

  if (search) {
    query += ` AND (username ILIKE $${paramIndex++} OR name ILIKE $${paramIndex++})`;
    params.push(`%${search}%`);
    params.push(`%${search}%`);
  }

  const { rows: users } = await sql.query(query, params);

  return NextResponse.json(users);
});

// Invite a new user
export const POST = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: authResult.status });
  }
  if (!['admin', 'super_admin'].includes(authResult.user.role as string)) {
    throw new ForbiddenError();
  }

  const body = await req.json();
  const validationResult = createUserSchema.safeParse(body);

  if (!validationResult.success) {
    throw new BadRequestError('Invalid input', validationResult.error.flatten());
  }
  
  const { username, password, role, name } = validationResult.data;
  const { organization_id, role: creatorRole } = authResult.user;

  // Enforce role creation hierarchy
  if (creatorRole === 'admin' && role !== 'floor_staff') {
    throw new ForbiddenError('Admins can only create Floor Staff.');
  }
  if (creatorRole === 'floor_staff') {
    throw new ForbiddenError('Floor Staff cannot create users.');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  try {
    const { rows: [newUser] } = await sql`
      INSERT INTO users (username, name, password_hash, role, organization_id, is_active)
      VALUES (${username}, ${name}, ${password_hash}, ${role}, ${organization_id as number}, true)
      RETURNING id, username, role, name, is_active
    `;
    return NextResponse.json(newUser, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505' && (err as Error).message.includes('users_username_key')) {
      throw new ConflictError('Username is already taken.');
    }
    throw err;
  }
});