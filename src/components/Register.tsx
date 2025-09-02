'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
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
    setValidationErrors({}); // Clear previous validation errors

    // Client-side validation
    const errors: {[key: string]: string} = {};
    if (!organizationName.trim()) {
      errors.organizationName = t('validation.required', { field: t('register.org_name') });
    }
    if (!name.trim()) {
      errors.name = t('validation.required', { field: t('register.full_name') });
    }
    if (!username.trim()) {
      errors.username = t('validation.required', { field: t('register.admin_username') });
    } else {
      // Length validation
      if (username.length < 3) {
        errors.username = t('validation.min_length', { field: t('register.admin_username'), count: 3 });
      } else if (username.length > 20) {
        errors.username = t('validation.max_length', { field: t('register.admin_username'), count: 20 });
      }
      // Character validation
      else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        errors.username = t('validation.invalid_format', { field: t('register.admin_username') });
      }
      // Format validation
      else if (/^[._-]/.test(username)) {
        errors.username = t('validation.username_no_special_start', { field: t('register.admin_username') });
      }
      else if (/[._-]$/.test(username)) {
        errors.username = t('validation.username_no_special_end', { field: t('register.admin_username') });
      }
      else if (/[._-]{2,}/.test(username)) {
        errors.username = t('validation.username_no_consecutive_special', { field: t('register.admin_username') });
      }
      // Reserved words validation
      else if (['admin', 'root', 'system', 'superuser', 'administrator', 'support', 'help', 'info', 'contact', 'webmaster', 'api', 'test', 'demo', 'guest', 'user', 'null', 'undefined'].includes(username.toLowerCase())) {
        errors.username = t('validation.username_reserved', { field: t('register.admin_username') });
      }
    }
    if (!password.trim()) {
      errors.password = t('validation.required', { field: t('register.password') });
    } else if (password.length < 8) {
      errors.password = t('validation.min_length', { field: t('register.password'), count: 8 });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

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
      setValidationErrors({}); // Clear validation errors on success
      toast({
        title: t('register.toast.success_title'),
        description: t('register.toast.success_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/dashboard'); // Redirect to dashboard
    } catch (err) {
      const error = err as AxiosError<{ error: string; errors?: {[key: string]: string[]} }>;
      const errorData = error.response?.data;

      // Handle field-specific validation errors from server
      if (errorData?.errors) {
        const fieldErrors: {[key: string]: string} = {};
        Object.entries(errorData.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            fieldErrors[field] = messages[0]; // Take first error message
          }
        });
        setValidationErrors(fieldErrors);
      } else {
        setError(t('register.error.generic'));
      }
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
          <FormControl id="organizationName" isRequired isInvalid={!!validationErrors.organizationName}>
            <FormLabel>{t('register.org_name')}</FormLabel>
            <Input
              type="text"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
                if (validationErrors.organizationName) {
                  setValidationErrors(prev => ({ ...prev, organizationName: '' }));
                }
              }}
            />
            {validationErrors.organizationName && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.organizationName}
              </Text>
            )}
          </FormControl>
          <FormControl id="name" mt={4} isRequired isInvalid={!!validationErrors.name}>
            <FormLabel>{t('register.full_name')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationErrors.name) {
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
            />
            {validationErrors.name && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.name}
              </Text>
            )}
          </FormControl>
          <FormControl id="username" mt={4} isRequired isInvalid={!!validationErrors.username}>
            <FormLabel>{t('register.admin_username')}</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (validationErrors.username) {
                  setValidationErrors(prev => ({ ...prev, username: '' }));
                }
              }}
              minLength={3}
              maxLength={20}
            />
            {validationErrors.username && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.username}
              </Text>
            )}
          </FormControl>
          <FormControl id="password" mt={4} isRequired isInvalid={!!validationErrors.password}>
            <FormLabel>{t('register.password')}</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              minLength={8}
            />
            {validationErrors.password && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.password}
              </Text>
            )}
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