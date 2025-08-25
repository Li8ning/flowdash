'use client';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Box,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onArchive: (productId: number) => void;
  loading: boolean;
  error: string | null;
}

const ProductTable = ({ products, onEdit, onArchive, loading, error }: ProductTableProps) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const handleArchiveClick = (productId: number) => {
    setSelectedProductId(productId);
    onOpen();
  };

  const confirmArchive = () => {
    if (selectedProductId !== null) {
      onArchive(selectedProductId);
    }
    onClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="200px">
        <Spinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box color="red.500">
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{t('products.table.header.name')}</Th>
            <Th>{t('products.table.header.category')}</Th>
            <Th>{t('products.table.header.design')}</Th>
            <Th>{t('products.table.header.stock')}</Th>
            <Th>{t('products.table.header.actions')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product.id}>
              <Td>{product.name}</Td>
              <Td>{product.category}</Td>
              <Td>{product.design}</Td>
              <Td>{product.quantity_on_hand}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" onClick={() => onEdit(product)}>
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleArchiveClick(product.id)}
                  >
                    {t('common.archive')}
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('products.archive_confirm.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('products.archive_confirm.message')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button colorScheme="red" onClick={confirmArchive} ml={3}>
                {t('common.archive')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ProductTable;