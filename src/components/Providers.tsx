'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/context/AuthContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import AppInitializer from './AppInitializer';
import GlobalSpinner from './GlobalSpinner';
import theme from '@/theme/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <LanguageProvider>
            <AuthProvider>
              <LoadingProvider>
                <GlobalSpinner />
                <AppInitializer>{children}</AppInitializer>
              </LoadingProvider>
            </AuthProvider>
          </LanguageProvider>
        </I18nextProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}