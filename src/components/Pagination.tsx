'use client';

import React from 'react';
import {
  Button,
  Flex,
  HStack,
  Text,
  Select,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  isLoading?: boolean;
  showInfo?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  showInfo = true,
}) => {
  const { t } = useTranslation();

  // Don't render pagination if there's no data
  if (totalItems === 0) {
    return null;
  }

  // Calculate the range of page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range to always show maxVisiblePages - 2 pages (excluding first and last)
      if (endPage - startPage < maxVisiblePages - 3) {
        if (startPage === 2) {
          endPage = Math.min(totalPages - 1, startPage + (maxVisiblePages - 3));
        } else if (endPage === totalPages - 1) {
          startPage = Math.max(2, endPage - (maxVisiblePages - 3));
        }
      }

      // Add ellipsis if there's a gap after first page
      if (startPage > 2) {
        pages.push('...');
      }

      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if there's a gap before last page
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value, 10);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  return (
    <VStack spacing={4} mt={6}>
      <Flex justify="space-between" align="center" w="full">
        {showInfo && (
          <Text fontSize="sm" color="gray.600">
            {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages} • {t('pagination.showing_entries', { count: Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage) })}
          </Text>
        )}

        {onItemsPerPageChange && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="gray.600">
              {t('pagination.items_per_page')}:
            </Text>
            <Select
              size="sm"
              value={itemsPerPage.toString()}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              w="80px"
              isDisabled={isLoading}
            >
              <option value="25">{t('pagination.items_per_page_25')}</option>
              <option value="50">{t('pagination.items_per_page_50')}</option>
              <option value="100">{t('pagination.items_per_page_100')}</option>
            </Select>
          </Flex>
        )}
      </Flex>

      <HStack spacing={2}>
        {/* First Page Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(1)}
          isDisabled={currentPage === 1 || isLoading}
          variant="outline"
          colorScheme="gray"
        >
          {t('pagination.first')}
        </Button>

        {/* Previous Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1 || isLoading}
        >
          {t('pagination.previous')}
        </Button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <Text fontSize="sm" color="gray.500" px={2}>
                ...
              </Text>
            ) : (
              <Button
                size="sm"
                variant={currentPage === page ? "solid" : "outline"}
                colorScheme={currentPage === page ? "blue" : "gray"}
                onClick={() => onPageChange(page as number)}
                isDisabled={isLoading}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages || isLoading}
        >
          {t('pagination.next')}
        </Button>

        {/* Last Page Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(totalPages)}
          isDisabled={currentPage === totalPages || isLoading}
          variant="outline"
          colorScheme="gray"
        >
          {t('pagination.last')}
        </Button>
      </HStack>
    </VStack>
  );
};

export default Pagination;