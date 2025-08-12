'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Image,
  Select,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Divider,
  useToast,
  useBreakpointValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FiUpload } from 'react-icons/fi';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  sku: string;
  color: string;
  category: string;
  design: string;
  image_url: string;
  available_qualities: string[];
  available_packaging_types: string[];
}

interface ProductAttribute {
  id: number;
  type: string;
  value: string;
}

interface GroupedAttributes {
  [key: string]: ProductAttribute[];
}

const ProductManager = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(50);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({ sku: '', name: '', color: '', category: '', design: '', image_url: '', available_qualities: [], available_packaging_types: [] });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { token, user } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ color: '', category: '', design: '' });
  const [activeFilters, setActiveFilters] = useState({ color: '', category: '', design: '' });
  const [attributes, setAttributes] = useState<GroupedAttributes>({});
  const [lastCreatedProduct, setLastCreatedProduct] = useState<Product | null>(null);


  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { isOpen: isArchiveOpen, onOpen: onArchiveOpen, onClose: onArchiveClose } = useDisclosure();
  const [productToArchive, setProductToArchive] = useState<number | null>(null);
  const cancelRef = useRef(null);


  const fetchProducts = async (reset = false) => {
    if (!token) return;
    
    const pageToFetch = reset ? 1 : currentPage;
    const offset = (pageToFetch - 1) * productsPerPage;

    try {
      const response = await api.get('/products', {
        params: {
          limit: productsPerPage,
          offset,
          ...activeFilters,
        },
      });

      if (reset) {
        setProducts(response.data.data);
        setCurrentPage(1);
      } else {
        if (currentPage === 1) {
            setProducts(response.data.data);
        } else {
            setProducts(prevProducts => [...prevProducts, ...response.data.data]);
        }
      }
      setTotalProducts(response.data.totalCount);
    } catch (err) {
      console.error('Failed to fetch products', err);
      toast({
        title: t('product_manager.toast.error_fetching_data'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('product_manager.toast.error_fetching_data_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, productsPerPage, activeFilters]);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (!user?.organization_id) return;
      try {
        const { data } = await api.get<ProductAttribute[]>('/settings/attributes', {
          params: { organization_id: user.organization_id },
        });
        const grouped = data.reduce((acc, attr) => {
          const { type } = attr;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(attr);
          return acc;
        }, {} as GroupedAttributes);
        setAttributes(grouped);
      } catch (err) {
        console.error('Failed to fetch attributes', err);
        toast({
          title: "Error",
          description: "Could not load product attributes.",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchAttributes();
  }, [user?.organization_id, toast]);

  const handleNewProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleEditingProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingProduct((prev) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsUploading(true);

    const productData = { ...newProduct };

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResponse = await api.post('/products/upload-image', formData);
        productData.image_url = uploadResponse.data.url;
      }

      const response = await api.post('/products', productData);
      const createdProduct = response.data;
      
      fetchProducts(true); // Refetch products from page 1
      setLastCreatedProduct(createdProduct); // Save the newly created product for the next pre-fill
      
      // Reset the form to a clean state
      setNewProduct({ sku: '', name: '', color: '', category: '', design: '', image_url: '', available_qualities: [], available_packaging_types: [] });
      setImageFile(null);
      setImagePreview(null);
      onCreateClose();
      toast({ title: t('product_manager.toast.product_created'), status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({
        title: t('product_manager.toast.error_creating_product'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('product_manager.toast.error_creating_product_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct({
      ...product,
      available_qualities: product.available_qualities || [],
      available_packaging_types: product.available_packaging_types || [],
    });
    setImageFile(null);
    setImagePreview(product.image_url);
    onEditOpen();
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    setIsUploading(true);

    const productData = { ...editingProduct };

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResponse = await api.post('/products/upload-image', formData);
        productData.image_url = uploadResponse.data.url;
      }

      const response = await api.patch(`/products/${editingProduct.id}`, productData);
      setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      setEditingProduct(null);
      setImageFile(null);
      setImagePreview(null);
      onEditClose();
      toast({ title: t('product_manager.toast.product_updated'), status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({
        title: t('product_manager.toast.error_updating_product'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('product_manager.toast.error_updating_product_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleArchiveProduct = async (productId: number) => {
    if (!token) return;
    try {
      await api.patch(`/products/${productId}/archive`);
      fetchProducts(true); // Refetch products from page 1
      toast({ title: t('product_manager.toast.product_archived'), status: 'warning', duration: 3000, isClosable: true });
    } catch (err) {
      console.error('Failed to archive product:', err);
      toast({
        title: t('product_manager.toast.error_archiving_product'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('product_manager.toast.error_archiving_product_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openArchiveDialog = (productId: number) => {
    setProductToArchive(productId);
    onArchiveOpen();
  };

  const confirmArchive = () => {
    if (productToArchive) {
      handleArchiveProduct(productToArchive);
    }
    onArchiveClose();
  };


  const handleFilter = () => {
    setCurrentPage(1); // Reset to first page on new filter
    setActiveFilters(filters);
  };

  const filteredProducts = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size={{ base: 'md', md: 'lg' }} mb={{ base: 4, md: 0 }}>
          {t('product_manager.title')}
        </Heading>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 4 }} spacing={2} alignItems="center">
          <Input
            placeholder={t('product_manager.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            gridColumn={{ base: 'span 1', lg: 'span 2', xl: 'span 1' }}
          />
          <Button onClick={() => {
            if (lastCreatedProduct) {
              setNewProduct({
                name: '',
                sku: '',
                image_url: '',
                available_qualities: [],
                available_packaging_types: [],
                color: lastCreatedProduct.color,
                category: lastCreatedProduct.category,
                design: lastCreatedProduct.design,
              });
            } else {
              setNewProduct({
                sku: '', name: '', color: '', category: '', design: '', image_url: '', available_qualities: [], available_packaging_types: []
              });
            }
            setImageFile(null);
            setImagePreview(null);
            onCreateOpen();
          }} colorScheme="blue">
            {t('product_manager.add_new_product')}
          </Button>
          <Link href="/dashboard/products/bulk-import" style={{ width: '100%' }}>
            <Button colorScheme="green" leftIcon={<FiUpload />} w="full">
              {t('product_manager.import_from_csv')}
            </Button>
          </Link>
          <Link href="/dashboard/products/bulk-image-upload" style={{ width: '100%' }}>
            <Button colorScheme="purple" leftIcon={<FiUpload />} w="full">
              {t('product_manager.bulk_image_upload')}
            </Button>
          </Link>
        </SimpleGrid>
      </Flex>
      <Divider mb={6} />


      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
        <Select
          placeholder={t('product_manager.filter_by_category')}
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          {(attributes.category || []).map((attr) => (
            <option key={attr.id} value={attr.value}>
              {attr.value}
            </option>
          ))}
        </Select>
        <Select
          placeholder={t('product_manager.filter_by_design')}
          value={filters.design}
          onChange={(e) => setFilters({ ...filters, design: e.target.value })}
        >
          {(attributes.design || []).map((attr) => (
            <option key={attr.id} value={attr.value}>
              {attr.value}
            </option>
          ))}
        </Select>
        <Select
          placeholder={t('product_manager.filter_by_color')}
          value={filters.color}
          onChange={(e) => setFilters({ ...filters, color: e.target.value })}
        >
          {(attributes.color || []).map((attr) => (
            <option key={attr.id} value={attr.value}>
              {attr.value}
            </option>
          ))}
        </Select>
        <Button onClick={handleFilter} colorScheme="blue">{t('product_manager.filter')}</Button>
        <Button
          onClick={() => {
            setFilters({ color: '', category: '', design: '' });
            setActiveFilters({ color: '', category: '', design: '' });
            setCurrentPage(1);
          }}
          colorScheme="gray"
        >
          {t('product_manager.clear_filters')}
        </Button>
      </SimpleGrid>

      {/* Create Product Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => {
        setImageFile(null);
        setImagePreview(null);
        onCreateClose();
      }}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleCreateProduct}>
          <ModalHeader>{t('product_manager.create_modal.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack gap={3}>
              <Input placeholder={t('product_manager.create_modal.sku')} name="sku" value={newProduct.sku} onChange={handleNewProductInputChange} required />
              <Input placeholder={t('product_manager.create_modal.name')} name="name" value={newProduct.name} onChange={handleNewProductInputChange} required />
              
              <FormControl>
                <FormLabel>{t('product_manager.create_modal.category_label')}</FormLabel>
                <Select name="category" value={newProduct.category} onChange={handleNewProductInputChange} placeholder={t('product_manager.create_modal.select_category_placeholder')} focusBorderColor="blue.500">
                  {(attributes.category || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('product_manager.create_modal.design_label')}</FormLabel>
                <Select name="design" value={newProduct.design} onChange={handleNewProductInputChange} placeholder={t('product_manager.create_modal.select_design_placeholder')} focusBorderColor="blue.500">
                  {(attributes.design || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('product_manager.create_modal.color_label')}</FormLabel>
                <Select name="color" value={newProduct.color} onChange={handleNewProductInputChange} placeholder={t('product_manager.create_modal.select_color_placeholder')} focusBorderColor="blue.500">
                  {(attributes.color || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>{t('product_manager.image_upload.label')}</FormLabel>
                <Input type="file" accept="image/*" onChange={handleImageFileChange} p={1} />
                {imagePreview && <Image src={imagePreview} alt="Image preview" mt={2} boxSize="100px" objectFit="cover" />}
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('product_manager.create_modal.qualities')}</FormLabel>
                <CheckboxGroup
                  colorScheme="blue"
                  value={newProduct.available_qualities}
                  onChange={(values) => setNewProduct(prev => ({ ...prev, available_qualities: values as string[] }))}
                >
                  <Stack spacing={[1, 5]} direction={{ base: 'column', sm: 'row' }}>
                    {(attributes.quality || []).map(attr => (
                      <Checkbox key={attr.id} value={attr.value}>{attr.value}</Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <FormControl>
                <FormLabel>{t('product_manager.create_modal.packaging')}</FormLabel>
                <CheckboxGroup
                  colorScheme="blue"
                  value={newProduct.available_packaging_types}
                  onChange={(values) => setNewProduct(prev => ({ ...prev, available_packaging_types: values as string[] }))}
                >
                  <Stack spacing={[1, 5]} direction={{ base: 'column', sm: 'row' }}>
                    {(attributes.packaging_type || []).map(attr => (
                      <Checkbox key={attr.id} value={attr.value}>{attr.value}</Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" isLoading={isUploading}>{t('product_manager.create_modal.create_button')}</Button>
            <Button variant="ghost" onClick={onCreateClose}>{t('product_manager.create_modal.cancel_button')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal isOpen={isEditOpen} onClose={() => {
          setImageFile(null);
          setImagePreview(null);
          onEditClose();
        }}>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleUpdateProduct}>
            <ModalHeader>{t('product_manager.edit_modal.title')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack gap={3}>
                <Input placeholder={t('product_manager.create_modal.sku')} name="sku" value={editingProduct.sku} onChange={handleEditingProductInputChange} required />
                <Input placeholder={t('product_manager.create_modal.name')} name="name" value={editingProduct.name} onChange={handleEditingProductInputChange} required />
                
                <FormControl>
                  <FormLabel>{t('product_manager.create_modal.category_label')}</FormLabel>
                  <Select name="category" value={editingProduct.category} onChange={handleEditingProductInputChange} placeholder={t('product_manager.create_modal.select_category_placeholder')} focusBorderColor="blue.500">
                    {(attributes.category || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('product_manager.create_modal.design_label')}</FormLabel>
                  <Select name="design" value={editingProduct.design} onChange={handleEditingProductInputChange} placeholder={t('product_manager.create_modal.select_design_placeholder')} focusBorderColor="blue.500">
                    {(attributes.design || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('product_manager.create_modal.color_label')}</FormLabel>
                  <Select name="color" value={editingProduct.color} onChange={handleEditingProductInputChange} placeholder={t('product_manager.create_modal.select_color_placeholder')} focusBorderColor="blue.500">
                    {(attributes.color || []).map(attr => <option key={attr.id} value={attr.value}>{attr.value}</option>)}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('product_manager.image_upload.label')}</FormLabel>
                  <Input type="file" accept="image/*" onChange={handleImageFileChange} p={1} />
                  {imagePreview && <Image src={imagePreview} alt="Image preview" mt={2} boxSize="100px" objectFit="cover" />}
                </FormControl>
                
                <FormControl>
                  <FormLabel>{t('product_manager.create_modal.qualities')}</FormLabel>
                  <CheckboxGroup
                    colorScheme="blue"
                    value={editingProduct.available_qualities}
                    onChange={(values) => setEditingProduct(prev => prev ? { ...prev, available_qualities: values as string[] } : null)}
                  >
                    <Stack spacing={[1, 5]} direction={{ base: 'column', sm: 'row' }}>
                      {(attributes.quality || []).map(attr => (
                        <Checkbox key={attr.id} value={attr.value}>{attr.value}</Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('product_manager.create_modal.packaging')}</FormLabel>
                  <CheckboxGroup
                    colorScheme="blue"
                    value={editingProduct.available_packaging_types}
                    onChange={(values) => setEditingProduct(prev => prev ? { ...prev, available_packaging_types: values as string[] } : null)}
                  >
                    <Stack spacing={[1, 5]} direction={{ base: 'column', sm: 'row' }}>
                      {(attributes.packaging_type || []).map(attr => (
                        <Checkbox key={attr.id} value={attr.value}>{attr.value}</Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit" isLoading={isUploading}>{t('product_manager.edit_modal.save_button')}</Button>
              <Button variant="ghost" onClick={onEditClose}>{t('product_manager.edit_modal.cancel_button')}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <Box>
        {isMobile ? (
          <Accordion allowMultiple>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <AccordionItem key={product.id} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Flex align="center">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            boxSize="50px"
                            objectFit="cover"
                            borderRadius="md"
                            mr={4}
                            fallbackSrc="https://placehold.co/50"
                          />
                          <Text fontWeight="bold">{product.name}</Text>
                        </Flex>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={2}>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('product_manager.mobile.sku')}</Text>
                        <Text>{product.sku}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('product_manager.mobile.design')}</Text>
                        <Text>{product.design}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontWeight="bold">{t('product_manager.mobile.color')}</Text>
                        <Text>{product.color}</Text>
                      </Flex>
                      <Flex mt={4} wrap="wrap" gap={2}>
                        <Button size="sm" onClick={() => startEditing(product)} colorScheme="blue">{t('product_manager.mobile.edit')}</Button>
                        <Button size="sm" colorScheme="red" onClick={() => openArchiveDialog(product.id)}>{t('product_manager.mobile.archive')}</Button>
                      </Flex>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))
            ) : (
              <Text textAlign="center" p={4}>
                {t('product_manager.no_products_found')}
              </Text>
            )}
          </Accordion>
        ) : (
          <TableContainer>
            <Table variant="simple" colorScheme="blue">
              <Thead bg="brand.background">
                <Tr>
                  <Th>{t('product_manager.table.image')}</Th>
                  <Th>{t('product_manager.table.name')}</Th>
                  <Th>{t('product_manager.table.sku')}</Th>
                  <Th>{t('product_manager.table.design')}</Th>
                  <Th>{t('product_manager.table.color')}</Th>
                  <Th>{t('product_manager.table.actions')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.map((product) => (
                  <Tr key={product.id}
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
                        src={product.image_url}
                        alt={product.name}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                        fallbackSrc="https://placehold.co/50"
                      />
                    </Td>
                    <Td>
                      <Text noOfLines={1}>{product.name}</Text>
                    </Td>
                    <Td>
                      <Text noOfLines={1}>{product.sku}</Text>
                    </Td>
                    <Td><Text noOfLines={1}>{product.design}</Text></Td>
                    <Td><Text noOfLines={1}>{product.color}</Text></Td>
                    <Td>
                      <Flex wrap="wrap" gap={2}>
                        <Button size="sm" onClick={() => startEditing(product)} colorScheme="blue">{t('product_manager.mobile.edit')}</Button>
                        <Button size="sm" colorScheme="red" onClick={() => openArchiveDialog(product.id)}>{t('product_manager.mobile.archive')}</Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Flex justify="center" mt={6}>
        {products.length > 0 && products.length < totalProducts && (
          <Button
            onClick={() => setCurrentPage(prev => prev + 1)}
            isDisabled={products.length >= totalProducts}
          >
            {t('pagination.load_more')}
          </Button>
        )}
      </Flex>

      <AlertDialog
        isOpen={isArchiveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onArchiveClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('product_manager.archive_dialog.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('product_manager.archive_dialog.body')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onArchiveClose}>
                {t('product_manager.archive_dialog.cancel_button')}
              </Button>
              <Button colorScheme="red" onClick={confirmArchive} ml={3}>
                {t('product_manager.archive_dialog.archive_button')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProductManager;