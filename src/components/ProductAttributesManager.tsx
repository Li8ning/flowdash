'use client';

import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useCrud } from '@/hooks/useCrud';

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
  const { t } = useTranslation();
  const toast = useToast();
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const {
    data: attributes,
    loading: isLoading,
    createItem,
    updateItem,
    deleteItem,
  } = useCrud<ProductAttribute>({
    endpoint: `/settings/attributes?type=${attributeType}`,
    idKey: 'id',
  });

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
      await createItem({ type: attributeType, value: newValue });
      setNewValue('');
    } catch {
      // Error is already handled by the hook's toast
    } finally {
      setIsSubmitting(false);
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
      await updateItem(id, { value: editingValue });
      setEditingAttributeId(null);
      setEditingValue('');
    } catch {
      // Error is already handled by the hook's toast
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
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={2}>
            <Input
              id={`${attributeType}-value`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={t('attributes.add_new_placeholder', { type: t(`attributes.types.${attributeType}`) })}
            />
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
              {t('attributes.add_button')}
            </Button>
          </Stack>
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
                      onClick={() => deleteItem(attribute.id)}
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
    <Box p={{ base: 4, md: 6 }} borderWidth="1px" borderRadius="lg" shadow="md" mt={8}>
      <Heading size={{ base: 'md', md: 'lg' }} mb={6}>
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