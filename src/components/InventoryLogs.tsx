'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { exportToPdf, exportToExcel } from '../lib/export';
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
  Input,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Image,
} from '@chakra-ui/react';

interface InventoryLog {
  id: number;
  product_name: string;
  color: string;
  model: string;
  quantity_change: number;
  created_at: string;
  username?: string;
  image_url?: string;
}

interface InventoryLogsProps {
  allLogs?: boolean;
}

const InventoryLogs: React.FC<InventoryLogsProps> = ({ allLogs = false }) => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('today');

  const getInitialFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      user: '',
      product: '',
      color: '',
      model: '',
      startDate: today,
      endDate: today,
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [distinctUsers, setDistinctUsers] = useState<string[]>([]);
  const [distinctProducts, setDistinctProducts] = useState<string[]>([]);
  const [distinctColors, setDistinctColors] = useState<string[]>([]);
  const [distinctModels, setDistinctModels] = useState<string[]>([]);

  const fetchDistinctValues = useCallback(async () => {
    try {
      const [productsRes, colorsRes, modelsRes] = await Promise.all([
        api.get('/inventory/distinct-products'),
        api.get('/inventory/distinct-colors'),
        api.get('/inventory/distinct-models'),
      ]);
      setDistinctProducts(productsRes.data);
      setDistinctColors(colorsRes.data);
      setDistinctModels(modelsRes.data);

      if (allLogs) {
        const usersRes = await api.get('/inventory/distinct-users');
        setDistinctUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch distinct filter values', err);
      toast({
        title: 'Error',
        description: 'Could not load filter options.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [allLogs, toast]);

  useEffect(() => {
    fetchDistinctValues();
  }, [fetchDistinctValues]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const url = allLogs ? '/inventory/logs' : '/inventory/logs/me';
      const { data } = await api.get(url, { params: appliedFilters });
      setLogs(data);
    } catch (err) {
      console.error(err);
      if (err instanceof AxiosError && err.response?.status === 401) {
        // This is an auth error, handled by the global interceptor
        return;
      }
      toast({
        title: 'Error fetching logs',
        description: 'There was an issue retrieving the inventory logs.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [allLogs, appliedFilters, toast, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterClick = () => {
    if (dateRange === 'custom' && (!filters.startDate || !filters.endDate)) {
      toast({
        title: 'Invalid Date Range',
        description: 'Please select both a start and end date for the custom range.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const initialFilters = getInitialFilters();
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setDateRange('today');
  };

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let newStartDate = filters.startDate;
    let newEndDate = filters.endDate;

    if (dateRange === 'today') {
      newStartDate = todayStr;
      newEndDate = todayStr;
    } else if (dateRange === 'last7days') {
      const last7 = new Date();
      last7.setDate(today.getDate() - 6);
      newStartDate = last7.toISOString().split('T')[0];
      newEndDate = todayStr;
    } else if (dateRange === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      newStartDate = firstDay.toISOString().split('T')[0];
      newEndDate = todayStr;
    }
    
    setFilters(prevFilters => ({
        ...prevFilters,
        startDate: newStartDate,
        endDate: newEndDate,
    }));

  }, [dateRange]);

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
      await api.delete(`/inventory/logs/${logId}`);
      setLogs(prevLogs => prevLogs.filter((log) => log.id !== logId));
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

  const openDeleteDialog = (logId: number) => {
    setLogToDelete(logId);
    onOpen();
  };

  const confirmDelete = () => {
    if (logToDelete) {
      handleDelete(logToDelete);
    }
    onClose();
  };

  const handleUpdate = (updatedLog: InventoryLog) => {
    setLogs(
      logs.map((log) =>
        log.id === updatedLog.id ? { ...log, ...updatedLog } : log
      )
    );
  };

  const isExportDisabled = dateRange === 'custom' && (!filters.startDate || !filters.endDate);

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={4}>
        <Heading as="h2" size="lg">Inventory Logs</Heading>
        <HStack spacing={4}>
            <Button colorScheme="blue" onClick={handleFilterClick}>Filter</Button>
            <Button onClick={handleClearFilters} colorScheme="gray">
              Clear Filters
            </Button>
            {allLogs && (
              <>
                <Button colorScheme="blue" onClick={() => exportToPdf(logs, allLogs)} isDisabled={isExportDisabled}>Export to PDF</Button>
                <Button colorScheme="green" onClick={() => exportToExcel(logs, allLogs)} isDisabled={isExportDisabled}>Export to Excel</Button>
              </>
            )}
        </HStack>
      </Flex>
      <Divider mb={6} />
      <Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: allLogs ? 5 : 4 }} spacing={4} mb={4}>
          {allLogs && (
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
          )}
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
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="last7days">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Date</option>
          </Select>
        </SimpleGrid>
        
        {dateRange === 'custom' && (
          <HStack spacing={4} mb={6}>
            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </HStack>
        )}
      </Box>
      <Box overflowX="auto">
        <TableContainer>
          <Table variant="simple" colorScheme="teal">
            <Thead bg="brand.background">
              <Tr>
                <Th>Image</Th>
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
              {logs.length > 0 ? (
                logs.map((log) => (
                  <Tr key={log.id}>
                    <Td>
                      <Image
                        src={log.image_url || 'https://via.placeholder.com/50'}
                        alt={log.product_name}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    </Td>
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
                            onClick={() => openDeleteDialog(log.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={allLogs ? 8 : 7} textAlign="center">
                    No logs found for the selected filters.
                  </Td>
                </Tr>
              )}
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
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Log Entry
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default InventoryLogs;