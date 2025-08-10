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
  VStack,
  Input,
  Link,
  Text,
  Box,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFile, FiDownload } from 'react-icons/fi';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ProductImportModal = ({ isOpen, onClose, onImportSuccess }: ProductImportModalProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: t('product_import_modal.toast.no_file_selected'),
        description: t('product_import_modal.toast.no_file_selected_description'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsImporting(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (response.status === 403) {
          toast({
            title: t('product_import_modal.toast.auth_error_title'),
            description: t('product_import_modal.toast.auth_error_description'),
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        } else if (response.status === 400 && contentType && contentType.includes('text/csv')) {
          // It's a CSV with errors, trigger download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'import_errors.csv';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          toast({
            title: t('product_import_modal.toast.validation_error'),
            description: t('product_import_modal.toast.download_error_report'),
            status: 'error',
            duration: 9000,
            isClosable: true,
          });
        } else {
          // It's another kind of error
          const result = await response.json();
          throw new Error(result.message || t('product_import_modal.toast.import_failed_description'));
        }
      } else {
        const result = await response.json();
        toast({
          title: t('product_import_modal.toast.import_success'),
          description: t('product_import_modal.toast.import_success_description', { count: result.count }),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onImportSuccess();
        handleClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: t('product_import_modal.toast.import_failed'),
        description: errorMessage,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setIsImporting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('product_import_modal.title')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
              <Text fontWeight="bold">{t('product_import_modal.instructions_title')}</Text>
              <Text fontSize="sm">{t('product_import_modal.instructions_body')}</Text>
              <Link href="/product_template.csv" download color="blue.500" mt={2} display="inline-flex" alignItems="center">
                <FiDownload style={{ marginRight: '4px' }} />
                {t('product_import_modal.download_template')}
              </Link>
            </Box>

            <Box
              p={6}
              borderWidth="2px"
              borderRadius="lg"
              borderStyle="dashed"
              textAlign="center"
              position="relative"
            >
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                position="absolute"
                top="0"
                left="0"
                width="100%"
                height="100%"
                opacity="0"
                cursor="pointer"
              />
              <FiFile size="24px" />
              <Text mt={2}>
                {selectedFile ? selectedFile.name : t('product_import_modal.drag_drop_or_click')}
              </Text>
            </Box>

            {isImporting && <Progress size="xs" isIndeterminate />}

          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('product_import_modal.cancel_button')}
          </Button>
          <Button
            colorScheme="green"
            onClick={handleImport}
            isDisabled={!selectedFile || isImporting}
            isLoading={isImporting}
          >
            {t('product_import_modal.import_button')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};