'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Spinner,
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
} from '@chakra-ui/react';

interface Product {
  id: number;
  name: string;
  sku: string;
  model: string;
  color: string;
  image_url: string;
}

const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', model: '', color: '', image_url: '' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { token } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ color: '', model: '' });
  const [activeFilters, setActiveFilters] = useState({ color: '', model: '' });
  const [distinctColors, setDistinctColors] = useState([]);
  const [distinctModels, setDistinctModels] = useState([]);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();


  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [productsRes, colorsRes, modelsRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/distinct-colors'),
          api.get('/products/distinct-models'),
        ]);
        setProducts(productsRes.data);
        setDistinctColors(colorsRes.data);
        setDistinctModels(modelsRes.data);
      } catch (err) {
        console.error('Failed to fetch product data', err);
        toast({ title: 'Error fetching product data', status: 'error', duration: 3000, isClosable: true });
      }
    };

    if (token) {
      fetchFilterData();
    }
  }, [token, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    const { name, value } = e.target;
    setter((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const response = await api.post('/products', newProduct);
      setProducts([...products, response.data]);
      setNewProduct({ sku: '', name: '', model: '', color: '', image_url: '' });
      onCreateClose();
      toast({ title: 'Product created.', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error creating product', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    onEditOpen();
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    try {
      const response = await api.put(`/products/${editingProduct.id}`, editingProduct);
      setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      setEditingProduct(null);
      onEditClose();
      toast({ title: 'Product updated.', status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error updating product', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleArchiveProduct = async (productId: number) => {
    if (!token) return;
    if (window.confirm('Are you sure you want to archive this product?')) {
      try {
        await api.patch(`/products/${productId}/archive`);
        setProducts(products.filter(p => p.id !== productId));
        toast({ title: 'Product archived.', status: 'warning', duration: 3000, isClosable: true });
      } catch (err) {
        console.error('Failed to archive product:', err);
        toast({ title: 'Error archiving product', status: 'error', duration: 3000, isClosable: true });
      }
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
    const modelMatch = activeFilters.model ? product.model === activeFilters.model : true;

    return searchMatch && colorMatch && modelMatch;
  });

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size="lg" mb={{ base: 4, md: 0 }}>
          Product Management
        </Heading>
        <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={onCreateOpen} colorScheme="blue" flexShrink={0}>
            Add New Product
          </Button>
        </Flex>
      </Flex>
      <Divider mb={6} />

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
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
        <Button onClick={handleFilter} colorScheme="blue">Filter</Button>
        <Button
          onClick={() => {
            setFilters({ color: '', model: '' });
            setActiveFilters({ color: '', model: '' });
          }}
          colorScheme="gray"
        >
          Clear Filters
        </Button>
      </SimpleGrid>

      {/* Create Product Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleCreateProduct}>
          <ModalHeader>Add New Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack gap={3}>
              <Input placeholder="SKU" name="sku" value={newProduct.sku} onChange={(e) => handleInputChange(e, setNewProduct)} required />
              <Input placeholder="Name" name="name" value={newProduct.name} onChange={(e) => handleInputChange(e, setNewProduct)} required />
              <Input placeholder="Model" name="model" value={newProduct.model} onChange={(e) => handleInputChange(e, setNewProduct)} />
              <Input placeholder="Color" name="color" value={newProduct.color} onChange={(e) => handleInputChange(e, setNewProduct)} />
              <Input placeholder="Image URL" name="image_url" value={newProduct.image_url} onChange={(e) => handleInputChange(e, setNewProduct)} />
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} type="submit">Create Product</Button>
            <Button variant="ghost" onClick={onCreateClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal isOpen={isEditOpen} onClose={onEditClose}>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleUpdateProduct}>
            <ModalHeader>Edit Product</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack gap={3}>
                <Input placeholder="SKU" name="sku" value={editingProduct.sku} onChange={(e) => handleInputChange(e, setEditingProduct)} required />
                <Input placeholder="Name" name="name" value={editingProduct.name} onChange={(e) => handleInputChange(e, setEditingProduct)} required />
                <Input placeholder="Model" name="model" value={editingProduct.model} onChange={(e) => handleInputChange(e, setEditingProduct)} />
                <Input placeholder="Color" name="color" value={editingProduct.color} onChange={(e) => handleInputChange(e, setEditingProduct)} />
                <Input placeholder="Image URL" name="image_url" value={editingProduct.image_url} onChange={(e) => handleInputChange(e, setEditingProduct)} />
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="green" mr={3} type="submit">Save Changes</Button>
              <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <Box overflowX="auto">
        <TableContainer>
          <Table variant="simple" colorScheme="teal">
            <Thead bg="brand.background">
              <Tr>
                <Th>Image</Th>
                <Th>Name</Th>
              <Th>SKU</Th>
              <Th>Model</Th>
              <Th>Color</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredProducts.map((product) => (
              <Tr key={product.id}>
                <Td>
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc="https://via.placeholder.com/50"
                  />
                </Td>
                <Td>
                  <Text noOfLines={1}>{product.name}</Text>
                </Td>
                <Td>
                  <Text noOfLines={1}>{product.sku}</Text>
                </Td>
                <Td><Text noOfLines={1}>{product.model}</Text></Td>
                <Td><Text noOfLines={1}>{product.color}</Text></Td>
                <Td>
                  <Flex wrap="wrap" gap={2}>
                    <Button size="sm" onClick={() => startEditing(product)} colorScheme="blue">Edit</Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleArchiveProduct(product.id)}>Archive</Button>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ProductManager;