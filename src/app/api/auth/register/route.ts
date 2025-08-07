import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET is not set or is too weak.');
    return NextResponse.json({ msg: 'Internal Server Error' }, { status: 500 });
  }
  const JWT_SECRET = process.env.JWT_SECRET;
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { name, username, password, organizationName } = await request.json();

    if (!name || !username || !password || !organizationName) {
      return NextResponse.json({ msg: 'Please enter all fields' }, { status: 400 });
    }

    // Check if username already exists (case-insensitive)
    const { rows: existingUser } = await sql`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username})
    `;

    if (existingUser.length > 0) {
      return NextResponse.json({ msg: 'Username is already taken.' }, { status: 400 });
    }

    // In a real app, you'd use a transaction here
    const { rows: orgResult } = await sql`
      INSERT INTO organizations (name) VALUES (${organizationName}) RETURNING id
    `;
    const organization_id = orgResult[0].id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { rows: userResult } = await sql`
      INSERT INTO users (organization_id, name, username, password_hash, role, is_active)
      VALUES (${organization_id}, ${name}, ${username}, ${password_hash}, 'factory_admin', true)
      RETURNING id, name, username, role, is_active
    `;

    const user = userResult[0];

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      organization_id: organization_id,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        organization_id: organization_id,
        is_active: user.is_active,
      },
    }, { status: 201 });

  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    logger.error({ err: error }, 'Registration error');
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ msg: 'User or organization already exists' }, { status: 400 });
    }
    return NextResponse.json({ msg: 'Server error', details: error.message }, { status: 500 });
  }
}