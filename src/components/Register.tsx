'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
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
  Select,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const toast = useToast();

  const handleLanguageChange = (newLanguage: string) => {
    const newPath = pathname.replace(/\/[a-z]{2}(\/|$)/, `/${newLanguage}$1`);
    i18n.changeLanguage(newLanguage);
    router.push(newPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', {
        username,
        password,
        organizationName,
        name,
        language: i18n.language,
      });
      // Log the user in after successful registration
      await login(username, password, true);
      toast({
        title: t('register.toast.success_title'),
        description: t('register.toast.success_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/dashboard'); // Redirect to dashboard
    } catch (err) {
      setError(t('register.error.generic'));
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
        <HStack w="full" justifyContent="space-between" mb={8}>
          <Heading>{t('register.title')}</Heading>
          <Select
            w="120px"
            onChange={(e) => handleLanguageChange(e.target.value)}
            value={i18n.language}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
          </Select>
        </HStack>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          <FormControl id="organizationName" isRequired>
            <FormLabel>{t('register.org_name')}</FormLabel>
            <Input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </FormControl>
          <FormControl id="name" mt={4} isRequired>
            <FormLabel>{t('register.full_name')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          <FormControl id="username" mt={4} isRequired>
            <FormLabel>{t('register.admin_username')}</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl id="password" mt={4} isRequired>
            <FormLabel>{t('register.password')}</FormLabel>
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
            {t('register.button')}
          </Button>
        </form>
        <Box mt={6} textAlign="center">
          <Text>
            {t('register.already_have_account')}{' '}
            <Link href="/">
              <Text as="span" color="brand.accent" fontWeight="bold">
                {t('register.login_link')}
              </Text>
            </Link>
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}