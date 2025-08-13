import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { handleError, UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { createSession } from '@/lib/auth';

export const POST = handleError(async (request: Request) => {
  const { username, password, rememberMe } = await request.json();

  const { rows: userResult } = await sql`SELECT * FROM users WHERE username = ${username}`;

  if (userResult.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = userResult[0];

  if (!user.is_active) {
    throw new ForbiddenError('Your account is currently inactive. Please contact an administrator.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    organization_id: user.organization_id,
  };

  const token = await createSession(payload, rememberMe);

  const userResponse = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    organization_id: user.organization_id,
    is_active: user.is_active,
  };

  const response = NextResponse.json({ user: userResponse });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days or 1 day
    path: '/',
  });

  return response;
});