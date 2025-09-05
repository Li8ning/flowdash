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
import Pagination from './Pagination';
import { Product } from '@/types';

const ProductManager = () => {
  const { t } = useTranslation(['product_manager', 'common']);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const {
    products,
    loading,
    error,
    totalCount,
    fetchProducts,
    addProduct,
    updateProduct,
    archiveProduct,
  } = useProducts(itemsPerPage);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState({ name: '', category: '', design: '', color: '' });

  const handleFilter = (filters: { name: string; category: string; design: string; color: string }) => {
    setCurrentFilters(filters);
    setCurrentPage(1); // Reset to first page when applying filters
    fetchProducts(filters, 1, itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(currentFilters, page, itemsPerPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    fetchProducts(currentFilters, 1, newItemsPerPage);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    onOpen();
  };

  const handleSave = async (productData: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
    setEditingProduct(null);
  };

  const handleArchive = async (productId: number) => {
    await archiveProduct(productId);
    // Refetch with current filters and page
    fetchProducts(currentFilters, currentPage, itemsPerPage);
  };

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size={{ base: 'md', md: 'lg' }} mb={{ base: 4, md: 0 }}>
          {t('title')}
        </Heading>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 4 }} spacing={2} alignItems="center">
          <Button onClick={onOpen} colorScheme="blue">
            {t('add_new_product')}
          </Button>
          <Link href="/dashboard/products/bulk-import" style={{ width: '100%' }}>
            <Button colorScheme="green" leftIcon={<FiUpload />} w="full">
              {t('import_from_csv')}
            </Button>
          </Link>
          <Link href="/dashboard/products/bulk-image-upload" style={{ width: '100%' }}>
            <Button colorScheme="purple" leftIcon={<FiUpload />} w="full">
              {t('bulk_image_upload')}
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

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage)}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={loading}
        />
      )}

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