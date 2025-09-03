'use client';

import {
  Box,
  Heading,
  Text,
  VStack,
  useToast,
  Button,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  Tag,
  Center,
  Icon,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { FiCopy, FiDownload, FiUpload, FiFile } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';


interface UploadResult {
  fileName: string;
  url?: string;
  error?: string;
}

const BulkImageUploader = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setUploadResults([]); // Reset results when new files are selected
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
  });

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: t('bulk_image_uploader.toast.no_files_selected'),
        description: t('bulk_image_uploader.toast.no_files_selected_description'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      setUploadResults(result.results);
      toast({
        title: t('bulk_image_uploader.toast.upload_successful'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: t('bulk_image_uploader.toast.upload_failed'),
        description,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('bulk_image_uploader.results.copied_toast'),
      status: 'info',
      duration: 2000,
    });
  };

  const handleDownloadCsv = () => {
    const successfulUploads = uploadResults.filter(r => r.url);
    if (successfulUploads.length === 0) return;

    // Follow the bulk import product CSV format but only fill image_url column
    const csvHeader = 'name,sku,category,design,color,quality,packaging,image_url\n';
    const csvRows = successfulUploads.map((result) => {
      // Extract filename without extension for name
      const name = result.fileName.split('.').slice(0, -1).join('.');

      // Create SKU following standard rules: lowercase, no spaces, replace spaces/underscores with hyphens, remove special chars
      const sku = result.fileName
        .split('.').slice(0, -1).join('.') // Remove extension
        .toLowerCase() // Convert to lowercase
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/_+/g, '-') // Replace underscores with hyphens
        .replace(/[^a-z0-9\-]/g, '') // Remove special characters except hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      // Fill name and sku, leave other columns empty, only fill image_url
      return `"${name}","${sku}",,,,,,${result.url}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetUploader = () => {
    setFiles([]);
    setUploadResults([]);
  }

  const renderUploadForm = () => (
    <VStack spacing={6} align="stretch">
      <Center
        p={10}
        cursor="pointer"
        bg={isDragActive ? 'blue.50' : 'gray.50'}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.400' : 'gray.300'}
        borderRadius="md"
        transition="background-color 0.2s ease"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <VStack>
          <Icon as={FiUpload} boxSize={12} color="gray.500" />
          <Text>
            {isDragActive
              ? "Drop the files here ..."
              : "Drag 'n' drop some files here, or click to select files"}
          </Text>
        </VStack>
      </Center>

      {files && files.length > 0 && (
        <Box>
          <Text fontWeight="bold">{t('bulk_image_uploader.files_selected', { count: files.length })}</Text>
          <VStack align="start" mt={2}>
            {files.map(file => (
              <HStack key={file.name}>
                <Icon as={FiFile} />
                <Text>{file.name}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      <Button
        colorScheme="blue"
        onClick={handleUpload}
        isLoading={isUploading}
        isDisabled={!files || files.length === 0}
        leftIcon={<FiUpload />}
      >
        {isUploading ? t('bulk_image_uploader.uploading_button') : t('bulk_image_uploader.upload_button')}
      </Button>
    </VStack>
  );

  const renderResults = () => (
    <VStack spacing={6} align="stretch">
        <HStack justify="space-between" direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} w="100%">
            <Heading as="h2" size={{ base: 'md', md: 'lg' }}>{t('bulk_image_uploader.results.title')}</Heading>
            <Button onClick={resetUploader} flexShrink={0}>{t('bulk_image_uploader.results.upload_more')}</Button>
        </HStack>

      {uploadResults.filter(r => r.url).length > 0 && (
        <Button onClick={handleDownloadCsv} colorScheme="green" leftIcon={<FiDownload />}>
          {t('bulk_image_uploader.results.download_csv')}
        </Button>
      )}

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t('bulk_image_uploader.results.table.filename')}</Th>
              <Th>{t('bulk_image_uploader.results.table.status')}</Th>
              <Th>{t('bulk_image_uploader.results.table.url_error')}</Th>
              <Th>{t('bulk_image_uploader.results.table.actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {uploadResults.map((result, index) => (
              <Tr key={index}>
                <Td>{result.fileName}</Td>
                <Td>
                  {result.url ? (
                    <Tag colorScheme="green">{t('bulk_image_uploader.results.status.success')}</Tag>
                  ) : (
                    <Tag colorScheme="red">{t('bulk_image_uploader.results.status.failed')}</Tag>
                  )}
                </Td>
                <Td maxW="300px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                  {result.url || result.error}
                </Td>
                <Td>
                  {result.url && (
                    <IconButton
                      aria-label={t('bulk_image_uploader.results.copy_url')}
                      icon={<FiCopy />}
                      onClick={() => handleCopyToClipboard(result.url!)}
                    />
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );

  if (user?.role === 'floor_staff') {
    return (
      <Box textAlign="center" py={10} px={6}>
        <Heading as="h2" size="xl" mt={6} mb={2}>
          {t('access_denied.title')}
        </Heading>
        <Text color={'gray.500'}>
          {t('access_denied.description')}
        </Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
            {t('bulk_image_uploader.title')}
          </Heading>
          <Text mt={2}>
            {t('bulk_image_uploader.description')}
          </Text>
        </Box>

        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>{t('bulk_image_uploader.instructions.title')}</AlertTitle>
            <AlertDescription>
              {t('bulk_image_uploader.instructions.body')}
            </AlertDescription>
          </Box>
        </Alert>

        {uploadResults.length > 0 ? renderResults() : renderUploadForm()}
      </VStack>
    </Container>
  );
};

export default BulkImageUploader;