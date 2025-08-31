'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  Image,
  Badge,
  useBreakpointValue,
  VStack,
  HStack,
  TableContainer,
  Input,
  Select,
  SimpleGrid,
  Switch,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface StockEntry {
  quality: string;
  packaging_type: string;
  quantity: number;
  last_updated_at: string;
}

interface ProductStock {
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  design: string;
  color: string;
  image_url: string;
  stock_entries: StockEntry[];
  total_quantity: number;
}

interface StockData {
  data: ProductStock[];
  totalProducts: number;
  totalStockEntries: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const StockManager = () => {
  const { t } = useTranslation(['common', 'products']);
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    design: '',
    color: '',
    quality: '',
    packaging_type: '',
    showZeroStock: false,
  });

  // Applied filters state (what's actually sent to API)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    design: '',
    color: '',
    quality: '',
    packaging_type: '',
    showZeroStock: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [distinctValues, setDistinctValues] = useState({
    categories: [] as string[],
    designs: [] as string[],
    colors: [] as string[],
    qualities: [] as string[],
    packaging_types: [] as string[],
  });

  const fetchStockData = useCallback(async (currentFilters = appliedFilters, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.design) params.append('design', currentFilters.design);
      if (currentFilters.color) params.append('color', currentFilters.color);
      if (currentFilters.quality) params.append('quality', currentFilters.quality);
      if (currentFilters.packaging_type) params.append('packaging_type', currentFilters.packaging_type);
      if (currentFilters.showZeroStock) params.append('showZeroStock', 'true');
      
      // Add pagination parameters
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((page - 1) * itemsPerPage).toString());

      const response = await fetch(`/api/inventory/stock?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const data = await response.json();
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load stock data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, toast]);

  const fetchDistinctValues = async () => {
    try {
      const [categoriesRes, designsRes, colorsRes, qualitiesRes, packagingRes] = await Promise.all([
        fetch('/api/distinct/products/category'),
        fetch('/api/distinct/products/design'),
        fetch('/api/distinct/products/color'),
        fetch('/api/distinct/inventory_logs/quality'),
        fetch('/api/distinct/inventory_logs/packaging_type'),
      ]);

      const [categories, designs, colors, qualities, packaging_types] = await Promise.all([
        categoriesRes.json(),
        designsRes.json(),
        colorsRes.json(),
        qualitiesRes.json(),
        packagingRes.json(),
      ]);

      setDistinctValues({
        categories: Array.isArray(categories) ? categories : [],
        designs: Array.isArray(designs) ? designs : [],
        colors: Array.isArray(colors) ? colors : [],
        qualities: Array.isArray(qualities) ? qualities : [],
        packaging_types: Array.isArray(packaging_types) ? packaging_types : [],
      });
    } catch (err) {
      console.error('Failed to fetch distinct values:', err);
    }
  };

  useEffect(() => {
    fetchStockData();
    fetchDistinctValues();
  }, [fetchStockData]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1); // Reset to first page when applying filters
    fetchStockData(filters, 1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      design: '',
      color: '',
      quality: '',
      packaging_type: '',
      showZeroStock: false,
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setCurrentPage(1); // Reset to first page when clearing filters
    fetchStockData(clearedFilters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStockData(appliedFilters, page);
  };

  const totalPages = Math.ceil((stockData?.totalStockEntries || 0) / itemsPerPage);


  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'red';
    if (quantity < 10) return 'orange';
    if (quantity < 50) return 'yellow';
    return 'green';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box color="red.500" textAlign="center" p={8}>
        <Text fontSize="lg">{error}</Text>
        <Button mt={4} onClick={() => fetchStockData()}>
          {t('retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size={{ base: 'md', md: 'lg' }} mb={{ base: 4, md: 0 }}>
          Stock Management
        </Heading>
        <Text fontSize="sm" color="gray.600">
          {stockData?.totalProducts} products • {stockData?.totalStockEntries} stock entries
        </Text>
      </Flex>

      {/* Filters */}
      <Box mb={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={4}>
          <Input
            placeholder="Search by product name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            focusBorderColor="blue.500"
          />

          <Select
            placeholder="All Categories"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            focusBorderColor="blue.500"
          >
            {distinctValues.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>

          <Select
            placeholder="All Designs"
            value={filters.design}
            onChange={(e) => handleFilterChange('design', e.target.value)}
            focusBorderColor="blue.500"
          >
            {distinctValues.designs.map((design) => (
              <option key={design} value={design}>
                {design}
              </option>
            ))}
          </Select>

          <Select
            placeholder="All Colors"
            value={filters.color}
            onChange={(e) => handleFilterChange('color', e.target.value)}
            focusBorderColor="blue.500"
          >
            {distinctValues.colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </Select>

          <Select
            placeholder="All Qualities"
            value={filters.quality}
            onChange={(e) => handleFilterChange('quality', e.target.value)}
            focusBorderColor="blue.500"
          >
            {distinctValues.qualities.map((quality) => (
              <option key={quality} value={quality}>
                {quality}
              </option>
            ))}
          </Select>

          <Select
            placeholder="All Packaging Types"
            value={filters.packaging_type}
            onChange={(e) => handleFilterChange('packaging_type', e.target.value)}
            focusBorderColor="blue.500"
          >
            {distinctValues.packaging_types.map((packaging) => (
              <option key={packaging} value={packaging}>
                {packaging}
              </option>
            ))}
          </Select>

          <Flex align="center">
            <Text fontSize="sm" mr={3}>Show Zero Stock:</Text>
            <Switch
              isChecked={filters.showZeroStock}
              onChange={(e) => handleFilterChange('showZeroStock', e.target.checked)}
              colorScheme="blue"
            />
          </Flex>
        </SimpleGrid>

        <HStack spacing={2}>
          <Button colorScheme="blue" onClick={handleApplyFilters}>
            Filter
          </Button>
          <Button onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </HStack>
      </Box>

      {/* Stock Data Display */}
      {!stockData?.data || stockData.data.length === 0 ? (
        <Box textAlign="center" p={10}>
          <Text>No stock data found</Text>
        </Box>
      ) : isMobile ? (
        <Accordion allowMultiple>
          {stockData.data
            .filter(product => appliedFilters.showZeroStock || product.stock_entries.length > 0)
            .map((product) => {
              // Handle products with no stock entries when showZeroStock is true
              if (product.stock_entries.length === 0 && appliedFilters.showZeroStock) {
                return (
                  <AccordionItem key={`${product.product_id}-no-stock`} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Flex align="center" w="100%">
                            <Image
                              src={product.image_url || '/next.svg'}
                              alt={product.product_name}
                              boxSize="50px"
                              objectFit="cover"
                              borderRadius="md"
                              mr={4}
                            />
                            <Flex justify="space-between" align="center" w="100%">
                              <VStack align="flex-start" spacing={0}>
                                <Text fontWeight="bold">{product.product_name}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {product.category}
                                </Text>
                              </VStack>
                              <Badge
                                colorScheme="red"
                                fontSize="lg"
                                px={3}
                                py={1}
                                minH="32px"
                                display="flex"
                                alignItems="center"
                              >
                                0
                              </Badge>
                            </Flex>
                          </Flex>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={3}>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">SKU:</Text>
                          <Text>{product.sku}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">Design:</Text>
                          <Text>{product.design}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">Color:</Text>
                          <Text>{product.color}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">Quality:</Text>
                          <Text color="gray.400">No stock</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontWeight="bold">Packaging:</Text>
                          <Text color="gray.400">No stock</Text>
                        </Flex>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                );
              }

              const filteredEntries = product.stock_entries.filter(entry =>
                appliedFilters.showZeroStock || entry.quantity > 0
              );
              
              return filteredEntries.map((entry, entryIndex) => (
                <AccordionItem key={`${product.product_id}-${entryIndex}`} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Flex align="center" w="100%">
                          <Image
                            src={product.image_url || '/next.svg'}
                            alt={product.product_name}
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                            mr={4}
                          />
                          <Flex justify="space-between" align="center" w="100%">
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="bold">{product.product_name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {entry.quality} - {entry.packaging_type}
                              </Text>
                            </VStack>
                            <Badge
                              colorScheme={getStockStatusColor(entry.quantity)}
                              fontSize="lg"
                              px={3}
                              py={1}
                              minH="32px"
                              display="flex"
                              alignItems="center"
                            >
                              {entry.quantity}
                            </Badge>
                          </Flex>
                        </Flex>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={3}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">SKU:</Text>
                        <Text>{product.sku}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Category:</Text>
                        <Text>{product.category}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Design:</Text>
                        <Text>{product.design}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Color:</Text>
                        <Text>{product.color}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Quality:</Text>
                        <Text>{entry.quality}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">Packaging:</Text>
                        <Text>{entry.packaging_type}</Text>
                      </Flex>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ));
            })}
        </Accordion>
      ) : (
        <TableContainer>
          <Table variant="simple" colorScheme="blue">
            <Thead bg="brand.background">
              <Tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Design</Th>
                <Th>Color</Th>
                <Th>Quality</Th>
                <Th>Packaging</Th>
                <Th textAlign="center">Stock</Th>
              </Tr>
            </Thead>
            <Tbody>
              {stockData.data
                .filter(product => appliedFilters.showZeroStock || product.stock_entries.length > 0)
                .map((product) => {
                  // Handle products with no stock entries when showZeroStock is true
                  if (product.stock_entries.length === 0 && appliedFilters.showZeroStock) {
                    return [(
                      <Tr
                        key={`${product.product_id}-no-stock`}
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
                          <Flex align="center">
                            <Image
                              src={product.image_url || '/next.svg'}
                              alt={product.product_name}
                              boxSize="50px"
                              objectFit="cover"
                              borderRadius="md"
                              mr={3}
                            />
                            <Text fontWeight="medium">{product.product_name}</Text>
                          </Flex>
                        </Td>
                        <Td>{product.sku}</Td>
                        <Td>{product.category}</Td>
                        <Td>{product.design}</Td>
                        <Td>{product.color}</Td>
                        <Td>
                          <Text fontWeight="medium" color="gray.400">No stock</Text>
                        </Td>
                        <Td>
                          <Text color="gray.400">No stock</Text>
                        </Td>
                        <Td textAlign="center">
                          <Badge
                            colorScheme="red"
                            fontSize="lg"
                            px={3}
                            py={1}
                            minH="32px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            0
                          </Badge>
                        </Td>
                      </Tr>
                    )];
                  }

                  const filteredEntries = product.stock_entries.filter(entry =>
                    appliedFilters.showZeroStock || entry.quantity > 0
                  );
                  return filteredEntries.map((entry, entryIndex) => (
                  <Tr
                    key={`${product.product_id}-${entryIndex}`}
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
                      <Flex align="center">
                        <Image
                          src={product.image_url || '/next.svg'}
                          alt={product.product_name}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                          mr={3}
                        />
                        <Text fontWeight="medium">{product.product_name}</Text>
                      </Flex>
                    </Td>
                    <Td>{product.sku}</Td>
                    <Td>{product.category}</Td>
                    <Td>{product.design}</Td>
                    <Td>{product.color}</Td>
                    <Td>
                      <Text fontWeight="medium">{entry.quality}</Text>
                    </Td>
                    <Td>
                      <Text>{entry.packaging_type}</Text>
                    </Td>
                    <Td textAlign="center">
                      <Badge
                        colorScheme={getStockStatusColor(entry.quantity)}
                        fontSize="lg"
                        px={3}
                        py={1}
                        minH="32px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {entry.quantity}
                      </Badge>
                    </Td>
                  </Tr>
                  ));
                })}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination Controls */}
      {stockData && totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={6}>
          <Text fontSize="sm" color="gray.600">
            Page {currentPage} of {totalPages} • Showing {stockData.data.length} entries
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={currentPage === pageNum ? "solid" : "outline"}
                  colorScheme={currentPage === pageNum ? "blue" : "gray"}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

export default StockManager;