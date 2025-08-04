'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useToast,
  Box,
  Button,
  Input,
  Heading,
  Flex,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { handleAuthentication } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', {
        username,
        password,
        organizationName,
        name,
      });
      await handleAuthentication(response.data);
      toast({
        title: 'Account created.',
        description:
          "We've created your account for you. Redirecting to admin dashboard.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/admin'); // Redirect to admin dashboard
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error(err);
    }
  };

  return (
    <Flex minHeight="100vh" width="full" align="center" justifyContent="center" bg="brand.background">
      <Box
        bg="brand.surface"
        borderWidth={1}
        borderColor="brand.lightBorder"
        px={8}
        py={10}
        borderRadius="xl"
        boxShadow="xl"
        width="full"
        maxWidth="450px"
      >
        <Box textAlign="center" mb={8}>
          <Heading>Admin Registration</Heading>
        </Box>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <FormControl id="organizationName" isRequired>
            <FormLabel>Organization Name</FormLabel>
            <Input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </FormControl>
          <FormControl id="name" mt={4} isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          <FormControl id="username" mt={4} isRequired>
            <FormLabel>Admin Username</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl id="password" mt={4} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button
            width="full"
            mt={8}
            type="submit"
          >
            Register
          </Button>
        </form>
        <Box mt={6} textAlign="center">
          <Text>
            Already have an account?{' '}
            <Link href="/">
              <Text as="span" color="brand.accent" fontWeight="bold">
                Login
              </Text>
            </Link>
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}