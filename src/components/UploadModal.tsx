'use client';

import { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  Progress,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

interface UploadResult {
  id?: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_size: number;
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadResults([]);
    setCsvContent('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadResults(data.results || []);

      // Generate CSV if there are successful uploads
      if (data.csv) {
        setCsvContent(data.csv);
      }

      toast({
        title: t('common.success'),
        description: t('media.upload_success', {
          successful: data.results.filter((r: UploadResult) => !r.error).length,
          total: selectedFiles.length
        }),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onSuccess();
    } catch {
      toast({
        title: t('common.error'),
        description: t('media.upload_error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const handleDownloadCSV = () => {
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uploaded_files_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setCsvContent('');
    setUploadProgress(0);
    onClose();
  };

  const successfulUploads = uploadResults.filter(result => !result.error);
  const failedUploads = uploadResults.filter(result => result.error);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={{ base: "full", md: "xl" }}>
      <ModalOverlay />
      <ModalContent maxW={{ base: "95vw", md: "auto" }}>
        <ModalHeader fontSize={{ base: "lg", md: "xl" }}>{t('media.upload_files')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                leftIcon={<AddIcon />}
                onClick={() => fileInputRef.current?.click()}
                isDisabled={uploading}
                width="full"
              >
                {t('media.select_files')}
              </Button>
            </Box>

            {selectedFiles.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={2}>
                  {t('media.selected_files', { count: selectedFiles.length })}
                </Text>
                <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                  {selectedFiles.map((file, index) => (
                    <HStack key={index} w="full">
                      <Icon as={AddIcon} color="gray.500" />
                      <Text fontSize="sm" flex={1}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {uploading && (
              <Box>
                <Text mb={2}>{t('media.uploading')}</Text>
                <Progress value={uploadProgress} colorScheme="blue" />
              </Box>
            )}

            {uploadResults.length > 0 && (
              <VStack spacing={4} align="stretch">
                {successfulUploads.length > 0 && (
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>{t('media.upload_success_title')}</AlertTitle>
                      <AlertDescription>
                        {t('media.upload_success_count', { count: successfulUploads.length })}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {failedUploads.length > 0 && (
                  <Alert status="error">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>{t('media.upload_failed_title')}</AlertTitle>
                      <AlertDescription>
                        {t('media.upload_failed_count', { count: failedUploads.length })}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {csvContent && (
                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>{t('media.csv_available')}</AlertTitle>
                      <AlertDescription>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="link"
                          onClick={handleDownloadCSV}
                        >
                          {t('media.download_csv')}
                        </Button>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleUpload}
            isLoading={uploading}
            loadingText={t('media.uploading')}
            isDisabled={selectedFiles.length === 0 || uploading}
          >
            {t('media.upload')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}