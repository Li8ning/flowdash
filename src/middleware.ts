import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/auth-edge';

const publicPaths = ['/', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const isPublicPath = publicPaths.includes(pathname);

  if (isPublicPath) {
    if (token) {
      try {
        await verifyJwt(token);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Invalid token, let them proceed to the public path but clear the cookie
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    await verifyJwt(token);
    return NextResponse.next();
  } catch (err) {
    console.error('JWT Verification failed in middleware:', err);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};