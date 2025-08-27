'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Spinner } from '@chakra-ui/react';
import { languages } from '@/app/i18n/settings';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define path variables for reuse
  const langRegex = new RegExp(`^/(${languages.join('|')})`);
  const basePathWithLng = pathname.replace(langRegex, '');
  const basePath = basePathWithLng || '/';
  const isAuthPage = basePath === '/' || basePath === '/register';

  useEffect(() => {
    if (loading) {
      console.log(`[APP_INITIALIZER] Still loading, waiting...`);
      return;
    }

    const currentLang = pathname.split('/')[1] || 'en';
    console.log(`[APP_INITIALIZER] Processing redirect logic:`, {
      user: user ? 'logged in' : 'not logged in',
      isAuthPage,
      pathname,
      currentLang
    });

    if (user && isAuthPage) {
      // If user is logged in and on an auth page, redirect to their dashboard
      // using their preferred language if available.
      const lang = user.language || currentLang;
      console.log(`[APP_INITIALIZER] Redirecting logged-in user from auth page to dashboard: /${lang}/dashboard`);
      router.push(`/${lang}/dashboard`);
    } else if (!user && !isAuthPage) {
      // If user is not logged in and on a protected page, redirect to the
      // login page for the current language.
      console.log(`[APP_INITIALIZER] Redirecting unauthenticated user from protected page to login: /${currentLang}`);
      router.push(`/${currentLang}`);
    } else {
      console.log(`[APP_INITIALIZER] No redirect needed`);
    }
  }, [user, loading, router, pathname, isAuthPage]);

  // Show loading spinner while authentication is being verified
  if (loading) {
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="rgba(255, 255, 255, 0.8)"
        zIndex="9999"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  // Don't render anything for unauthenticated users on protected pages
  // The redirect will happen in the useEffect above
  if (!user && !isAuthPage) {
    return null;
  }

  return <>{children}</>;
};

export default AppInitializer;