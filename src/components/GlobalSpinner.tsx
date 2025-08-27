'use client';

import { Box, Spinner } from '@chakra-ui/react';

interface GlobalSpinnerProps {
  isVisible?: boolean;
}

const GlobalSpinner = ({ isVisible = true }: GlobalSpinnerProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bg="rgba(255, 255, 255, 0.8)"
      zIndex="9999"
    >
      <Spinner size="xl" />
    </Box>
  );
};

export default GlobalSpinner;