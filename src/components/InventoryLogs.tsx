'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { exportToPdf, exportToExcel } from '../lib/export';
import EditLogModal from '@/components/EditLogModal';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
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
  useBreakpointValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  VStack,
} from '@chakra-ui/react';

interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  color: string;
  model: string;
  produced: number;
  created_at: string;
  username?: string;
  image_url?: string;
  quality: string;
  packaging_type: string;
}

interface InventoryLogsProps {
  allLogs?: boolean;
}

const InventoryLogs: React.FC<InventoryLogsProps> = ({ allLogs = false }) => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
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
  const isMobile = useBreakpointValue({ base: true, md: false });

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
        title: t('inventory.logs.toast.error_loading_filters'),
        description: (err as any).response?.data?.error || t('inventory.logs.toast.error_loading_filters_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [allLogs, toast, t]);

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
        title: t('inventory.logs.toast.error_fetching_logs'),
        description: (err as any).response?.data?.error || t('inventory.logs.toast.error_fetching_logs_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [allLogs, appliedFilters, toast, user, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterClick = () => {
    if (dateRange === 'custom' && (!filters.startDate || !filters.endDate)) {
      toast({
        title: t('inventory.logs.toast.invalid_date_range'),
        description: t('inventory.logs.toast.invalid_date_range_description'),
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

  }, [dateRange, filters.endDate, filters.startDate]);

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
        title: t('inventory.logs.toast.log_deleted'),
        description: t('inventory.logs.toast.log_deleted_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: t('inventory.logs.toast.error_deleting_log'),
        description: (err as any).response?.data?.error || t('inventory.logs.toast.error_deleting_log_description'),
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
        <Heading as="h2" size={{ base: 'sm', md: 'lg' }}>{t('inventory.logs.title')}</Heading>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 2, md: 4 }}
          width={{ base: '100%', md: 'auto' }}
        >
            {allLogs && (
              <>
                <Button colorScheme="blue" onClick={() => exportToPdf(logs, allLogs)} isDisabled={isExportDisabled}>{t('inventory.logs.export_pdf')}</Button>
                <Button colorScheme="green" onClick={() => exportToExcel(logs, allLogs)} isDisabled={isExportDisabled}>{t('inventory.logs.export_excel')}</Button>
              </>
            )}
            <Button colorScheme="blue" onClick={handleFilterClick}>{t('inventory.logs.filter')}</Button>
            <Button onClick={handleClearFilters} colorScheme="gray">
              {t('inventory.logs.clear_filters')}
            </Button>
        </Flex>
      </Flex>
      <Divider mb={6} />
      <Box>
        <SimpleGrid columns={{ base: 1, md: 2, lg: allLogs ? 5 : 4 }} spacing={4} mb={4}>
          {allLogs && (
            <Select
              placeholder={t('inventory.logs.filter_by_user')}
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
            placeholder={t('inventory.logs.filter_by_product')}
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
            placeholder={t('inventory.logs.filter_by_color')}
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
            placeholder={t('inventory.logs.filter_by_model')}
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
            <option value="today">{t('inventory.logs.date_range.today')}</option>
            <option value="last7days">{t('inventory.logs.date_range.last7days')}</option>
            <option value="thisMonth">{t('inventory.logs.date_range.thisMonth')}</option>
            <option value="custom">{t('inventory.logs.date_range.custom')}</option>
          </Select>
        </SimpleGrid>
        
        {dateRange === 'custom' && (
          <HStack spacing={4} mb={6}>
            <Input
              type="date"
              placeholder={t('inventory.logs.start_date')}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder={t('inventory.logs.end_date')}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </HStack>
        )}
      </Box>
      <Box>
        {isMobile ? (
          <Accordion allowMultiple>
            {logs.length > 0 ? (
              logs.map((log) => (
                <AccordionItem key={log.id} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Flex align="center" w="100%">
                          <Image
                            src={log.image_url || 'https://via.placeholder.com/50'}
                            alt={log.product_name}
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                            mr={4}
                          />
                          <Flex justify="space-between" align="center" w="100%">
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="bold">{log.product_name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {new Date(log.created_at).toLocaleDateString()}
                              </Text>
                            </VStack>
                            <Text
                              fontWeight="bold"
                              color={log.produced > 0 ? 'green.500' : 'red.500'}
                            >
                              Qty: {log.produced}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.color')}:</Text>
                        <Text>{log.color}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.model')}:</Text>
                        <Text>{log.model}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.quality')}:</Text>
                        <Text>{log.quality ? t(`product_manager.quality.${log.quality.toLowerCase()}`) : ''}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.packaging_type')}:</Text>
                        <Text>{log.packaging_type ? t(`product_manager.packaging_type.${log.packaging_type.toLowerCase()}`) : ''}</Text>
                      </Flex>
                      {allLogs && (
                        <Flex justify="space-between">
                          <Text fontWeight="bold">{t('inventory.logs.table.user')}:</Text>
                          <Text>{log.username}</Text>
                        </Flex>
                      )}
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.quantity_change')}:</Text>
                        <Text>{log.produced}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('inventory.logs.table.date')}:</Text>
                        <Text>{new Date(log.created_at).toLocaleString()}</Text>
                      </Flex>
                      <Flex mt={4}>
                        <Button
                          size="sm"
                          mr={2}
                          disabled={!isEditable(log.created_at)}
                          onClick={() => setEditingLog(log)}
                        >
                          {t('inventory.logs.edit')}
                        </Button>
                        {(user?.role === 'factory_admin' || user?.role === 'floor_staff') && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => openDeleteDialog(log.id)}
                            disabled={!isEditable(log.created_at)}
                          >
                            {t('inventory.logs.delete')}
                          </Button>
                        )}
                      </Flex>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))
            ) : (
              <Text textAlign="center" p={4}>
                {t('inventory.logs.no_logs_found')}
              </Text>
            )}
          </Accordion>
        ) : (
          <TableContainer>
            <Table variant="simple" colorScheme="teal">
              <Thead bg="brand.background">
                <Tr>
                  <Th>{t('inventory.logs.table.image')}</Th>
                  <Th>{t('inventory.logs.table.product_name')}</Th>
                  <Th>{t('inventory.logs.table.color')}</Th>
                  <Th>{t('inventory.logs.table.model')}</Th>
                  {allLogs && <Th>{t('inventory.logs.table.user')}</Th>}
                  <Th>{t('inventory.logs.table.quality')}</Th>
                  <Th>{t('inventory.logs.table.packaging_type')}</Th>
                  <Th textAlign="center">{t('inventory.logs.table.quantity_change')}</Th>
                  <Th>{t('inventory.logs.table.date')}</Th>
                  <Th>{t('inventory.logs.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <Tr key={log.id}
                      sx={{
                          '@media (min-width: 769px)': {
                              '&:hover': {
                                  backgroundColor: 'gray.50',
                                  cursor: 'pointer'
                              }
                          }
                      }}
                    >
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
                      <Td>{log.quality ? t(`product_manager.quality.${log.quality.toLowerCase()}`) : ''}</Td>
                      <Td>{log.packaging_type ? t(`product_manager.packaging_type.${log.packaging_type.toLowerCase()}`) : ''}</Td>
                      <Td textAlign="center">{log.produced}</Td>
                      <Td>{new Date(log.created_at).toLocaleString()}</Td>
                      <Td>
                        <Flex>
                          <Button
                            size="sm"
                            mr={2}
                            disabled={!isEditable(log.created_at)}
                            onClick={() => setEditingLog(log)}
                          >
                            {t('inventory.logs.edit')}
                          </Button>
                          {(user?.role === 'factory_admin' || user?.role === 'floor_staff') && (
                            <Button
                              size="sm"
                              colorScheme="red"
                              onClick={() => openDeleteDialog(log.id)}
                              disabled={!isEditable(log.created_at)}
                            >
                              {t('inventory.logs.delete')}
                            </Button>
                          )}
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={allLogs ? 10 : 9} textAlign="center">
                      {t('inventory.logs.no_logs_found')}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
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
              {t('inventory.logs.delete_confirmation.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('inventory.logs.delete_confirmation.body')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('inventory.logs.delete_confirmation.cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                {t('inventory.logs.delete_confirmation.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default InventoryLogs;