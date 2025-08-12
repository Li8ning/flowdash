'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Input,
  Stack,
  useToast,
  Heading,
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
  Select as ChakraSelect,
  Flex,
} from '@chakra-ui/react';
import Select, { StylesConfig } from 'react-select';
import { AddIcon, DeleteIcon, MinusIcon } from '@chakra-ui/icons';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  name: string;
  sku: string;
  model: string;
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

interface ProductOption {
  value: number;
  label: string;
  product: Product;
}

const LogEntryForm = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products', { params: { limit: 1000 } }); // Fetch all products
        setProducts(data.data || []);
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

  const productOptions = useMemo((): ProductOption[] =>
    products.map(p => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
      product: p,
    })), [products]);

  const handleProductSelect = (option: ProductOption | null) => {
    if (!option) return;
    const product = option.product;
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

  const formatOptionLabel = ({ label, product }: ProductOption) => (
    <Flex align="center">
      <Image src={product.image_url || '/file.svg'} alt={product.name} boxSize="40px" objectFit="cover" borderRadius="md" mr={3} />
      <Box>
        <Text fontWeight="bold">{product.name}</Text>
        <Text fontSize="sm" color="gray.500">{product.sku}</Text>
      </Box>
    </Flex>
  );

  const customStyles: StylesConfig<ProductOption, false> = {
    control: (provided) => ({
      ...provided,
      minHeight: '48px',
      borderRadius: '0.375rem',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 2,
    }),
  };

  return (
    <Box p={{ base: 2, md: 4 }} bg="brand.surface">
      <Stack spacing={6} maxW="xl" mx="auto">
        <Heading as="h2" size="lg" textAlign="center">{t('product_selector.title')}</Heading>
        <Select<ProductOption>
          options={productOptions}
          onChange={handleProductSelect}
          placeholder={t('product_selector.search_placeholder')}
          isClearable
          isSearchable
          formatOptionLabel={formatOptionLabel}
          styles={customStyles}
          noOptionsMessage={() => t('product_selector.no_products_found')}
        />
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
                <Text color="gray.500">{selectedProduct.model} - {selectedProduct.color}</Text>
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
                    <ChakraSelect
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
                    </ChakraSelect>
                    <ChakraSelect
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
                    </ChakraSelect>
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