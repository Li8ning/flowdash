import { NextRequest, NextResponse } from 'next/server';
import acceptLanguage from 'accept-language';
import { fallbackLng, languages } from './app/i18n/settings';

acceptLanguage.languages(languages);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};

const cookieName = 'i18next';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`[MIDDLEWARE] Processing request for: ${pathname}`);

  // Step 1: Determine language from cookie or headers
  let lng: string | undefined;
  if (req.cookies.has(cookieName)) {
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value) || undefined;
  }
  if (!lng) {
    lng = acceptLanguage.get(req.headers.get('Accept-Language')) || undefined;
  }
  if (!lng) {
    lng = fallbackLng;
  }

  // Step 2: Redirect if locale is missing from path
  const pathnameIsMissingLocale = languages.every(
    (loc) => !pathname.startsWith(`/${loc}/`) && pathname !== `/${loc}`
  );

  if (pathnameIsMissingLocale) {
    // Prepend the detected language to the path
    return NextResponse.redirect(
      new URL(`/${lng}${pathname.startsWith('/') ? '' : '/'}${pathname}`, req.url)
    );
  }

  const response = NextResponse.next();

  // Step 3: Set the language cookie if the URL has a language
  const currentLngInPath = languages.find((loc) => pathname.startsWith(`/${loc}`));
  if (currentLngInPath) {
    if (req.cookies.get(cookieName)?.value !== currentLngInPath) {
      response.cookies.set(cookieName, currentLngInPath, { path: '/' });
    }
  }

  return response;
}