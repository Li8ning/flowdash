'use client';

import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import WeeklyProductionChart from '@/components/WeeklyProductionChart';

interface DashboardSummary {
  today: number;
  week: number;
  month: number;
  todaysLogs: number;
}

const ProductionDashboard = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary>({
    today: 0,
    week: 0,
    month: 0,
    todaysLogs: 0,
  });
  const toast = useToast();

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const response = await api.get('/inventory/summary/dashboard');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        toast({
          title: t('production_dashboard.toast.error_fetching_summary'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchDashboardSummary();
  }, [toast, t]);

  return (
    <Box p={0}>
      <Heading size={{ base: 'sm', md: 'lg' }} mb={{ base: 4, md: 6 }} px={{ base: 4, md: 6 }}>{t('production_dashboard.title')}</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 4, md: 6 }} mb={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        <Stat bg="brand.surface" p={{ base: 4, md: 5 }} shadow="lg" borderWidth="1px" borderColor="brand.lightBorder" borderRadius="xl">
          <StatLabel fontWeight="bold" color="brand.textSecondary">{t('production_dashboard.todays_production')}</StatLabel>
          <StatNumber fontSize="3xl" color="brand.textPrimary">{summary.today}</StatNumber>
        </Stat>
        <Stat bg="brand.surface" p={{ base: 4, md: 5 }} shadow="lg" borderWidth="1px" borderColor="brand.lightBorder" borderRadius="xl">
          <StatLabel fontWeight="bold" color="brand.textSecondary">{t('production_dashboard.this_weeks_production')}</StatLabel>
          <StatNumber fontSize="3xl" color="brand.textPrimary">{summary.week}</StatNumber>
        </Stat>
        <Stat bg="brand.surface" p={{ base: 4, md: 5 }} shadow="lg" borderWidth="1px" borderColor="brand.lightBorder" borderRadius="xl">
          <StatLabel fontWeight="bold" color="brand.textSecondary">{t('production_dashboard.this_months_production')}</StatLabel>
          <StatNumber fontSize="3xl" color="brand.textPrimary">{summary.month}</StatNumber>
        </Stat>
        <Stat bg="brand.surface" p={{ base: 4, md: 5 }} shadow="lg" borderWidth="1px" borderColor="brand.lightBorder" borderRadius="xl">
          <StatLabel fontWeight="bold" color="brand.textSecondary">{t('production_dashboard.todays_log_entries')}</StatLabel>
          <StatNumber fontSize="3xl" color="brand.textPrimary">{summary.todaysLogs}</StatNumber>
        </Stat>
      </SimpleGrid>
      <Box px={{ base: 4, md: 6 }}>
        <WeeklyProductionChart />
      </Box>
    </Box>
  );
};

export default ProductionDashboard;