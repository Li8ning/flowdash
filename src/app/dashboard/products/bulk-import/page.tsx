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
  HStack,
  Tag,
  Center,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Link,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiCheckCircle, FiAlertTriangle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface ImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  importedProducts: { sku: string; name: string; }[];
  skippedProducts: { sku: string; name: string; }[];
  errorRows: { row: number; errors: string[]; }[];
}

const BulkProductImporter = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setImportResult(null); // Reset results when a new file is selected
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) {
      toast({
        title: t('bulk_import_page.toast.no_file_selected'),
        description: t('bulk_import_page.toast.no_file_selected_description'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle CSV error response
        if (response.headers.get('Content-Type')?.includes('text/csv')) {
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
                title: t('bulk_import_page.toast.import_failed_with_errors'),
                description: t('bulk_import_page.toast.error_report_downloaded'),
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            setImportResult(null); // Or a specific error state
        } else {
            throw new Error(result.message || 'An unknown error occurred.');
        }
      } else {
        setImportResult(result);
        toast({
          title: t('bulk_import_page.toast.import_complete'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }

    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: t('bulk_import_page.toast.import_failed'),
        description,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const resetImporter = () => {
    setFile(null);
    setImportResult(null);
  }

  const renderImportForm = () => (
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
              ? t('bulk_import_page.dropzone.drop_here')
              : t('bulk_import_page.dropzone.drag_and_drop')}
          </Text>
        </VStack>
      </Center>

      {file && (
        <Box>
          <Text fontWeight="bold">{t('bulk_import_page.file_selected')}</Text>
          <HStack mt={2}>
            <Icon as={FiFile} />
            <Text>{file.name}</Text>
          </HStack>
        </Box>
      )}

      <Button
        colorScheme="blue"
        onClick={handleImport}
        isLoading={isImporting}
        isDisabled={!file}
        leftIcon={<FiUpload />}
      >
        {isImporting ? t('bulk_import_page.importing_button') : t('bulk_import_page.import_button')}
      </Button>
    </VStack>
  );

  const renderResults = () => {
    if (!importResult) return null;

    const { importedCount, skippedCount, errorCount, importedProducts, skippedProducts, errorRows } = importResult;

    return (
        <VStack spacing={6} align="stretch">
            <HStack justify="space-between" direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} w="100%">
                <Heading as="h2" size={{ base: 'md', md: 'lg' }}>{t('bulk_import_page.results.title')}</Heading>
                <Button onClick={() => router.push('/dashboard/products')} colorScheme="green" rightIcon={<FiArrowRight />} flexShrink={0}>
                    {t('bulk_import_page.results.go_to_products')}
                </Button>
            </HStack>

            <HStack spacing={4} wrap="wrap">
                <Tag colorScheme="green" size="lg"><Icon as={FiCheckCircle} mr={2} />{t('bulk_import_page.results.imported', { count: importedCount })}</Tag>
                <Tag colorScheme="orange" size="lg"><Icon as={FiAlertTriangle} mr={2} />{t('bulk_import_page.results.skipped', { count: skippedCount })}</Tag>
                <Tag colorScheme="red" size="lg"><Icon as={FiXCircle} mr={2} />{t('bulk_import_page.results.errors', { count: errorCount })}</Tag>
            </HStack>

            <Tabs variant="enclosed">
                <TabList>
                    <Tab>{t('bulk_import_page.results.tabs.imported')}</Tab>
                    <Tab>{t('bulk_import_page.results.tabs.skipped')}</Tab>
                    <Tab>{t('bulk_import_page.results.tabs.errors')}</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <TableContainer>
                            <Table variant="simple">
                                <Thead>
                                    <Tr><Th>SKU</Th><Th>{t('common.product.name')}</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {importedProducts.map((p, i) => <Tr key={i}><Td>{p.sku}</Td><Td>{p.name}</Td></Tr>)}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </TabPanel>
                    <TabPanel>
                        <TableContainer>
                            <Table variant="simple">
                                <Thead>
                                    <Tr><Th>SKU</Th><Th>{t('common.product.name')}</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {skippedProducts.map((p, i) => <Tr key={i}><Td>{p.sku}</Td><Td>{p.name}</Td></Tr>)}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </TabPanel>
                    <TabPanel>
                        <TableContainer>
                            <Table variant="simple">
                                <Thead>
                                    <Tr><Th>{t('bulk_import_page.results.table.row')}</Th><Th>{t('bulk_import_page.results.table.error_details')}</Th></Tr>
                                </Thead>
                                <Tbody>
                                    {errorRows.map((e, i) => <Tr key={i}><Td>{e.row}</Td><Td>{e.errors.join(', ')}</Td></Tr>)}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </TabPanel>
                </TabPanels>
            </Tabs>
            
            <Button onClick={resetImporter} variant="outline">{t('bulk_import_page.results.import_another')}</Button>
        </VStack>
    );
  };

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size={{ base: 'lg', md: 'xl' }}>
            {t('bulk_import_page.title')}
          </Heading>
          <Text mt={2}>
            {t('bulk_import_page.description')}
          </Text>
        </Box>

        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>{t('bulk_import_page.instructions.title')}</AlertTitle>
            <AlertDescription>
              {t('bulk_import_page.instructions.body_1')}
              <Link href="/product_template.csv" color="blue.500" isExternal download>
                {t('bulk_import_page.instructions.download_link')}
              </Link>
              {t('bulk_import_page.instructions.body_2')}
            </AlertDescription>
          </Box>
        </Alert>

        {importResult ? renderResults() : renderImportForm()}
      </VStack>
    </Container>
  );
};

export default BulkProductImporter;