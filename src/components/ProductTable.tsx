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
  useBreakpointValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  Flex,
  TableContainer,
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
  const [isArchiving, setIsArchiving] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleArchiveClick = (productId: number) => {
    setSelectedProductId(productId);
    onOpen();
  };

  const confirmArchive = async () => {
    if (selectedProductId !== null) {
      setIsArchiving(true);
      try {
        await onArchive(selectedProductId);
        onClose();
      } finally {
        setIsArchiving(false);
      }
    }
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
      {isMobile ? (
        <Accordion allowMultiple>
          {products.map((product) => (
            <AccordionItem key={product.id} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Flex align="center" w="100%">
                      <Image
                        src={product.image_url || '/next.svg'}
                        alt={product.name}
                        boxSize="50px"
                        objectFit="contain"
                        borderRadius="md"
                        mr={4}
                      />
                      <Flex justify="space-between" align="center" w="100%">
                        <VStack align="flex-start" spacing={0}>
                          <Text fontWeight="bold">{product.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {product.category}
                          </Text>
                        </VStack>
                      </Flex>
                    </Flex>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <VStack align="stretch" spacing={2}>
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{t('create_modal.category_label')}:</Text>
                    <Text>{product.category}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{t('table.design')}:</Text>
                    <Text>{product.design}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="bold">{t('table.color')}:</Text>
                    <Text>{product.color}</Text>
                  </Flex>
                  <Flex mt={4}>
                    <Button
                      size="sm"
                      mr={2}
                      onClick={() => onEdit(product)}
                    >
                      {t('edit', { ns: 'common' })}
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleArchiveClick(product.id)}
                    >
                      {t('archive', { ns: 'common' })}
                    </Button>
                  </Flex>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>{t('table.image')}</Th>
                <Th>{t('table.name')}</Th>
                <Th>{t('create_modal.category_label')}</Th>
                <Th>{t('table.design')}</Th>
                <Th>{t('table.color')}</Th>
                <Th>{t('table.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {products.map((product) => (
                <Tr key={product.id}
                  sx={{
                    '@media (min-width: 769px)': {
                      '&:hover': {
                        backgroundColor: 'gray.50',
                        cursor: 'pointer'
                      }
                    }
                  }}
                >
                  <Td px={2}>
                    <Image
                      src={product.image_url || '/next.svg'}
                      alt={product.name}
                      boxSize="50px"
                      objectFit="contain"
                      borderRadius="md"
                    />
                  </Td>
                  <Td>{product.name}</Td>
                  <Td>{product.category}</Td>
                  <Td>{product.design}</Td>
                  <Td>{product.color}</Td>
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
        </TableContainer>
      )}

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={isArchiving ? () => {} : onClose}
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
              <Button ref={cancelRef} onClick={onClose} isDisabled={isArchiving}>
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button colorScheme="red" onClick={confirmArchive} ml={3} isLoading={isArchiving} loadingText={t('archiving', { ns: 'common' })}>
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