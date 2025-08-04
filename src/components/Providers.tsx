'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import AppInitializer from './AppInitializer';
import theme from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <AppInitializer>{children}</AppInitializer>
        </AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}