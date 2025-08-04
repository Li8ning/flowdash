'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
} from '@chakra-ui/react';
import api from '@/lib/api';

interface Log {
  id: number;
  product_name: string;
  color: string;
  model: string;
  username: string;
  quantity_change: number;
  created_at: string;
}

const Reports = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/inventory/logs');
        setLogs(data);
      } catch {
        toast({
          title: 'Error fetching logs.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchLogs();
  }, [toast]);

  return (
    <Box p={8}>
      <Heading mb={4}>Inventory Logs</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Product</Th>
            <Th>Color</Th>
            <Th>Model</Th>
            <Th>User</Th>
            <Th isNumeric>Quantity Change</Th>
            <Th>Date</Th>
          </Tr>
        </Thead>
        <Tbody>
          {logs.map((log) => (
            <Tr key={log.id}>
              <Td>{log.product_name}</Td>
              <Td>{log.color}</Td>
              <Td>{log.model}</Td>
              <Td>{log.username}</Td>
              <Td isNumeric>{log.quantity_change}</Td>
              <Td>{new Date(log.created_at).toLocaleString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Reports;