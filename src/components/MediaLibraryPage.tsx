'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  useToast,
  Text,
  VStack,
  HStack,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Checkbox,
  Collapse,
  Progress,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

import MediaGallery from './MediaGallery';
import MediaViewerModal from './MediaViewerModal';
import { useAuth } from '@/context/AuthContext';

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

export default function MediaLibraryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce delay
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [uploadExpanded, setUploadExpanded] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    disabled: !uploadExpanded,
  });

  const {
    isOpen: isViewerOpen,
    onOpen: onViewerOpen,
    onClose: onViewerClose,
  } = useDisclosure();

  const handleViewerClose = () => {
    // Clear the selected file and index when modal closes
    setSelectedFile(null);
    setCurrentMediaIndex(0);
    onViewerClose();
  };

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Check if user has access
  useEffect(() => {
    if (user && !['admin', 'super_admin'].includes(user.role)) {
      toast({
        title: t('common.access_denied'),
        description: t('media.access_denied_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [user, toast, t]);

  const fetchMediaFiles = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      params.append('page', page.toString());
      params.append('limit', '80');
      params.append('getTotal', 'true');

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media files');

      const data = await response.json();

      if (append) {
        setMediaFiles(prev => [...prev, ...(data.data || [])]);
      } else {
        setMediaFiles(data.data || []);
      }

      // Handle total count - if not provided and this is the first page, estimate based on returned data
      const total = data.total || (page === 1 && (data.data || []).length === 80 ? 80 : 0);
      setTotalCount(total);
      setCurrentPage(page);
    } catch {
      toast({
        title: t('common.error'),
        description: t('media.fetch_error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchQuery, toast, t]);

  const fetchMediaFilesCallback = useCallback(async () => {
    await fetchMediaFiles(1, false);
  }, [fetchMediaFiles]);

  const loadMore = async () => {
    if (mediaFiles.length < totalCount) {
      await fetchMediaFiles(currentPage + 1, true);
    }
  };

  useEffect(() => {
    if (user && ['admin', 'super_admin'].includes(user.role)) {
      fetchMediaFilesCallback();
    }
  }, [user, fetchMediaFilesCallback]);

  const handleSelectFile = (fileId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedFiles(mediaFiles.map(file => file.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode);
    if (bulkSelectMode) {
      // Exiting bulk select mode, clear selections
      setSelectedFiles([]);
    }
  };

  const exitBulkSelectMode = () => {
    setBulkSelectMode(false);
    setSelectedFiles([]);
  };

  const handleViewFile = (file: MediaFile) => {
    const index = mediaFiles.findIndex(f => f.id === file.id);
    setSelectedFile(file);
    setCurrentMediaIndex(index);
    onViewerOpen();
  };

  const handleNavigateMedia = (index: number) => {
    if (index >= 0 && index < mediaFiles.length) {
      setSelectedFile(mediaFiles[index]);
      setCurrentMediaIndex(index);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const response = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFiles }),
      });

      if (!response.ok) throw new Error('Failed to delete files');

      const data = await response.json();

      toast({
        title: t('common.success'),
        description: t('media.delete_success', { count: data.deleted_count }),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedFiles([]);
      exitBulkSelectMode(); // Revert to normal mode after successful deletion
      fetchMediaFiles(1, false);
    } catch {
      toast({
        title: t('common.error'),
        description: t('media.delete_error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: t('common.success'),
        description: t('media.upload_success', {
          successful: result.results.filter((r: { url?: string; error?: string }) => r.url).length,
          total: uploadFiles.length
        }),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset upload state
      setUploadFiles([]);
      setUploadExpanded(false);
      setUploadProgress(100);

      // Refresh media files
      fetchMediaFiles(1, false);
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
    }
  };

  const toggleUploadExpanded = () => {
    setUploadExpanded(!uploadExpanded);
    if (uploadExpanded) {
      // Reset when collapsing
      setUploadFiles([]);
      setUploadProgress(0);
    }
  };

  // Don't render if user doesn't have access
  if (user && !['admin', 'super_admin'].includes(user.role)) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center">
          <Heading size="lg">{t('common.access_denied')}</Heading>
          <Text>{t('media.access_denied_description')}</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.2xl" px={{ base: 2, md: 4 }} py={6}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
          <Heading size="lg">{t('media.library_title')}</Heading>
          <HStack spacing={3}>
            <Button
              leftIcon={uploadExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              colorScheme="blue"
              onClick={toggleUploadExpanded}
              size={{ base: 'sm', md: 'md' }}
            >
              {t('media.upload_files')}
            </Button>
          </HStack>
        </Flex>

        <Collapse in={uploadExpanded} animateOpacity>
          <VStack spacing={4} w="full">
            {/* Upload Area - Clickable for file selection */}
            <Box
              w="full"
              minH="200px"
              p={8}
              bg="gray.50"
              borderRadius="md"
              border="2px dashed"
              borderColor={isDragActive ? 'blue.400' : 'gray.300'}
              transition="all 0.2s"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="medium" textAlign="center">
                  {isDragActive
                    ? "Drop the files here..."
                    : "Drag 'n' drop some files here, or click to select files"}
                </Text>

                {uploadFiles.length > 0 && (
                  <Box w="full">
                    <Text fontWeight="medium" mb={2}>
                      {t('media.selected_files', { count: uploadFiles.length })}
                    </Text>
                    <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
                      {uploadFiles.map((file, index) => (
                        <HStack key={index} w="full">
                          <AddIcon color="gray.500" />
                          <Text fontSize="sm" flex={1}>
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {uploading && (
                  <Box w="full">
                    <Text mb={2}>{t('media.uploading')}</Text>
                    <Progress value={uploadProgress} colorScheme="blue" />
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Action Buttons - Outside the dropzone area */}
            <HStack spacing={3} justify="center">
              <Button
                colorScheme="blue"
                onClick={handleUpload}
                isLoading={uploading}
                loadingText={t('media.uploading')}
                isDisabled={uploadFiles.length === 0 || uploading}
              >
                {t('media.upload')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadFiles([]);
                  setUploadExpanded(false);
                }}
              >
                {t('common.cancel')}
              </Button>
            </HStack>
          </VStack>
        </Collapse>

        <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4} w="full">
          {/* Bulk select button and controls on the left */}
          <HStack spacing={3} flex={{ base: '1', md: 'none' }}>
            <Button
              colorScheme={bulkSelectMode ? 'red' : 'blue'}
              variant={bulkSelectMode ? 'solid' : 'outline'}
              onClick={toggleBulkSelectMode}
              size={{ base: 'sm', md: 'md' }}
              borderColor={bulkSelectMode ? undefined : 'blue.500'}
              color={bulkSelectMode ? undefined : 'blue.600'}
              _hover={bulkSelectMode ? undefined : { bg: 'blue.50' }}
            >
              {bulkSelectMode ? t('common.cancel') : t('media.bulk_select')}
            </Button>

            {bulkSelectMode && (
              <>
                <Checkbox
                  isChecked={selectedFiles.length === mediaFiles.length && mediaFiles.length > 0}
                  isIndeterminate={selectedFiles.length > 0 && selectedFiles.length < mediaFiles.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  {t('media.select_all')}
                </Checkbox>

                {selectedFiles.length > 0 && (
                  <HStack>
                    <Text fontSize="sm" color="gray.600">
                      {t('media.selected_count', { count: selectedFiles.length })}
                    </Text>
                    <IconButton
                      aria-label={t('common.delete')}
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      size="sm"
                      onClick={onDeleteOpen}
                    />
                  </HStack>
                )}
              </>
            )}
          </HStack>

          {/* Search bar on the right */}
          <InputGroup maxW={{ base: 'full', md: '400px' }} flex={{ base: '1', md: 'none' }} ml={bulkSelectMode ? 'auto' : '0'}>
            <InputLeftElement>
              <SearchIcon />
            </InputLeftElement>
            <Input
              placeholder={t('media.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Flex>

        <Box>
          <MediaGallery
            mediaFiles={mediaFiles}
            loading={loading}
            selectedFiles={selectedFiles}
            bulkSelectMode={bulkSelectMode}
            onSelectFile={handleSelectFile}
            onViewFile={handleViewFile}
          />
        </Box>

        {mediaFiles.length > 0 && (
          <VStack spacing={4} align="center">
            <Text fontSize="sm" color="gray.600">
              {t('pagination.showing_entries', { count: mediaFiles.length })} out of {totalCount} media items
            </Text>
            {mediaFiles.length < totalCount && (
              <Button
                onClick={loadMore}
                isLoading={loadingMore}
                loadingText={t('common.loading')}
                colorScheme="blue"
              >
                {t('pagination.load_more')}
              </Button>
            )}
          </VStack>
        )}
      </VStack>


      {selectedFile && (
        <MediaViewerModal
          isOpen={isViewerOpen}
          onClose={handleViewerClose}
          mediaFile={selectedFile}
          mediaFiles={mediaFiles}
          currentIndex={currentMediaIndex}
          onNavigate={handleNavigateMedia}
        />
      )}

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('media.delete_confirmation_title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('media.delete_confirmation_body', { count: selectedFiles.length })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                {t('common.cancel')}
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  handleDeleteSelected();
                  onDeleteClose();
                }}
                ml={3}
              >
                {t('common.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}