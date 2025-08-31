'use client';

import StockManager from '@/components/StockManager';
import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export default function StockPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <Box textAlign="center" py={10} px={6} mt={20}>
        <Heading as="h2" size="xl" mt={6} mb={2}>
          {t('access_denied.title')}
        </Heading>
        <Text color={'gray.500'}>
          {t('access_denied.description')}
        </Text>
      </Box>
    );
  }

  return <StockManager />;
}