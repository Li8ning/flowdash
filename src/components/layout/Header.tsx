'use client';

import React from 'react';
import { Box, Flex, Heading, Text, Button, IconButton } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiMenu } from 'react-icons/fi';

interface HeaderProps {
  onOpen?: () => void;
}

const Header = ({ onOpen }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <Box
      as="header"
      bg="brand.surface"
      p={{ base: 4, md: 6 }}
      borderRadius="xl"
      shadow="md"
      borderWidth="1px"
      borderColor="brand.lightBorder"
      mb={8}
    >
      <Flex justify="space-between" align="center">
        {/* Left: Hamburger Menu */}
        <IconButton
          aria-label="Open Menu"
          icon={<FiMenu />}
          size="lg"
          variant="outline"
          onClick={onOpen}
          display={{ base: 'flex', lg: 'none' }}
        />

        {/* Center: Welcome Text */}
        <Box flex="1" mx={{ base: 2, lg: 4 }}>
          <Heading size={{ base: 'sm', md: 'lg' }} textAlign={{ base: 'center', lg: 'left' }}>
            {t('dashboard.welcome')}, {user?.name || 'User'}
          </Heading>
          <Text color="brand.textSecondary" fontSize={{ base: 'xs', md: 'md' }} textAlign={{ base: 'center', lg: 'left' }}>
            {user?.organization_name}
          </Text>
        </Box>

        {/* Right: Logout Button */}
        <Button colorScheme="red" onClick={logout} size={{ base: 'sm', md: 'md' }}>
          {t('dashboard.logout')}
        </Button>
      </Flex>
    </Box>
  );
};

export default Header;