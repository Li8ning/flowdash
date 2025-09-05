'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
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
  Text,
  Image,
  Grid,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, CheckIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';

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

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaFile: MediaFile | null) => void;
  selectedImageId?: number;
}

export default function ImageSelector({ isOpen, onClose, onSelect, selectedImageId }: ImageSelectorProps) {
  const { t } = useTranslation();
  const toast = useToast();


  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce delay
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    if (isOpen) {
      setCurrentPage(1);
      setTotalCount(0);
      fetchMediaFilesCallback();
    }
  }, [isOpen, fetchMediaFilesCallback]);

  useEffect(() => {
    // Only try to find the file if we have both selectedImageId AND mediaFiles loaded
    if (selectedImageId && mediaFiles.length > 0) {
      const file = mediaFiles.find(f => f.id === selectedImageId);
      if (file) {
        setSelectedFile(file);
      }
    } else if (!selectedImageId) {
      setSelectedFile(null);
    }
  }, [selectedImageId, mediaFiles]);


  const handleSelectImage = (file: MediaFile) => {
    // If clicking the same image, deselect it; otherwise select the new image
    if (selectedFile?.id === file.id) {
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const handleConfirmSelection = () => {
    onSelect(selectedFile);
    onClose();
  };


  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();

        if (data.results && data.results.length > 0 && !data.results[0].error) {
          const newFile = data.results[0];
          // Add the new file to the list
          setMediaFiles(prev => [newFile, ...prev]);
          setSelectedFile(newFile);

          toast({
            title: t('common.success'),
            description: t('media.upload_success'),
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error(data.results[0]?.error || 'Upload failed');
        }
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

      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" blockScrollOnMount={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('media.select_image')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <InputGroup>
              <InputLeftElement>
                <SearchIcon />
              </InputLeftElement>
              <Input
                placeholder={t('media.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>

            {loading ? (
              <Box textAlign="center" py={8}>
                <Spinner />
                <Text mt={2}>{t('common.loading')}</Text>
              </Box>
            ) : (
              <Box maxH="400px" overflowY="auto">
                <VStack spacing={4} align="stretch">
                  <Grid
                    templateColumns={{
                      base: "repeat(2, 1fr)",
                      xs: "repeat(auto-fill, minmax(150px, 1fr))"
                    }}
                    gap={4}
                  >
                    {/* Upload Placeholder Box */}
                    <Box
                      key="upload-placeholder"
                      borderWidth="2px"
                      borderColor={uploading ? "orange.300" : "blue.300"}
                      borderStyle="dashed"
                      cursor={uploading ? "not-allowed" : "pointer"}
                      overflow="hidden"
                      onClick={() => !uploading && document.getElementById('image-upload')?.click()}
                      transition="all 0.2s"
                      _hover={!uploading ? {
                        bg: "blue.50",
                        borderColor: "blue.400",
                        shadow: 'md'
                      } : {}}
                      position="relative"
                      minH="120px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      bg={uploading ? "orange.50" : "gray.50"}
                    >
                      {uploading ? (
                        <>
                          <Spinner size="lg" color="orange.400" mb={2} />
                          <Text fontSize="sm" color="orange.600" fontWeight="medium" textAlign="center">
                            {t('media.uploading')}
                          </Text>
                        </>
                      ) : (
                        <>
                          <AddIcon boxSize={8} color="blue.400" mb={2} />
                          <Text fontSize="sm" color="blue.600" fontWeight="medium" textAlign="center">
                            {t('media.upload_new_image')}
                          </Text>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                        id="image-upload"
                        disabled={uploading}
                      />
                    </Box>

                    {/* Existing Media Files */}
                    {mediaFiles.map((file) => (
                      <Box
                        key={file.id}
                        borderWidth={selectedFile?.id === file.id ? "3px" : "1px"}
                        borderColor={selectedFile?.id === file.id ? 'blue.500' : 'gray.200'}
                        cursor="pointer"
                        overflow="hidden"
                        onClick={() => handleSelectImage(file)}
                        transform={selectedFile?.id === file.id ? 'scale(1.02)' : 'scale(1)'}
                        transition="all 0.2s"
                        _hover={{
                          opacity: 1,
                          transform: 'scale(1.02)',
                          shadow: 'md'
                        }}
                        position="relative"
                        p={selectedFile?.id === file.id ? 1 : 0}
                      >
                        {selectedFile?.id === file.id && (
                          <Box
                            position="absolute"
                            top={-2}
                            right={-2}
                            zIndex={2}
                            bg="blue.500"
                            borderRadius="0"
                            p={2}
                            boxShadow="sm"
                            border="2px solid white"
                          >
                            <CheckIcon color="white" boxSize={5} />
                          </Box>
                        )}
                        <Image
                          src={file.filepath}
                          alt={file.filename}
                          width="100%"
                          height="120px"
                          objectFit="scale-down"
                          fallback={
                            <Box
                              height="120px"
                              bg="gray.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" color="gray.500">
                                {t('media.image_placeholder')}
                              </Text>
                            </Box>
                          }
                        />
                      </Box>
                    ))}
                  </Grid>

                  {mediaFiles.length > 0 && (
                    <VStack spacing={4} align="center" pt={4}>
                      <Text fontSize="sm" color="gray.600">
                        {t('pagination.showing_entries', { count: mediaFiles.length })} out of {totalCount} media items
                      </Text>
                      {mediaFiles.length < totalCount && (
                        <Button
                          onClick={loadMore}
                          isLoading={loadingMore}
                          loadingText={t('common.loading')}
                          colorScheme="blue"
                          size="sm"
                        >
                          {t('pagination.load_more')}
                        </Button>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleConfirmSelection}
            isDisabled={!selectedFile}
          >
            {t('media.select_image')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}