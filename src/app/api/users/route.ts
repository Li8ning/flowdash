import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';
import { handleError, ForbiddenError, BadRequestError, ConflictError } from '@/lib/errors';
import { userSchema } from '@/schemas/user';
import { withValidation } from '@/lib/validations';

// Get all users in the admin's organization
export const GET = handleError(async (req: NextRequest) => {
  const authResult = await verifyAuth(req);
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: authResult.status }
    );
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
export const POST = handleError(
  withValidation(userSchema, async (req: NextRequest, body) => {
    const authResult = await verifyAuth(req);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status }
      );
    }
    const { role: creatorRole, organization_id } = authResult.user;
    if (!['admin', 'super_admin'].includes(creatorRole as string)) {
      throw new ForbiddenError();
    }

    const { username, password, role, name } = body;

    if (creatorRole === 'admin' && role === 'super_admin') {
    throw new ForbiddenError('Admins cannot create super admins.');
  }

  if (!password) {
    throw new BadRequestError('Password is required when creating a user.');
  }

  // Check if username is already taken (case-insensitive)
  const { rows: existingUsers } = await sql`
    SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) AND organization_id = ${organization_id as number}
  `;

  if (existingUsers.length > 0) {
    throw new ConflictError('Username is already taken.');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const { rows: [newUser] } = await sql`
    INSERT INTO users (username, name, password_hash, role, organization_id, is_active)
    VALUES (${username}, ${name}, ${password_hash}, ${role}, ${organization_id as number}, true)
    RETURNING id, username, role, name, is_active
  `;
  return NextResponse.json(newUser, { status: 201 });
  })
);