'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { NavigationLink } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  navLinks: NavigationLink[];
}

const MainLayout = ({ children, navLinks }: MainLayoutProps) => {
  return (
    <Box>
      <Sidebar navLinks={navLinks} />
      <Box ml="64" p={{ base: 2, md: 6 }}>
        <Header />
        <Box as="main">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;