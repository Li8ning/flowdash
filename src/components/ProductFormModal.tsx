'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'quantity_on_hand'>) => void;
  product: Product | null;
}

const ProductFormModal = ({ isOpen, onClose, onSave, product }: ProductFormModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [design, setDesign] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [availableQualities, setAvailableQualities] = useState('');
  const [availablePackagingTypes, setAvailablePackagingTypes] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setColor(product.color);
      setCategory(product.category);
      setDesign(product.design);
      setImageUrl(product.image_url);
      setAvailableQualities(product.available_qualities.join(', '));
      setAvailablePackagingTypes(product.available_packaging_types.join(', '));
    } else {
      setName('');
      setSku('');
      setColor('');
      setCategory('');
      setDesign('');
      setImageUrl('');
      setAvailableQualities('');
      setAvailablePackagingTypes('');
    }
  }, [product]);

  const handleSave = () => {
    onSave({
      name,
      sku,
      color,
      category,
      design,
      image_url: imageUrl,
      available_qualities: availableQualities.split(',').map((s) => s.trim()),
      available_packaging_types: availablePackagingTypes.split(',').map((s) => s.trim()),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{product ? t('products.edit_product') : t('products.add_product')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="name" isRequired>
              <FormLabel>{t('products.form.name')}</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl id="sku" isRequired>
              <FormLabel>{t('products.form.sku')}</FormLabel>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </FormControl>
            <FormControl id="color" isRequired>
              <FormLabel>{t('products.form.color')}</FormLabel>
              <Input value={color} onChange={(e) => setColor(e.target.value)} />
            </FormControl>
            <FormControl id="category" isRequired>
              <FormLabel>{t('products.form.category')}</FormLabel>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </FormControl>
            <FormControl id="design" isRequired>
              <FormLabel>{t('products.form.design')}</FormLabel>
              <Input value={design} onChange={(e) => setDesign(e.target.value)} />
            </FormControl>
            <FormControl id="imageUrl">
              <FormLabel>{t('products.form.image_url')}</FormLabel>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </FormControl>
            <FormControl id="availableQualities">
              <FormLabel>{t('products.form.available_qualities')}</FormLabel>
              <Input value={availableQualities} onChange={(e) => setAvailableQualities(e.target.value)} />
            </FormControl>
            <FormControl id="availablePackagingTypes">
              <FormLabel>{t('products.form.available_packaging_types')}</FormLabel>
              <Input value={availablePackagingTypes} onChange={(e) => setAvailablePackagingTypes(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button colorScheme="blue" ml={3} onClick={handleSave}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductFormModal;