'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import { LoadingProvider } from '@/context/LoadingContext';
import AppInitializer from './AppInitializer';
import GlobalSpinner from './GlobalSpinner';
import theme from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <LoadingProvider>
            <GlobalSpinner />
            <AppInitializer>{children}</AppInitializer>
          </LoadingProvider>
        </AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}