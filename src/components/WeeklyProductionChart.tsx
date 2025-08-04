'use client';

import { Box, Heading, useColorModeValue, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface WeeklyData {
  labels: string[];
  data: number[];
}

const WeeklyProductionChart = () => {
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
          title: 'Error fetching weekly production data.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchWeeklyProduction();
  }, [toast]);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Production Quantity',
        data: chartData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
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
        text: 'Last 7 Days Production',
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
      <Bar data={data} options={options} />
    </Box>
  );
};

export default WeeklyProductionChart;