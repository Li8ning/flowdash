import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is not set or is too weak.');
    return NextResponse.json({ msg: 'Internal Server Error' }, { status: 500 });
  }
  const JWT_SECRET = process.env.JWT_SECRET;
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    const { username, password, rememberMe } = await request.json();

    const { rows: userResult } = await sql`SELECT * FROM users WHERE username = ${username}`;

    if (userResult.length === 0) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult[0];

    if (!user.is_active) {
      return NextResponse.json({ msg: 'Your account is currently inactive. Please contact an administrator.' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ msg: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      organization_id: user.organization_id,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(rememberMe ? '30d' : '1d')
      .sign(secret);

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
      is_active: user.is_active,
    };

    return NextResponse.json({ token, user: userResponse });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Login error:', message);
    return NextResponse.json({ msg: 'Server error', details: message }, { status: 500 });
  }
}