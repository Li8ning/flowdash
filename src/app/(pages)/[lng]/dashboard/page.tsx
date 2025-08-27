'use client';

import { useAuth } from '@/context/AuthContext';
import ProductionDashboard from '@/components/ProductionDashboard';
import ProductSelector from '@/components/ProductSelector';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'super_admin' || user?.role === 'admin') {
    return <ProductionDashboard />;
  }

  if (user?.role === 'floor_staff') {
    return <ProductSelector />;
  }

  return (
    <Box p={8}>
      <Heading>{t('unassigned.role.title')}</Heading>
      <Text>{t('unassigned.role.description')}</Text>
    </Box>
  );
}