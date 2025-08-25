'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  useDisclosure,
  SimpleGrid,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiUpload } from 'react-icons/fi';
import Link from 'next/link';
import useProducts from '@/hooks/useProducts';
import ProductTable from './ProductTable';
import ProductFilter from './ProductFilter';
import ProductFormModal from './ProductFormModal';
import { Product } from '@/types';

const ProductManager = () => {
  const { t } = useTranslation();
  const {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    archiveProduct,
  } = useProducts();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleFilter = (filters: { name: string; category: string; design: string }) => {
    fetchProducts(filters);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    onOpen();
  };

  const handleSave = (productData: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setEditingProduct(null);
  };

  const handleArchive = (productId: number) => {
    archiveProduct(productId);
  };

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size={{ base: 'md', md: 'lg' }} mb={{ base: 4, md: 0 }}>
          {t('product_manager.title')}
        </Heading>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 4 }} spacing={2} alignItems="center">
          <Button onClick={onOpen} colorScheme="blue">
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

      <ProductFilter onFilter={handleFilter} />
      <ProductTable
        products={products}
        onEdit={handleEdit}
        onArchive={handleArchive}
        loading={loading}
        error={error}
      />
      <ProductFormModal
        isOpen={isOpen}
        onClose={() => {
          setEditingProduct(null);
          onClose();
        }}
        onSave={handleSave}
        product={editingProduct}
      />
    </Box>
  );
};

export default ProductManager;