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
  Box,
  Image,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductAttribute } from '@/types';
import api from '@/lib/api';
import ImageSelector from './ImageSelector';

interface MediaFile {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  user_id: number;
}

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
  const [selectedImageId, setSelectedImageId] = useState<number | undefined>();
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const { isOpen: isImageSelectorOpen, onOpen: onImageSelectorOpen, onClose: onImageSelectorClose } = useDisclosure();
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availablePackagingTypes, setAvailablePackagingTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductAttribute[]>([]);
  const [designs, setDesigns] = useState<ProductAttribute[]>([]);
  const [colors, setColors] = useState<ProductAttribute[]>([]);
  const [qualityOptions, setQualityOptions] = useState<ProductAttribute[]>([]);
  const [packagingOptions, setPackagingOptions] = useState<ProductAttribute[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
      setSelectedImageId(product.media_id);
      setAvailableQualities(product.available_qualities);
      setAvailablePackagingTypes(product.available_packaging_types);
    } else {
      setName('');
      setSku('');
      setColor('');
      setCategory('');
      setDesign('');
      setSelectedImageId(undefined);
      setSelectedMediaFile(null);
      setAvailableQualities([]);
      setAvailablePackagingTypes([]);
    }
  }, [product]);

  useEffect(() => {
    // If we have a selectedImageId but no selectedMediaFile, we need to get the media details
    if (selectedImageId && !selectedMediaFile) {
      // First, try to use the product's existing image_url if it matches the selectedImageId
      if (product?.image_url && product?.media_id === selectedImageId) {
        // Create a partial media object for immediate preview
        const partialMediaFile = {
          id: product.media_id,
          filename: product.name || 'Product Image', // Use product name as fallback
          filepath: product.image_url,
          file_type: 'image/webp', // Assume webp, could be enhanced
          file_size: 0, // Not available in product data
          created_at: new Date().toISOString(), // Use current date as fallback
          updated_at: new Date().toISOString(), // Use current date as fallback
          user_id: 0 // Not available in product data
        };
        setSelectedMediaFile(partialMediaFile);
      } else {
        // Fetch media details for newly selected image
        const fetchMediaFile = async () => {
          try {
            const response = await fetch(`/api/media/${selectedImageId}`);
            if (response.ok) {
              const mediaFile = await response.json();
              setSelectedMediaFile(mediaFile);
            } else {
              setSelectedMediaFile(null);
            }
          } catch {
            setSelectedMediaFile(null);
          }
        };
        fetchMediaFile();
      }
    } else if (!selectedImageId) {
      setSelectedMediaFile(null);
    }
    // Note: We don't include selectedMediaFile in dependencies to avoid infinite loops
  }, [product, selectedImageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const productData = {
        name,
        sku,
        color,
        category,
        design,
        media_id: selectedImageId,
        available_qualities: availableQualities,
        available_packaging_types: availablePackagingTypes,
      };
      await onSave(productData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (mediaFile: MediaFile | null) => {
    if (mediaFile) {
      setSelectedImageId(mediaFile.id);
      setSelectedMediaFile(mediaFile);
    } else {
      setSelectedImageId(undefined);
      setSelectedMediaFile(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isSaving ? () => {} : onClose} blockScrollOnMount={false}>
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
            <FormControl id="image">
              <FormLabel>{t('form.image')}</FormLabel>
              <Button onClick={onImageSelectorOpen} colorScheme="blue" variant="outline">
                {selectedImageId ? t('form.change_image') : t('form.select_image')}
              </Button>
              {selectedMediaFile && (
                <Box mt={2}>
                  <Image
                    src={selectedMediaFile.filepath}
                    alt={selectedMediaFile.filename}
                    maxW="200px"
                    maxH="150px"
                    objectFit="scale-down"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  />
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
           <Button onClick={onClose} isDisabled={isSaving}>{t('cancel', { ns: 'common' })}</Button>
           <Button colorScheme="blue" ml={3} onClick={handleSave} isLoading={isSaving} loadingText={t('saving', { ns: 'common' })}>
             {t('save', { ns: 'common' })}
           </Button>
         </ModalFooter>
      </ModalContent>

      <ImageSelector
        isOpen={isImageSelectorOpen}
        onClose={onImageSelectorClose}
        onSelect={handleImageSelect}
        selectedImageId={selectedImageId}
      />
    </Modal>
  );
};

export default ProductFormModal;