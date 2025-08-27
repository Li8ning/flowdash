'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import GlobalSpinner from './GlobalSpinner';
import { languages } from '@/app/i18n/settings';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for the auth state to be determined

    const langRegex = new RegExp(`^/(${languages.join('|')})`);
    const basePathWithLng = pathname.replace(langRegex, '');
    const basePath = basePathWithLng || '/';

    const isAuthPage = basePath === '/' || basePath === '/register';

    if (user && isAuthPage) {
      router.push(`/${pathname.split('/')[1]}/dashboard`);
    } else if (!user && pathname.endsWith('/dashboard')) {
      router.push(`/${pathname.split('/')[1]}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <GlobalSpinner />;
  }

  // Render children only when loading is complete
  const langRegex = new RegExp(`^/(${languages.join('|')})`);
  const basePathWithLng = pathname.replace(langRegex, '');
  const basePath = basePathWithLng || '/';
  const isAuthPage = basePath === '/' || basePath === '/register';

  if (!user && !isAuthPage) {
    // If not logged in and not on an auth page, don't render children
    // The useEffect above will have already initiated a redirect
    return <GlobalSpinner />;
  }

  return <>{children}</>;
};

export default AppInitializer;