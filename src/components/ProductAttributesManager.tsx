'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  CircularProgress,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

interface ProductAttribute {
  id: number;
  type: string;
  value: string;
}

const attributeTypes = [
  'category',
  'design',
  'color',
  'quality',
  'packaging_type',
];

const AttributeTabPanel = ({ attributeType }: { attributeType: string }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [newValue, setNewValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/settings/attributes', {
        params: { type: attributeType, organization_id: user?.organization_id },
      });
      setAttributes(data);
    } catch {
      toast({
        title: t('attributes.toast.fetch_error_title'),
        description: t('attributes.toast.fetch_error_desc'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [attributeType, user?.organization_id, toast, t]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      toast({
        title: t('attributes.toast.value_required_title'),
        description: t('attributes.toast.value_required_desc'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/settings/attributes', {
        type: attributeType,
        value: newValue,
      });
      setAttributes((prev) => [...prev, data]);
      setNewValue('');
      toast({
        title: t('attributes.toast.add_success_title'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast({
        title: t('attributes.toast.add_error_title'),
        description: error.response?.data?.error || t('attributes.toast.add_error_desc'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    try {
      await api.delete(`/settings/attributes/${id}`);
      setAttributes((prev) => prev.filter((attr) => attr.id !== id));
      toast({
        title: t('attributes.toast.delete_success_title'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('attributes.toast.delete_error_title'),
        description: t('attributes.toast.delete_error_desc'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateAttribute = async (id: number) => {
    if (!editingValue.trim()) {
      toast({
        title: t('attributes.toast.value_required_title'),
        description: t('attributes.toast.value_required_desc'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const { data } = await api.patch(`/settings/attributes/${id}`, { value: editingValue });
      setAttributes((prev) => prev.map((attr) => (attr.id === id ? data : attr)));
      setEditingAttributeId(null);
      setEditingValue('');
      toast({
        title: t('attributes.toast.update_success_title'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast({
        title: t('attributes.toast.update_error_title'),
        description: error.response?.data?.error || t('attributes.toast.update_error_desc'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditClick = (attribute: ProductAttribute) => {
    setEditingAttributeId(attribute.id);
    setEditingValue(attribute.value);
  };

  const handleCancelEdit = () => {
    setEditingAttributeId(null);
    setEditingValue('');
  };

  return (
    <Box>
      <Stack as="form" onSubmit={handleAddAttribute} spacing={4} mb={6}>
        <FormControl>
          <FormLabel htmlFor={`${attributeType}-value`}>
            {t('attributes.add_new_label', { type: t(`attributes.types.${attributeType}`) })}
          </FormLabel>
          <HStack>
            <Input
              id={`${attributeType}-value`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={t('attributes.add_new_placeholder', { type: t(`attributes.types.${attributeType}`) })}
            />
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              {t('attributes.add_button')}
            </Button>
          </HStack>
        </FormControl>
      </Stack>

      <Heading size="sm" mb={4}>{t('attributes.existing_label', { type: t(`attributes.types.${attributeType}`) })}</Heading>
      {isLoading ? (
        <Flex justify="center" align="center" h="100px">
          <CircularProgress isIndeterminate color="blue.300" />
        </Flex>
      ) : (
        <Wrap spacing={2}>
          {attributes.length > 0 ? (
            attributes.map((attribute) => (
              <WrapItem key={attribute.id}>
                {editingAttributeId === attribute.id ? (
                  <HStack as="form" onSubmit={(e) => { e.preventDefault(); handleUpdateAttribute(attribute.id); }}>
                    <Input
                      size="sm"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      autoFocus
                    />
                    <IconButton
                      aria-label={t('attributes.save_button')}
                      icon={<FaSave />}
                      size="sm"
                      colorScheme="green"
                      type="submit"
                    />
                    <IconButton
                      aria-label={t('attributes.cancel_button')}
                      icon={<FaTimes />}
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    />
                  </HStack>
                ) : (
                  <Tag size="lg" variant="solid" colorScheme="blue" borderRadius="full">
                    <TagLabel>{attribute.value}</TagLabel>
                    <IconButton
                      aria-label={t('attributes.edit_button')}
                      icon={<FaEdit />}
                      size="xs"
                      variant="ghost"
                      isRound
                      onClick={() => handleEditClick(attribute)}
                      ml={2}
                      mr={-1}
                      color="white"
                      _hover={{ color: 'blue.500', backgroundColor: 'white' }}
                    />
                    <TagCloseButton
                      onClick={() => handleDeleteAttribute(attribute.id)}
                      sx={{ color: 'white', '&:hover': { color: 'blue.500', backgroundColor: 'white' } }}
                    />
                  </Tag>
                )}
              </WrapItem>
            ))
          ) : (
            <Text color="brand.textSecondary">{t('attributes.no_attributes_found')}</Text>
          )}
        </Wrap>
      )}
    </Box>
  );
};

const ProductAttributesManager = () => {
  const { t } = useTranslation();

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md" mt={8}>
      <Heading size={{ base: 'sm', md: 'lg' }} mb={6}>
        {t('attributes.title')}
      </Heading>
      <Tabs isLazy variant="soft-rounded" colorScheme="blue">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList minW="max-content">
            {attributeTypes.map((type) => (
              <Tab key={type}>{t(`attributes.types.${type}`)}</Tab>
            ))}
          </TabList>
        </Box>
        <TabPanels mt={4}>
          {attributeTypes.map((type) => (
            <TabPanel key={type} p={0}>
              <AttributeTabPanel attributeType={type} />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ProductAttributesManager;