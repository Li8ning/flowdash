import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    cookies().set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: -1, // Expire the cookie immediately
      path: '/',
    });

    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}