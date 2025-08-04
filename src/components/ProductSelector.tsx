'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import api from '../lib/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  model: string;
  color: string;
  image_url: string;
}

const LogEntryForm = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ color: '', model: '' });
  const [activeFilters, setActiveFilters] = useState({ color: '', model: '' });
  const [distinctColors, setDistinctColors] = useState([]);
  const [distinctModels, setDistinctModels] = useState([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, colorsRes, modelsRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/distinct-colors'),
          api.get('/products/distinct-models'),
        ]);
        setProducts(productsRes.data);
        setDistinctColors(colorsRes.data);
        setDistinctModels(modelsRes.data);
      } catch (error) {
        console.error('Failed to fetch product data', error);
        toast({
          title: 'Error fetching product data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchProducts();
  }, [toast]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    onOpen();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity, 10);
    if (!selectedProduct || !quantity || numQuantity < 1) {
      toast({
        title: 'Please select a product and enter a quantity greater than 0.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/inventory/logs', {
        product_id: selectedProduct.id,
        quantity_change: numQuantity,
      });
      toast({
        title: 'Log entry created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setQuantity('');
      onClose();
    } catch (error) {
      console.error('Failed to create log entry', error);
      toast({
        title: 'Error creating log entry.',
        status: 'error',
        duration: 3000,
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
    const modelMatch = activeFilters.model ? product.model === activeFilters.model : true;

    return searchMatch && colorMatch && modelMatch;
  });

  return (
    <Box p={{ base: 2, md: 4 }} bg="brand.surface">
      <Stack spacing={6}>
        <Heading as="h2" size="lg" textAlign="center">Create Production Log</Heading>
        <Input
          placeholder="Search by name, model, or color..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="lg"
        />
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
       <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={{ base: 3, md: 4 }}>
          {filteredProducts.map((product) => (
            <Box
              key={product.id}
              p={3}
              borderWidth="1px"
              borderRadius="lg"
              cursor="pointer"
              textAlign="center"
              bg="brand.background"
              borderColor="brand.lightBorder"
              onClick={() => handleProductSelect(product)}
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.05)', shadow: 'lg', borderColor: 'teal.500' }}
            >
              <VStack spacing={2}>
                <Image src={product.image_url || '/file.svg'} alt={product.name} boxSize={{ base: '100px', md: '150px' }} objectFit="cover" borderRadius="lg" />
                <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} noOfLines={2}>{product.name}</Text>
                <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600">{product.model}</Text>
                <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.500">{product.color}</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>

      {selectedProduct && (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmit}>
            <ModalHeader>Enter Quantity for</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack>
                <Image src={selectedProduct.image_url || '/file.svg'} alt={selectedProduct.name} boxSize="100px" objectFit="cover" borderRadius="lg" />
                <Heading size="md">{selectedProduct.name}</Heading>
                <Text color="gray.500">{selectedProduct.model} - {selectedProduct.color}</Text>
              </VStack>
              <FormControl mt={6} isRequired>
                <FormLabel>Quantity</FormLabel>
                <HStack maxW="320px" margin="0 auto">
                  <IconButton
                    aria-label="Decrement"
                    icon={<MinusIcon />}
                    size="lg"
                    onClick={() => setQuantity(q => String(Math.max(1, (Number(q) || 0) - 1)))}
                  />
                  <Input
                    type="number"
                    placeholder="e.g., 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    autoFocus
                    size="lg"
                    textAlign="center"
                    fontSize="2xl"
                  />
                  <IconButton
                    aria-label="Increment"
                    icon={<AddIcon />}
                    size="lg"
                    onClick={() => setQuantity(q => String((Number(q) || 0) + 1))}
                  />
                </HStack>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                loadingText="Submitting"
              >
                Submit Entry
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default LogEntryForm;