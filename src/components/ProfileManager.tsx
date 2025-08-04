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

const ProfileManager = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const toast = useToast();

  const handleUpdateProfile = async () => {
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const payload: { name: string; password?: string } = { name };
      if (password) {
        payload.password = password;
      }

      const { data } = await api.put(`/users/${user?.id}`, payload);
      updateUser(data);
      toast({
        title: 'Profile updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: 'Error updating profile.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <Heading mb={4}>Profile Manager</Heading>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FormControl>
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
        <Button colorScheme="teal" onClick={handleUpdateProfile}>
          Update Profile
        </Button>
      </Stack>
    </Box>
  );
};

export default ProfileManager;