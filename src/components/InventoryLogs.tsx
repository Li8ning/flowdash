'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { exportToPdf, exportToExcel } from '../lib/export';
import EditLogModal from '@/components/EditLogModal';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useCrud } from '@/hooks/useCrud';
import { InventoryLog, User } from '@/types';
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
  InputGroup,
  InputLeftElement,
  Stack,
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
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

interface InventoryLogsProps {
  allLogs?: boolean;
}

interface LogFilters {
  userId: string;
  product: string;
  search: string;
  color: string;
  design: string;
  startDate: string;
  endDate: string;
  quality: string;
  packaging_type: string;
  [key: string]: string | number | undefined;
}

const InventoryLogs: React.FC<InventoryLogsProps> = ({ allLogs = false }) => {
  const [editingLog, setEditingLog] = useState<InventoryLog | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
  const [logToDelete, setLogToDelete] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('today');

  const getInitialFilters = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      userId: '',
      product: '',
      search: '',
      color: '',
      design: '',
      startDate: today,
      endDate: today,
      quality: '',
      packaging_type: '',
    };
  }, []);

  const [filters, setFilters] = useState<LogFilters>(getInitialFilters());
  const [pendingFilters, setPendingFilters] = useState<LogFilters>(getInitialFilters());
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [distinctUsers, setDistinctUsers] = useState<{id: number, name: string}[]>([]);
  const [distinctColors, setDistinctColors] = useState<string[]>([]);
  const [distinctDesigns, setDistinctDesigns] = useState<string[]>([]);
  const [distinctQualities, setDistinctQualities] = useState<string[]>([]);
  const [distinctPackagingTypes, setDistinctPackagingTypes] = useState<string[]>([]);
  const [isFetchingDistinctValues, setIsFetchingDistinctValues] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const {
    data: logs,
    total: totalLogs,
    loading,
    fetchData,
    deleteItem,
    updateItem,
  } = useCrud<InventoryLog>({
    endpoint: allLogs ? '/inventory/logs' : '/inventory/logs/me',
    initialFetch: false,
    messages: {
      deleteSuccess: t('inventory.logs.toast.log_deleted_description'),
      // Remove updateSuccess to prevent duplicate toast with EditLogModal
    },
  });


  const fetchDistinctValues = useCallback(async () => {
    try {
      const endpoints = [
        api.get('/distinct/products/color'),
        api.get('/distinct/products/design'),
        api.get('/distinct/inventory/quality'),
        api.get('/distinct/inventory/packaging_type'),
      ];

      let usersPromise = null;
      if (allLogs) {
        // Fetch only floor_staff users (both active and inactive) for the filter
        usersPromise = api.get('/users?status=all');
      }

      const [colorsRes, designsRes, qualitiesRes, packagingTypesRes] = await Promise.all(endpoints);
      
      setDistinctColors(colorsRes.data);
      setDistinctDesigns(designsRes.data);
      setDistinctQualities(qualitiesRes.data);
      setDistinctPackagingTypes(packagingTypesRes.data);

      if (allLogs && usersPromise) {
        try {
          const usersRes = await usersPromise;
          // Filter to only show floor_staff users and use name instead of username
          const floorStaffUsers = usersRes.data
            .filter((user: User) => user.role === 'floor_staff')
            .map((user: User) => ({
              id: user.id,
              name: user.name
            }));
          setDistinctUsers(floorStaffUsers);
        } catch {
          // If users API fails (e.g., insufficient permissions), fall back to distinct API
          try {
            const fallbackUsersRes = await api.get('/distinct/inventory/users');
            setDistinctUsers(fallbackUsersRes.data.map((username: string) => ({
              id: username, // Use username as fallback ID
              name: username // Use username as fallback name
            })));
          } catch (fallbackErr) {
            console.warn('Failed to fetch users for filter:', fallbackErr);
          }
        }
      }
    } catch (err) {
      toast({
        title: t('inventory.logs.toast.error_loading_filters'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('inventory.logs.toast.error_loading_filters_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFetchingDistinctValues(false);
    }
  }, [allLogs, toast, t]);

  useEffect(() => {
    fetchDistinctValues();
  }, [fetchDistinctValues]);

  useEffect(() => {
    fetchData(currentPage, filters, itemsPerPage);
  }, [fetchData, filters, currentPage, itemsPerPage]);


  const handleFilterClick = () => {
    if (dateRange === 'custom' && (!pendingFilters.startDate || !pendingFilters.endDate)) {
      toast({
        title: t('inventory.logs.toast.invalid_date_range'),
        description: t('inventory.logs.toast.invalid_date_range_description'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const filtersWithSearch = { ...pendingFilters, search: searchQuery };
    setFilters(filtersWithSearch);
    setCurrentPage(1); // Reset to first page when applying filters
    fetchData(1, filtersWithSearch, itemsPerPage);
  };

  const handleClearFilters = () => {
    const initialFilters = getInitialFilters();
    setFilters(initialFilters);
    setPendingFilters(initialFilters);
    setSearchQuery('');
    setDateRange('today');
    setCurrentPage(1); // Reset to first page when clearing filters
    fetchData(1, initialFilters, itemsPerPage);
  };

  useEffect(() => {
    if (dateRange === 'custom') return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let newStartDate = '';
    let newEndDate = '';

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

    setPendingFilters((prevFilters) => ({
      ...prevFilters,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  }, [dateRange]);

  const isEditable = (createdAt: string) => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }
    const logTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    return currentTime - logTime < 24 * 60 * 60 * 1000;
  };


  const openDeleteDialog = (logId: number) => {
    setLogToDelete(logId);
    onOpen();
  };

  const confirmDelete = () => {
    if (logToDelete) {
      deleteItem(logToDelete);
    }
    onClose();
  };

  const handleUpdate = (updatedLog: InventoryLog) => {
    updateItem(updatedLog.id, updatedLog);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    fetchData(1, filters, newItemsPerPage);
  };

  const isExportDisabled = dateRange === 'custom' && (!filters.startDate || !filters.endDate);

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Heading as="h2" size={{ base: 'md', md: 'lg' }}>
          {t('inventory.logs.title')}
        </Heading>
        <Stack
          direction={{ base: 'column', sm: 'row' }}
          spacing={2}
          align="stretch"
          width={{ base: '100%', md: 'auto' }}
        >
          {allLogs && (
            <>
              <Button onClick={() => exportToPdf(logs, allLogs)} isDisabled={isExportDisabled} colorScheme="blue">
                {t('inventory.logs.export_pdf')}
              </Button>
              <Button onClick={() => exportToExcel(logs, allLogs)} isDisabled={isExportDisabled} colorScheme="blue">
                {t('inventory.logs.export_excel')}
              </Button>
            </>
          )}
        </Stack>
      </Flex>
      <Divider mb={6} />
      <Box>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: allLogs ? 4 : 3, xl: allLogs ? 7 : 6 }} spacing={4} mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder={t('inventory.logs.search_by_product')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          {allLogs && (
            <Flex align="center">
              <Select
                  placeholder={t('inventory.logs.filter_by_user')}
                  value={pendingFilters.userId}
                  onChange={(e) => setPendingFilters({ ...pendingFilters, userId: e.target.value })}
                  focusBorderColor="blue.500"
                  isDisabled={isFetchingDistinctValues}
                >
                  {distinctUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
                {isFetchingDistinctValues && <Spinner size="sm" ml={2} />}
              </Flex>
            )}
            <Flex align="center">
              <Select
                placeholder={t('inventory.logs.filter_by_color')}
                value={pendingFilters.color}
                onChange={(e) => setPendingFilters({ ...pendingFilters, color: e.target.value })}
                focusBorderColor="blue.500"
                isDisabled={isFetchingDistinctValues}
              >
                {distinctColors.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {isFetchingDistinctValues && <Spinner size="sm" ml={2} />}
            </Flex>
            <Flex align="center">
              <Select
                placeholder={t('inventory.logs.filter_by_design')}
                value={pendingFilters.design}
                onChange={(e) => setPendingFilters({ ...pendingFilters, design: e.target.value })}
                focusBorderColor="blue.500"
                isDisabled={isFetchingDistinctValues}
              >
                {distinctDesigns.map((d: string) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              {isFetchingDistinctValues && <Spinner size="sm" ml={2} />}
            </Flex>
            <Flex align="center">
              <Select
                placeholder={t('inventory.logs.filter_by_quality')}
                value={pendingFilters.quality}
                onChange={(e) => setPendingFilters({ ...pendingFilters, quality: e.target.value })}
                focusBorderColor="blue.500"
                isDisabled={isFetchingDistinctValues}
              >
                {distinctQualities.map((q: string) => (
                  <option key={q} value={q}>
                    {t(`product_manager.quality.${q.toLowerCase()}`)}
                  </option>
                ))}
              </Select>
              {isFetchingDistinctValues && <Spinner size="sm" ml={2} />}
            </Flex>
            <Flex align="center">
              <Select
                placeholder={t('inventory.logs.filter_by_packaging_type')}
                value={pendingFilters.packaging_type}
                onChange={(e) =>
                  setPendingFilters({ ...pendingFilters, packaging_type: e.target.value })
                }
               focusBorderColor="blue.500"
               isDisabled={isFetchingDistinctValues}
             >
                {distinctPackagingTypes.map((p: string) => (
                  <option key={p} value={p}>
                    {t(`product_manager.packaging_type.${p.toLowerCase()}`)}
                  </option>
                ))}
              </Select>
              {isFetchingDistinctValues && <Spinner size="sm" ml={2} />}
            </Flex>
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} focusBorderColor="blue.500">
            <option value="today">{t('inventory.logs.date_range.today')}</option>
            <option value="last7days">{t('inventory.logs.date_range.last7days')}</option>
            <option value="thisMonth">{t('inventory.logs.date_range.thisMonth')}</option>
            <option value="custom">{t('inventory.logs.date_range.custom')}</option>
          </Select>
        </SimpleGrid>

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} mb={6}>
            {dateRange === 'custom' && (
                <>
                    <Input
                        type="date"
                        placeholder={t('inventory.logs.start_date')}
                        value={pendingFilters.startDate}
                        onChange={(e) => setPendingFilters({ ...pendingFilters, startDate: e.target.value })}
                    />
                    <Input
                        type="date"
                        placeholder={t('inventory.logs.end_date')}
                        value={pendingFilters.endDate}
                        onChange={(e) => setPendingFilters({ ...pendingFilters, endDate: e.target.value })}
                    />
                </>
            )}
            <Button onClick={handleFilterClick} colorScheme="blue" flexShrink={0}>
                {t('inventory.logs.filter')}
            </Button>
            <Button onClick={handleClearFilters} colorScheme="gray" flexShrink={0}>
                {t('inventory.logs.clear_filters')}
            </Button>
        </Stack>
      </Box>
      <Box>
        {loading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" />
          </Flex>
        ) : isMobile ? (
          <Accordion allowMultiple>
            {logs.length > 0 ? (
              logs.map((log: InventoryLog) => (
                <AccordionItem key={log.id} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Flex align="center" w="100%">
                          <Image
                            src={log.image_url || 'https://placehold.co/50'}
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
                        <Text fontWeight="bold">{t('inventory.logs.table.design')}:</Text>
                        <Text>{log.design}</Text>
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
                        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'floor_staff') && (
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
            <Table variant="simple" colorScheme="blue">
              <Thead bg="brand.background">
                <Tr>
                  <Th>{t('inventory.logs.table.image')}</Th>
                  <Th>{t('inventory.logs.table.product_name')}</Th>
                  <Th>{t('inventory.logs.table.color')}</Th>
                  <Th>{t('inventory.logs.table.design')}</Th>
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
                  logs.map((log: InventoryLog) => (
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
                          src={log.image_url || 'https://placehold.co/50'}
                          alt={log.product_name}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      </Td>
                      <Td>{log.product_name}</Td>
                      <Td>{log.color}</Td>
                      <Td>{log.design}</Td>
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
                          {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'floor_staff') && (
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

      {/* Pagination Controls */}
      {totalLogs > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalLogs / itemsPerPage)}
          totalItems={totalLogs}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={loading}
        />
      )}

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