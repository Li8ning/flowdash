'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

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
    // You can return a global loading spinner here if you want
    return null;
  }

  return <>{children}</>;
};

export default AppInitializer;