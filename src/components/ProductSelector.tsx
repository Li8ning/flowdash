'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  useToast,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  HStack,
  IconButton,
  Select,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, MinusIcon } from '@chakra-ui/icons';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  sku: string;
  design: string;
  category: string;
  color: string;
  image_url: string;
  available_qualities: string[];
  available_packaging_types: string[];
}

interface LogEntry {
  id: number;
  quantity: string;
  quality: string;
  packagingType: string;
}

const LogEntryForm = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ color: '', design: '', category: '' });
  const [activeFilters, setActiveFilters] = useState({ color: '', design: '', category: '' });
  const [distinctColors, setDistinctColors] = useState([]);
  const [distinctDesigns, setDistinctDesigns] = useState([]);
  const [distinctCategories, setDistinctCategories] = useState([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, colorsRes, designsRes, categoriesRes] = await Promise.all([
          api.get('/products'),
          api.get('/distinct/products/color'),
          api.get('/distinct/products/design'),
          api.get('/distinct/products/category'),
        ]);
        setProducts(productsRes.data.data || []);
        setDistinctColors(colorsRes.data);
        setDistinctDesigns(designsRes.data);
        setDistinctCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch product data', error);
        toast({
          title: t('product_selector.toast.error_fetching_products'),
          description: (error as AxiosError<{ error: string }>)?.response?.data?.error || t('product_selector.toast.error_fetching_products_description'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchProducts();
  }, [toast, t]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setLogEntries([{ id: Date.now(), quantity: '', quality: '', packagingType: '' }]);
    onOpen();
  };

  const handleLogEntryChange = (id: number, field: keyof Omit<LogEntry, 'id'>, value: string) => {
    setLogEntries(entries =>
      entries.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const addLogEntry = () => {
    setLogEntries(entries => [
      ...entries,
      { id: Date.now(), quantity: '', quality: '', packagingType: '' },
    ]);
  };

  const removeLogEntry = (id: number) => {
    setLogEntries(entries => entries.filter(entry => entry.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const invalidEntry = logEntries.some(
      entry => !entry.quantity || parseInt(entry.quantity, 10) < 1 || !entry.quality || !entry.packagingType
    );

    if (invalidEntry) {
      toast({
        title: t('product_selector.toast.invalid_input'),
        description: t('product_selector.toast.all_fields_required'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const logsToCreate = logEntries.map(entry => ({
      product_id: selectedProduct.id,
      produced: parseInt(entry.quantity, 10),
      quality: entry.quality,
      packaging_type: entry.packagingType,
    }));

    setLoading(true);
    try {
      await api.post('/inventory/logs', logsToCreate);
      toast({
        title: t('product_selector.toast.log_created'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create log entry', error);
      toast({
        title: t('product_selector.toast.error_creating_log'),
        description: (error as AxiosError<{ error: string }>)?.response?.data?.error || t('product_selector.toast.error_creating_log_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setActiveFilters(filters);
  };

  const filteredProducts = products.filter((product) => {
    const searchMatch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const colorMatch = activeFilters.color ? product.color === activeFilters.color : true;
    const designMatch = activeFilters.design ? product.design === activeFilters.design : true;
    const categoryMatch = activeFilters.category ? product.category === activeFilters.category : true;

    return searchMatch && colorMatch && designMatch && categoryMatch;
  });

  return (
    <Box p={{ base: 2, md: 4 }} bg="brand.surface">
      <Stack spacing={6}>
        <Heading as="h2" size="lg" textAlign="center">{t('product_selector.title')}</Heading>
        <Input
          placeholder={t('product_selector.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="lg"
        />
       <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2} mb={4}>
          <Select
            placeholder={t('product_selector.filter_by_category')}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            size="sm"
            focusBorderColor="blue.500"
          >
            {distinctCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            placeholder={t('product_selector.filter_by_design')}
            value={filters.design}
            onChange={(e) => setFilters({ ...filters, design: e.target.value })}
            size="sm"
            focusBorderColor="blue.500"
          >
            {distinctDesigns.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select
            placeholder={t('product_selector.filter_by_color')}
            value={filters.color}
            onChange={(e) => setFilters({ ...filters, color: e.target.value })}
            size="sm"
            focusBorderColor="blue.500"
          >
            {distinctColors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button onClick={handleFilter} colorScheme="blue" size="sm">{t('product_selector.filter')}</Button>
          <Button
            onClick={() => {
              setFilters({ color: '', design: '', category: '' });
              setActiveFilters({ color: '', design: '', category: '' });
            }}
            colorScheme="gray"
            size="sm"
          >
            {t('product_selector.clear_filters')}
          </Button>
        </SimpleGrid>
       <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={{ base: 6, md: 5 }}>
          {filteredProducts.map((product) => (
            <Box
              key={product.id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              cursor="pointer"
              textAlign="center"
              bg="brand.background"
              borderColor="brand.lightBorder"
              onClick={() => handleProductSelect(product)}
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.05)', shadow: 'lg', borderColor: 'blue.500' }}
            >
              <VStack spacing={3}>
                <Image src={product.image_url || '/file.svg'} alt={product.name} boxSize={{ base: '180px', md: '150px' }} objectFit="cover" borderRadius="lg" />
                <Text fontWeight="bold" fontSize={{ base: 'xl', md: 'lg' }} noOfLines={2}>{product.name}</Text>
                <Text fontSize={{ base: 'lg', md: 'md' }} color="gray.600">{product.design}</Text>
                <Text fontSize={{ base: 'lg', md: 'md' }} color="gray.500">{product.color}</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>

      {selectedProduct && (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmit}>
            <ModalHeader>{t('product_selector.quantity_modal.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack>
                <Image src={selectedProduct.image_url || '/file.svg'} alt={selectedProduct.name} boxSize="100px" objectFit="cover" borderRadius="lg" />
                <Heading size="md">{selectedProduct.name}</Heading>
                <Text color="gray.500">{selectedProduct.design} - {selectedProduct.color}</Text>
              </VStack>
              <VStack spacing={4} mt={6}>
                {logEntries.map((entry) => (
                  <HStack key={entry.id} spacing={2} w="100%">
                    <HStack width="150px">
                      <IconButton
                        aria-label="Decrement quantity"
                        icon={<MinusIcon />}
                        size="sm"
                        onClick={() => {
                          const currentValue = parseInt(entry.quantity, 10) || 0;
                          if (currentValue > 1) {
                            handleLogEntryChange(entry.id, 'quantity', String(currentValue - 1));
                          }
                        }}
                      />
                      <Input
                        placeholder={t('product_selector.quantity_modal.quantity')}
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => handleLogEntryChange(entry.id, 'quantity', e.target.value)}
                        isRequired
                        textAlign="center"
                        flex={1}
                      />
                      <IconButton
                        aria-label="Increment quantity"
                        icon={<AddIcon />}
                        size="sm"
                        onClick={() => {
                          const currentValue = parseInt(entry.quantity, 10) || 0;
                          handleLogEntryChange(entry.id, 'quantity', String(currentValue + 1));
                        }}
                      />
                    </HStack>
                    <Select
                      placeholder={t('product_selector.quantity_modal.select_quality')}
                      value={entry.quality}
                      onChange={(e) => handleLogEntryChange(entry.id, 'quality', e.target.value)}
                      isRequired
                      flex={1}
                      focusBorderColor="blue.500"
                    >
                      {selectedProduct.available_qualities?.map(q => (
                        <option key={q} value={q}>{t(`product_manager.quality.${q.toLowerCase()}`)}</option>
                      ))}
                    </Select>
                    <Select
                      placeholder={t('product_selector.quantity_modal.select_packaging')}
                      value={entry.packagingType}
                      onChange={(e) => handleLogEntryChange(entry.id, 'packagingType', e.target.value)}
                      isRequired
                      flex={1}
                      focusBorderColor="blue.500"
                    >
                      {selectedProduct.available_packaging_types?.map(p => (
                        <option key={p} value={p}>{t(`product_manager.packaging_type.${p.toLowerCase()}`)}</option>
                      ))}
                    </Select>
                    <IconButton
                      aria-label="Remove Log Entry"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => removeLogEntry(entry.id)}
                      isDisabled={logEntries.length <= 1}
                    />
                  </HStack>
                ))}
              </VStack>
              <Button leftIcon={<AddIcon />} mt={4} onClick={addLogEntry} w="100%">
                {t('product_selector.add_another_entry')}
              </Button>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>{t('product_selector.quantity_modal.cancel')}</Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                loadingText="Submitting"
              >
                {t('product_selector.quantity_modal.submit')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default LogEntryForm;