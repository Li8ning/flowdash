'use client';

import UserManager from '@/components/UserManager';
import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export default function UsersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role !== 'factory_admin') {
    return (
      <Box p={8}>
        <Heading as="h2" size="lg" mb={4}>{t('access_denied.title')}</Heading>
        <Text>{t('access_denied.description')}</Text>
      </Box>
    );
  }

  return <UserManager />;
}