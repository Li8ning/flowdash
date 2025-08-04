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
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', model: '', color: '', image_url: '' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { token } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();


  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get('/products');
        setProducts(response.data);
      } catch (err) {
        console.error(err);
        toast({ title: 'Error fetching products', status: 'error', duration: 3000, isClosable: true });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

  if (loading) return <Spinner />;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

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