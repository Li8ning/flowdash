import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Get all users in the admin's organization
const getHandler = async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'active', 'inactive', or 'all'
    const search = searchParams.get('search');
    const { organization_id } = req.user;

    let query = sql`SELECT id, username, name, role, is_active FROM users WHERE organization_id = ${organization_id}`;

    if (status === 'inactive') {
      query = sql`${query} AND is_active = false`;
    } else if (status !== 'all') {
      query = sql`${query} AND (is_active = true OR is_active IS NULL)`;
    }

    if (search) {
      query = sql`${query} AND (username ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'})`;
    }

    const users = await query;

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

// Invite a new "Floor Staff" user
const postHandler = async (req: AuthenticatedRequest) => {
  try {
    const { username, password, role, name } = await req.json();
    const { organization_id } = req.user; // Admin's organization

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [newUser] = await sql`
      INSERT INTO users (username, name, password_hash, role, organization_id)
      VALUES (${username}, ${name}, ${password_hash}, ${role}, ${organization_id})
      RETURNING id, username, role, name, is_active
    `;

    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    console.error(err);
    const error = err as Error;
    // Handle unique constraint violation for username
    if (error.message.includes('duplicate key value violates unique constraint "users_username_key"')) {
        return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler, ['factory_admin']);
export const POST = withAuth(postHandler, ['factory_admin']);