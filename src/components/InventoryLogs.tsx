'use client';

import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import EditLogModal from '@/components/EditLogModal';
import { useAuth } from '@/context/AuthContext';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Box,
  Flex,
  Select,
  SimpleGrid,
  Heading,
  Divider,
  TableContainer,
} from '@chakra-ui/react';

interface InventoryLog {
  id: number;
  product_name: string;
  color: string;
  model: string;
  quantity_change: number;
  created_at: string;
  username?: string;
}

interface InventoryLogsProps {
  allLogs?: boolean;
}

const InventoryLogs: React.FC<InventoryLogsProps> = ({ allLogs = false }) => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    user: '',
    product: '',
    color: '',
    model: '',
  });
  const [distinctUsers, setDistinctUsers] = useState([]);
  const [distinctProducts, setDistinctProducts] = useState([]);
  const [distinctColors, setDistinctColors] = useState([]);
  const [distinctModels, setDistinctModels] = useState([]);

  const fetchDistinctValues = async () => {
    try {
      const [usersRes, productsRes, colorsRes, modelsRes] = await Promise.all([
        api.get('/inventory/distinct-users'),
        api.get('/inventory/distinct-products'),
        api.get('/inventory/distinct-colors'),
        api.get('/inventory/distinct-models'),
      ]);
      setDistinctUsers(usersRes.data);
      setDistinctProducts(productsRes.data);
      setDistinctColors(colorsRes.data);
      setDistinctModels(modelsRes.data);
    } catch (err) {
      console.error('Failed to fetch distinct filter values', err);
    }
  };


  useEffect(() => {
    if (allLogs) {
      fetchDistinctValues();
    }
  }, [allLogs]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const url = allLogs ? '/inventory/logs' : '/inventory/logs/me';
        const { data } = await api.get(url, { params: filters });
        setLogs(data);
      } catch (err) {
        setError('Failed to fetch inventory logs.');
        console.error(err);
      }
    };

    fetchLogs();
  }, [filters, allLogs]);

  const isEditable = (createdAt: string) => {
    if (user?.role === 'factory_admin') {
      return true;
    }
    const logTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    return currentTime - logTime < 24 * 60 * 60 * 1000;
  };

  const handleDelete = async (logId: number) => {
    try {
      await api.delete(`/inventory/log/${logId}`);
      setLogs(logs.filter((log) => log.id !== logId));
      toast({
        title: 'Log deleted.',
        description: 'The inventory log has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error deleting log.',
        description: 'You do not have permission to delete this log.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Failed to delete log:', err);
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  const handleUpdate = (updatedLog: InventoryLog) => {
    setLogs(
      logs.map((log) =>
        log.id === updatedLog.id ? { ...log, ...updatedLog } : log
      )
    );
  };

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Heading as="h2" size="lg" mb={4}>Inventory Logs</Heading>
      <Divider mb={6} />
      {allLogs && (
        <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4} mb={6}>
          <Select
            placeholder="Filter by User"
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          >
            {distinctUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Product"
            value={filters.product}
            onChange={(e) =>
              setFilters({ ...filters, product: e.target.value })
            }
          >
            {distinctProducts.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Color"
            value={filters.color}
            onChange={(e) => setFilters({ ...filters, color: e.target.value })}
          >
            {distinctColors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Model"
            value={filters.model}
            onChange={(e) => setFilters({ ...filters, model: e.target.value })}
          >
            {distinctModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Button
            onClick={() =>
              setFilters({ user: '', product: '', color: '', model: '' })
            }
            colorScheme="gray"
          >
            Clear Filters
          </Button>
        </SimpleGrid>
      )}
      <Box overflowX="auto">
        <TableContainer>
          <Table variant="simple" colorScheme="teal">
            <Thead bg="brand.background">
              <Tr>
                <Th>Product Name</Th>
              <Th>Color</Th>
              <Th>Model</Th>
              {allLogs && <Th>User</Th>}
              <Th isNumeric>Quantity Change</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map((log) => (
              <Tr key={log.id}>
                <Td>{log.product_name}</Td>
                <Td>{log.color}</Td>
                <Td>{log.model}</Td>
                {allLogs && <Td>{log.username}</Td>}
                <Td isNumeric>{log.quantity_change}</Td>
                <Td>{new Date(log.created_at).toLocaleString()}</Td>
                <Td>
                  <Flex>
                    <Button
                      size="sm"
                      mr={2}
                      disabled={!isEditable(log.created_at)}
                      onClick={() => setEditingLog(log)}
                    >
                      Edit
                    </Button>
                    {user?.role === 'factory_admin' && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(log.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
          </Table>
        </TableContainer>
      </Box>
      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onUpdate={handleUpdate}
        />
      )}
    </Box>
  );
};

export default InventoryLogs;