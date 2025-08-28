'use client';

import React from 'react';
import { Box, Drawer, DrawerContent, useDisclosure } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { NavigationLink } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  navLinks: NavigationLink[];
}

const MainLayout = ({ children, navLinks }: MainLayoutProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box>
      {/* Desktop Sidebar */}
      <Box
        pos="fixed"
        top="0"
        left="0"
        zIndex="sticky"
        h="full"
        w="64"
        display={{ base: 'none', lg: 'block' }}
      >
        <Sidebar navLinks={navLinks} />
      </Box>
      
      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="xs">
        <DrawerContent>
          <Sidebar navLinks={navLinks} onClose={onClose} />
        </DrawerContent>
      </Drawer>

      <Box ml={{ base: 0, lg: 64 }} p={{ base: 4, md: 6 }}>
        <Header onOpen={onOpen} />
        <Box as="main">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;