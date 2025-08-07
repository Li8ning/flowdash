'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import GlobalSpinner from './GlobalSpinner';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for the auth state to be determined

    const isAuthPage = pathname === '/' || pathname === '/register';

    if (user && isAuthPage) {
      router.push('/dashboard');
    } else if (!user && pathname === '/dashboard') {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <GlobalSpinner />;
  }

  // Render children only when loading is complete
  const isAuthPage = pathname === '/' || pathname === '/register';
  if (!user && !isAuthPage) {
    // If not logged in and not on an auth page, don't render children
    // The useEffect above will have already initiated a redirect
    return <GlobalSpinner />;
  }

  return <>{children}</>;
};

export default AppInitializer;