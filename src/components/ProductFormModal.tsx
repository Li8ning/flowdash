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
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  useToast,
  Image,
  Box,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductAttribute } from '@/types';
import api from '@/lib/api';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'quantity_on_hand'>) => void;
  product: Product | null;
}

const ProductFormModal = ({ isOpen, onClose, onSave, product }: ProductFormModalProps) => {
  const { t } = useTranslation(['products', 'common']);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [design, setDesign] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availablePackagingTypes, setAvailablePackagingTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductAttribute[]>([]);
  const [designs, setDesigns] = useState<ProductAttribute[]>([]);
  const [colors, setColors] = useState<ProductAttribute[]>([]);
  const [qualityOptions, setQualityOptions] = useState<ProductAttribute[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<ProductAttribute[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAttributes = async () => {
      try {
        const [categoriesRes, designsRes, colorsRes, qualitiesRes, packagingRes] = await Promise.all([
          api.get('/settings/attributes?type=category', { signal }),
          api.get('/settings/attributes?type=design', { signal }),
          api.get('/settings/attributes?type=color', { signal }),
          api.get('/settings/attributes?type=quality', { signal }),
          api.get('/settings/attributes?type=packaging_type', { signal }),
        ]);
        setCategories(categoriesRes.data);
        setDesigns(designsRes.data);
        setColors(colorsRes.data);
        setQualityOptions(qualitiesRes.data);
        setPackagingOptions(packagingRes.data);
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

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setColor(product.color);
      setCategory(product.category);
      setDesign(product.design);
      setImageUrl(product.image_url);
      setAvailableQualities(product.available_qualities);
      setAvailablePackagingTypes(product.available_packaging_types);
    } else {
      setName('');
      setSku('');
      setColor('');
      setCategory('');
      setDesign('');
      setImageUrl('');
      setAvailableQualities([]);
      setAvailablePackagingTypes([]);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      available_qualities: availableQualities,
      available_packaging_types: availablePackagingTypes,
    });
    onClose();
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append('file', imageFile);
    setIsUploading(true);

    try {
      const response = await api.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrl(response.data.url);
      toast({
        title: t('success.image_upload_title'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('errors.image_upload_title'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{product ? t('edit_product') : t('add_product')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="name" isRequired>
              <FormLabel>{t('form.name')}</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl id="sku" isRequired>
              <FormLabel>{t('form.sku')}</FormLabel>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </FormControl>
            <FormControl id="color" isRequired>
              <FormLabel>{t('form.color')}</FormLabel>
              <Select placeholder={t('form.select_color')} value={color} onChange={(e) => setColor(e.target.value)}>
                {colors.map((attr) => (
                  <option key={attr.id} value={attr.value}>
                    {attr.value}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl id="category" isRequired>
              <FormLabel>{t('form.category')}</FormLabel>
              <Select placeholder={t('form.select_category')} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((attr) => (
                  <option key={attr.id} value={attr.value}>
                    {attr.value}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl id="design" isRequired>
              <FormLabel>{t('form.design')}</FormLabel>
              <Select placeholder={t('form.select_design')} value={design} onChange={(e) => setDesign(e.target.value)}>
                {designs.map((attr) => (
                  <option key={attr.id} value={attr.value}>
                    {attr.value}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl id="imageUrl">
              <FormLabel>{t('form.image_url')}</FormLabel>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                p={1}
              />
              <Button onClick={handleImageUpload} isLoading={isUploading} size="sm" mt={2}>
                {t('form.upload_image')}
              </Button>
              {imageUrl && (
                <Box mt={2}>
                  <Image src={imageUrl} alt="Product Image" boxSize="100px" objectFit="cover" />
                </Box>
              )}
            </FormControl>
            <FormControl id="availableQualities">
              <FormLabel>{t('form.available_qualities')}</FormLabel>
              <CheckboxGroup colorScheme="blue" value={availableQualities} onChange={(values) => setAvailableQualities(values as string[])}>
                <Stack spacing={2} direction="row">
                  {qualityOptions.map((option) => (
                    <Checkbox key={option.id} value={option.value}>
                      {option.value}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>
            <FormControl id="availablePackagingTypes">
              <FormLabel>{t('form.available_packaging_types')}</FormLabel>
              <CheckboxGroup colorScheme="blue" value={availablePackagingTypes} onChange={(values) => setAvailablePackagingTypes(values as string[])}>
                <Stack spacing={2} direction="row">
                  {packagingOptions.map((option) => (
                    <Checkbox key={option.id} value={option.value}>
                      {option.value}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{t('cancel', { ns: 'common' })}</Button>
          <Button colorScheme="blue" ml={3} onClick={handleSave}>
            {t('save', { ns: 'common' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductFormModal;