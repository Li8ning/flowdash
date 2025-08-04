'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Heading,
  Flex,
  Divider,
} from '@chakra-ui/react';

const OrganizationManager = () => {
  const { user, organizationName, setOrganizationName } = useAuth();
  const [name, setName] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (organizationName) {
      setName(organizationName);
    }
  }, [organizationName]);

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.organization_id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to update the organization.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await api.put(`/organizations/${user.organization_id}`, { name });
      setOrganizationName(response.data.name);
      toast({
        title: 'Organization Updated',
        description: 'The organization name has been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description: (err as any).response?.data?.error || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (user?.role !== 'factory_admin') {
    return null;
  }

  return (
    <Box
      as="form"
      onSubmit={handleUpdateOrganization}
      bg="brand.surface"
      p={{ base: 4, md: 6 }}
      borderRadius="xl"
      shadow="md"
      borderWidth="1px"
      borderColor="brand.lightBorder"
    >
      <Heading as="h2" size={{ base: 'sm', md: 'lg' }} mb={4}>
        Organization Settings
      </Heading>
      <Divider mb={6} />
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Organization Name</FormLabel>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter organization name"
          />
        </FormControl>
        <Flex justify="flex-end">
          <Button type="submit" colorScheme="blue">
            Update Name
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default OrganizationManager;