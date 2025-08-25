import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import csrf from 'edge-csrf';

const csrfProtect = csrf();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  try {
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('CSRF protection error:', error);
    return new NextResponse('Invalid CSRF token', { status: 403 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};