'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import { CookiesProvider } from 'react-cookie';
import AppInitializer from './AppInitializer';
import theme from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <CookiesProvider>
          <AuthProvider>
            <AppInitializer>{children}</AppInitializer>
          </AuthProvider>
        </CookiesProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}