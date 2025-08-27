'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';
import api from '@/lib/api';

const useProducts = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (filters: { name: string; category: string; design: string; color: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products', { params: filters });
      setProducts(response.data.data);
    } catch {
      setError(t('products.errors.fetch'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProducts({ name: '', category: '', design: '', color: '' });
  }, [fetchProducts]);

  const addProduct = async (product: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    try {
      await api.post('/products', product);
      fetchProducts({ name: '', category: '', design: '', color: '' });
      toast({
        title: t('products.success.add_title'),
        description: t('products.success.add_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('products.errors.add_title'),
        description: t('products.errors.add_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateProduct = async (productId: number, product: Omit<Product, 'id' | 'quantity_on_hand'>) => {
    try {
      await api.put(`/products/${productId}`, product);
      fetchProducts({ name: '', category: '', design: '', color: '' });
      toast({
        title: t('products.success.update_title'),
        description: t('products.success.update_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('products.errors.update_title'),
        description: t('products.errors.update_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const archiveProduct = async (productId: number) => {
    try {
      await api.delete(`/products/${productId}`);
      fetchProducts({ name: '', category: '', design: '', color: '' });
      toast({
        title: t('products.success.archive_title'),
        description: t('products.success.archive_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('products.errors.archive_title'),
        description: t('products.errors.archive_description'),
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
    fetchProducts,
    addProduct,
    updateProduct,
    archiveProduct,
  };
};

export default useProducts;