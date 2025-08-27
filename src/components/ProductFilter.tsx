'use client';

import {
  Box,
  Input,
  Button,
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { ProductAttribute } from '@/types';

interface ProductFilterProps {
  onFilter: (filters: { name: string; category: string; design: string; color: string }) => void;
}

const ProductFilter = ({ onFilter }: ProductFilterProps) => {
  const { t } = useTranslation('product_manager');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [design, setDesign] = useState('');
  const [color, setColor] = useState('');
  const [categories, setCategories] = useState<ProductAttribute[]>([]);
  const [designs, setDesigns] = useState<ProductAttribute[]>([]);
  const [colors, setColors] = useState<ProductAttribute[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAttributes = async () => {
      try {
        const [categoriesRes, designsRes, colorsRes] = await Promise.all([
          api.get('/settings/attributes?type=category', { signal }),
          api.get('/settings/attributes?type=design', { signal }),
          api.get('/settings/attributes?type=color', { signal }),
        ]);
        setCategories(categoriesRes.data);
        setDesigns(designsRes.data);
        setColors(colorsRes.data);
      } catch (error) {
        if ((error as Error).name !== 'CanceledError') {
          console.error("Failed to fetch attributes", error);
        }
      }
    };

    fetchAttributes();

    return () => {
      controller.abort();
    };
  }, []);

  const handleFilter = () => {
    onFilter({ name, category, design, color });
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" boxShadow="sm" mb={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <FormControl>
          <FormLabel>{t('create_modal.name')}</FormLabel>
          <Input
            placeholder={t('search_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('create_modal.category_label')}</FormLabel>
          <Select
            placeholder={t('create_modal.select_category_placeholder')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((attr) => (
              <option key={attr.id} value={attr.value}>
                {attr.value}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>{t('create_modal.design_label')}</FormLabel>
          <Select
            placeholder={t('create_modal.select_design_placeholder')}
            value={design}
            onChange={(e) => setDesign(e.target.value)}
          >
            {designs.map((attr) => (
              <option key={attr.id} value={attr.value}>
                {attr.value}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>{t('create_modal.color_label')}</FormLabel>
          <Select
            placeholder={t('create_modal.select_color_placeholder')}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          >
            {colors.map((attr) => (
              <option key={attr.id} value={attr.value}>
                {attr.value}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>
      <Button mt={4} onClick={handleFilter}>
        {t('filter')}
      </Button>
    </Box>
  );
};

export default ProductFilter;