'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';
import api from '@/lib/api';

const useProducts = (itemsPerPage: number = 50) => {
  const { t } = useTranslation('products');
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async (
    filters: { name: string; category: string; design: string; color: string },
    page: number = 1,
    limit: number = itemsPerPage
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        limit,
        offset: (page - 1) * limit,
      };
      const response = await api.get('/products', { params });
      setProducts(response.data.data);
      setTotalCount(response.data.totalCount || 0);
    } catch {
      setError(t('errors.fetch'));
    } finally {
      setLoading(false);
    }
  }, [t, itemsPerPage]);

  useEffect(() => {
    fetchProducts({ name: '', category: '', design: '', color: '' }, 1, itemsPerPage);
  }, [fetchProducts, itemsPerPage]);

  const addProduct = async (product: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    try {
      await api.post('/products', product);
      fetchProducts({ name: '', category: '', design: '', color: '' }, 1, itemsPerPage);
      toast({
        title: t('success.add_title'),
        description: t('success.add_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('errors.add_title'),
        description: t('errors.add_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateProduct = async (productId: number, product: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    try {
      await api.patch(`/products/${productId}`, product);
      fetchProducts({ name: '', category: '', design: '', color: '' }, 1, itemsPerPage);
      toast({
        title: t('success.update_title'),
        description: t('success.update_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('updateProduct error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as { response: unknown }).response);
      }
      toast({
        title: t('errors.update_title'),
        description: t('errors.update_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const archiveProduct = async (productId: number) => {
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts({ name: '', category: '', design: '', color: '' }, 1, itemsPerPage);
      toast({
        title: t('success.archive_title'),
        description: t('success.archive_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('archiveProduct error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Error response:', (error as { response: unknown }).response);
      }
      toast({
        title: t('errors.archive_title'),
        description: t('errors.archive_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return {
    products,
    loading,
    error,
    totalCount,
    fetchProducts,
    addProduct,
    updateProduct,
    archiveProduct,
  };
};

export default useProducts;