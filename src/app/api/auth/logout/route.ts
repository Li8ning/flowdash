import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleError } from '../../../../lib/errors';

export const dynamic = 'force-dynamic';

export const GET = handleError(async () => {
  cookies().set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Expire the cookie immediately
    path: '/',
  });

  return NextResponse.json({ message: 'Logged out successfully' });
});