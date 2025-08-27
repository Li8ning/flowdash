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
  Image,
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
  const { t } = useTranslation(['product_manager', 'common']);
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

  if (products.length === 0) {
    return (
      <Box textAlign="center" p={10}>
        <Text>{t('no_products_found')}</Text>
      </Box>
    );
  }

  return (
    <>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{t('table.image')}</Th>
            <Th>{t('table.name')}</Th>
            <Th>{t('create_modal.category_label')}</Th>
            <Th>{t('table.design')}</Th>
            <Th>{t('table.color')}</Th>
            <Th>{t('table.quantity')}</Th>
            <Th>{t('table.actions')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => (
            <Tr key={product.id}>
              <Td>
                <Image
                  src={product.image_url || '/next.svg'}
                  alt={product.name}
                  boxSize="50px"
                  objectFit="cover"
                />
              </Td>
              <Td>{product.name}</Td>
              <Td>{product.category}</Td>
              <Td>{product.design}</Td>
              <Td>{product.color}</Td>
              <Td>{product.quantity_on_hand}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" onClick={() => onEdit(product)}>
                    {t('edit', { ns: 'common' })}
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleArchiveClick(product.id)}
                  >
                    {t('archive', { ns: 'common' })}
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
              {t('archive_dialog.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('archive_dialog.body')}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button colorScheme="red" onClick={confirmArchive} ml={3}>
                {t('archive', { ns: 'common' })}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ProductTable;