'use client';

import {
  Box,
  Grid,
  Image,
  Text,
  VStack,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
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

interface MediaGalleryProps {
  mediaFiles: MediaFile[];
  loading: boolean;
  selectedFiles: number[];
  bulkSelectMode: boolean;
  onSelectFile: (fileId: number, isSelected: boolean) => void;
  onViewFile: (file: MediaFile) => void;
}

export default function MediaGallery({
  mediaFiles,
  loading,
  selectedFiles,
  bulkSelectMode,
  onSelectFile,
  onViewFile,
}: MediaGalleryProps) {
  const { t } = useTranslation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');


  if (loading) {
    return (
      <Grid
        templateColumns={{
          base: "repeat(2, 1fr)",
          xs: "repeat(3, 1fr)",
          sm: "repeat(4, 1fr)",
          md: "repeat(5, 1fr)",
          lg: "repeat(6, 1fr)",
          xl: "repeat(7, 1fr)",
          "2xl": "repeat(8, 1fr)",
          "3xl": "repeat(9, 1fr)",
          "4xl": "repeat(10, 1fr)",
          "5xl": "repeat(11, 1fr)",
          "6xl": "repeat(12, 1fr)"
        }}
        gap={4}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Box key={index} borderWidth="1px" borderRadius="0" overflow="hidden">
            <Skeleton height="120px" />
          </Box>
        ))}
      </Grid>
    );
  }

  if (mediaFiles.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Text fontSize="lg" color="gray.500">
          {t('media.no_files')}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Grid
        templateColumns={{
          base: "repeat(2, 1fr)",
          xs: "repeat(3, 1fr)",
          sm: "repeat(4, 1fr)",
          md: "repeat(5, 1fr)",
          lg: "repeat(6, 1fr)",
          xl: "repeat(7, 1fr)",
          "2xl": "repeat(8, 1fr)",
          "3xl": "repeat(9, 1fr)",
          "4xl": "repeat(10, 1fr)",
          "5xl": "repeat(11, 1fr)",
          "6xl": "repeat(12, 1fr)"
        }}
        gap={4}
      >
        {mediaFiles.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          return (
            <Box
              key={file.id}
              borderWidth={bulkSelectMode && isSelected ? "3px" : "1px"}
              borderRadius="0"
              overflow="hidden"
              bg={bgColor}
              borderColor={bulkSelectMode && isSelected ? 'blue.500' : borderColor}
              transition="all 0.2s"
              _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
              cursor="pointer"
              onClick={() => bulkSelectMode ? onSelectFile(file.id, !isSelected) : onViewFile(file)}
              position="relative"
              opacity={bulkSelectMode && !isSelected ? 0.65 : 1}
              p={bulkSelectMode && isSelected ? 1 : 0}
            >
              {bulkSelectMode && isSelected && (
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
                objectFit="scale-down"
                width="100%"
                height={{ base: "120px", md: "120px", lg: "120px", xl: "120px", "2xl": "120px", "3xl": "120px", "4xl": "120px", "5xl": "120px", "6xl": "120px" }}
                fallback={
                  <Box
                    height={{ base: "120px", md: "120px", lg: "120px", xl: "120px", "2xl": "120px", "3xl": "120px", "4xl": "120px", "5xl": "120px", "6xl": "120px" }}
                    bg="gray.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500" fontSize="xs">{t('media.image_placeholder')}</Text>
                  </Box>
                }
              />
            </Box>
          );
        })}
      </Grid>
    </VStack>
  );
}