'use client';

import { Box, useColorModeValue, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeeklyData {
  labels: string[];
  data: number[];
}

const WeeklyProductionChart = () => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<WeeklyData>({ labels: [], data: [] });
  const toast = useToast();
  const chartTextColor = useColorModeValue('gray.800', 'white');
  const chartGridColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)');

  useEffect(() => {
    const fetchWeeklyProduction = async () => {
      try {
        const response = await api.get('/inventory/summary/weekly-production');
        setChartData(response.data);
      } catch (error) {
        console.error('Error fetching weekly production data:', error);
        toast({
          title: t('weekly_production_chart.toast.error_fetching_data'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchWeeklyProduction();
  }, [toast, t]);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: t('weekly_production_chart.label'),
        data: chartData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTextColor,
        },
      },
      title: {
        display: true,
        text: t('weekly_production_chart.title'),
        color: chartTextColor,
        font: {
          size: 16,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: chartTextColor,
        },
        grid: {
          color: chartGridColor,
        },
      },
      x: {
        ticks: {
          color: chartTextColor,
        },
        grid: {
          color: chartGridColor,
        },
      },
    },
  };

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} shadow="lg" borderWidth="1px" borderColor="brand.lightBorder" borderRadius="xl" h={{ base: '300px', md: '400px' }}>
      <Line data={data} options={options} />
    </Box>
  );
};

export default WeeklyProductionChart;