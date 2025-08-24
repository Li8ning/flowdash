import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { loadKeys } from './lib/auth';
import { KeyObject } from 'crypto';

const publicPaths = ['/', '/register'];

// Initialize keys
let publicKey: KeyObject | CryptoKey;
loadKeys().then(keys => {
  publicKey = keys.publicKey;
}).catch((err: unknown) => {
  console.error('Failed to load keys in middleware:', err);
  process.exit(1);
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const isPublicPath = publicPaths.includes(pathname);

  if (isPublicPath) {
    if (token) {
      try {
        await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
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
    await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
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