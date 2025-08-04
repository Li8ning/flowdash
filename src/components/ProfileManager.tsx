'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Heading,
} from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import OrganizationManager from './OrganizationManager';

const ProfileManager = () => {
  const { user, updateUser, organizationName } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const toast = useToast();

  const handleUpdateDetails = async () => {
    try {
      const payload = { name, username };
      const { data } = await api.put(`/users/${user?.id}`, payload);
      updateUser(data);
      toast({
        title: 'Details updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: 'Error updating details.',
        description: err.response?.data?.error || 'An unexpected error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!password) {
        toast({
            title: 'Password cannot be empty.',
            status: 'error',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    try {
      const payload = { password };
      await api.put(`/users/${user?.id}`, payload);
      toast({
        title: 'Password updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: 'Error updating password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Stack spacing={8} p={{ base: 2, md: 8 }} maxW="2xl" mx="auto">
      <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
        <Heading size={{ base: 'sm', md: 'lg' }} mb={6}>User Details</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Full Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <Button colorScheme="teal" onClick={handleUpdateDetails} alignSelf="flex-start">
            Update Details
          </Button>
        </Stack>
      </Box>

      {user?.role === 'factory_admin' && <OrganizationManager />}

      <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
        <Heading size={{ base: 'sm', md: 'lg' }} mb={6}>Change Password</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>New Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Confirm New Password</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>
          <Button colorScheme="teal" onClick={handleUpdatePassword} alignSelf="flex-start">
            Update Password
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ProfileManager;