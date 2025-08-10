'use client';

import React from 'react';
import { Box, Flex, Heading, Text, Button, HStack } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
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
        <Box>
          <Heading size={{ base: 'md', md: 'lg' }}>{t('dashboard.welcome')}, {user?.name || 'User'}</Heading>
          <Text color="brand.textSecondary" fontSize={{ base: 'sm', md: 'md' }}>{user?.organization_name}</Text>
        </Box>
        <HStack>
          <Button colorScheme="red" onClick={logout}>{t('dashboard.logout')}</Button>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;