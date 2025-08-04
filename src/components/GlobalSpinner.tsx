'use client';

import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { Box, Spinner, Modal, ModalOverlay, ModalContent, Flex } from '@chakra-ui/react';

const GlobalSpinner = () => {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <Modal isOpen={isLoading} onClose={() => {}} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent bg="transparent" shadow="none" display="flex" justifyContent="center" alignItems="center">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </ModalContent>
    </Modal>
  );
};

export default GlobalSpinner;