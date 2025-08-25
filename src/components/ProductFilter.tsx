'use client';

import {
  Box,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductFilterProps {
  onFilter: (filters: { name: string; category: string; design: string }) => void;
}

const ProductFilter = ({ onFilter }: ProductFilterProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [design, setDesign] = useState('');

  const handleFilter = () => {
    onFilter({ name, category, design });
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" boxShadow="sm" mb={4}>
      <HStack spacing={4}>
        <FormControl>
          <FormLabel>{t('products.filter.name')}</FormLabel>
          <Input
            placeholder={t('products.filter.name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('products.filter.category')}</FormLabel>
          <Input
            placeholder={t('products.filter.category_placeholder')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t('products.filter.design')}</FormLabel>
          <Input
            placeholder={t('products.filter.design_placeholder')}
            value={design}
            onChange={(e) => setDesign(e.target.value)}
          />
        </FormControl>
      </HStack>
      <Button mt={4} onClick={handleFilter}>
        {t('products.filter.apply')}
      </Button>
    </Box>
  );
};

export default ProductFilter;