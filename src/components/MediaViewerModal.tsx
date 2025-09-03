'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Image,
  Text,
  VStack,
  HStack,
  Box,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Input,
} from '@chakra-ui/react';
import { CopyIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
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
  uploaded_by_name?: string;
  linked_products?: Array<{
    id: number;
    name: string;
    sku: string;
    category: string;
    design: string;
    color: string;
  }>;
}

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFile: MediaFile | null;
  mediaFiles?: MediaFile[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function MediaViewerModal({
  isOpen,
  onClose,
  mediaFile,
  mediaFiles = [],
  currentIndex = 0,
  onNavigate
}: MediaViewerModalProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fullMediaFile, setFullMediaFile] = useState<MediaFile | null>(null);

  const fetchFullMediaDetails = useCallback(async () => {
    if (!mediaFile) return;

    setLoading(true);
    // Clear previous full media file data to prevent flash of old content
    setFullMediaFile(null);
    try {
      const response = await fetch(`/api/media/${mediaFile.id}`);
      if (!response.ok) throw new Error('Failed to fetch media details');

      const data = await response.json();
      setFullMediaFile(data);
    } catch {
      toast({
        title: t('common.error'),
        description: t('media.fetch_details_error'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [mediaFile, toast, t]);

  useEffect(() => {
    if (isOpen && mediaFile) {
      fetchFullMediaDetails();
    }
  }, [isOpen, mediaFile, fetchFullMediaDetails]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('common.success'),
        description: t('media.url_copied'),
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: t('common.error'),
        description: t('media.copy_failed'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  const handleDelete = async () => {
    if (!mediaFile) return;

    try {
      const response = await fetch(`/api/media/${mediaFile.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media file');

      toast({
        title: t('common.success'),
        description: t('media.delete_success', { count: 1 }),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      // Trigger a refresh of the media library
      window.location.reload();
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

  if (!mediaFile) return null;

  const displayFile = fullMediaFile || mediaFile;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "6xl" }}>
      <ModalOverlay />
      <ModalContent height="100%" maxH="85vh" maxW={{ base: "95vw", md: "90vw" }}>
        {/* Header with navigation and close */}
        <Box position="relative" p={4} borderBottom="1px solid" borderColor="gray.200">
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="medium">{t('media.media_details')}</Text>
            <HStack spacing={1}>
              <IconButton
                aria-label="Previous media"
                icon={<ChevronLeftIcon />}
                size="md"
                variant="solid"
                colorScheme="gray"
                bg="gray.100"
                _hover={{ bg: "gray.200" }}
                isDisabled={currentIndex <= 0}
                onClick={() => {
                  if (onNavigate && currentIndex > 0) {
                    onNavigate(currentIndex - 1);
                  }
                }}
              />
              <IconButton
                aria-label="Next media"
                icon={<ChevronRightIcon />}
                size="md"
                variant="solid"
                colorScheme="gray"
                bg="gray.100"
                _hover={{ bg: "gray.200" }}
                isDisabled={currentIndex >= mediaFiles.length - 1}
                onClick={() => {
                  if (onNavigate && currentIndex < mediaFiles.length - 1) {
                    onNavigate(currentIndex + 1);
                  }
                }}
              />
              <IconButton
                aria-label="Close modal"
                icon={<Text fontSize="xl" fontWeight="bold">×</Text>}
                size="md"
                variant="solid"
                colorScheme="red"
                onClick={onClose}
              />
            </HStack>
          </HStack>
        </Box>

        <ModalBody p={0} height="100%" display="flex" flexDirection="column">
          {/* Desktop: Two Column Layout (65-35) */}
          <Box display={{ base: "block", md: "flex" }} flex="1" minH="0">
            {/* Image Section (65%) */}
            <Box
              flex={{ md: "0 0 65%" }}
              p={{ base: 4, md: 6 }}
              bg="gray.50"
              display="flex"
              alignItems="center"
              justifyContent="center"
              height={{ base: "300px", md: "100%" }}
              borderRight={{ md: "1px solid" }}
              borderColor={{ md: "gray.200" }}
            >
              <Image
                src={displayFile.filepath}
                alt={displayFile.filename}
                maxH={{ base: "250px", md: "100%" }}
                maxW="100%"
                objectFit="contain"
                borderRadius="0"
                fallback={
                  <Box
                    height={{ base: "200px", md: "300px" }}
                    width={{ base: "200px", md: "300px" }}
                    bg="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="0"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text color="gray.500" fontSize={{ base: "sm", md: "md" }}>{t('media.image_load_error')}</Text>
                  </Box>
                }
              />
            </Box>

            {/* Information Section (35%) */}
            <Box
              flex={{ md: "0 0 35%" }}
              p={{ base: 4, md: 6 }}
              overflowY="auto"
              height={{ base: "50vh", md: "100%" }}
              bg="white"
            >
              <VStack spacing={6} align="stretch">
                {/* File Information */}
                <Box>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="bold">Uploaded on:</Text> {formatDate(displayFile.created_at)}
                    </Text>
                    {displayFile.uploaded_by_name && (
                      <Text fontSize="sm" color="gray.600">
                        <Text as="span" fontWeight="bold">Uploaded by:</Text> {displayFile.uploaded_by_name}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="bold">File name:</Text> {displayFile.filename}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="bold">File type:</Text> {displayFile.file_type}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="bold">File size:</Text> {formatFileSize(displayFile.file_size)}
                    </Text>
                  </VStack>
                </Box>

                {/* URL Section */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    {t('media.file_url')}
                  </Text>
                  <Input
                    value={displayFile.filepath}
                    isReadOnly
                    size="sm"
                    fontFamily="mono"
                    fontSize="xs"
                  />
                  <Button
                    leftIcon={<CopyIcon />}
                    size="xs"
                    variant="outline"
                    w="full"
                    mt={2}
                    onClick={() => copyToClipboard(displayFile.filepath)}
                  >
                    {t('media.copy_url')}
                  </Button>
                </Box>

                {/* Delete Button */}
                <Box pt={4}>
                  <Button
                    leftIcon={<DeleteIcon />}
                    colorScheme="red"
                    variant="solid"
                    size="sm"
                    w="full"
                    onClick={handleDelete}
                  >
                    {t('common.delete')}
                  </Button>
                </Box>

                {/* Linked Products */}
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={3}>
                    {t('media.linked_products')}
                  </Text>

                  {loading ? (
                    <Box textAlign="center" py={4}>
                      <Spinner size="sm" />
                      <Text mt={2} fontSize="xs">{t('common.loading')}</Text>
                    </Box>
                  ) : displayFile.linked_products && displayFile.linked_products.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {displayFile.linked_products.map((product) => (
                        <Box key={product.id} p={2} bg="gray.50" borderRadius="0">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium" fontSize="xs">{product.name}</Text>
                            <Text fontSize="xs" color="gray.600">
                              SKU: {product.sku}
                            </Text>
                            {product.category && (
                              <Text fontSize="xs" color="gray.600">
                                {t('product.category')}: {product.category}
                              </Text>
                            )}
                            {product.design && (
                              <Text fontSize="xs" color="gray.600">
                                {t('product.design')}: {product.design}
                              </Text>
                            )}
                            {product.color && (
                              <Text fontSize="xs" color="gray.600">
                                {t('product.color')}: {product.color}
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Alert status="info" size="sm">
                      <AlertIcon />
                      <Text fontSize="xs">{t('media.no_linked_products')}</Text>
                    </Alert>
                  )}
                </Box>
              </VStack>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}