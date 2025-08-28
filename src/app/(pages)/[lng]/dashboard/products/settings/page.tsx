'use client';

import ProductAttributesManager from '@/components/ProductAttributesManager';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Box, Heading, Text } from '@chakra-ui/react';

export default function ProductSettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'floor_staff') {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Heading as="h2" size="xl" mt={6} mb={2}>
          {t('access_denied.title')}
        </Heading>
        <Text color={'gray.500'}>
          {t('access_denied.description')}
        </Text>
      </Box>
    );
  }

  return <ProductAttributesManager />;
}