'use client';

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  Select,
  HStack,
  Checkbox,
} from '@chakra-ui/react';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';
import NextLink from 'next/link';
import { useTranslation } from '@/app/i18n/client';
import { useRouter } from 'next/navigation';

const Login = ({ lng }: { lng: string }) => {
const { t } = useTranslation(lng, 'common');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { login } = useAuth();
  const toast = useToast();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(username, password, rememberMe);
      setRemainingAttempts(null); // Reset on successful login
      toast({
        title: t('login.success.title'),
        description: t('login.success.description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      const error = err as AxiosError<{ error: string; details?: { code: string; data?: { remaining: number; resetIn: number } } }>;
      const errorData = error.response?.data;

      let description = t('login.error.description');

      if (errorData?.details?.code) {
        const { code, data } = errorData.details;

        switch (code) {
          case 'RATE_LIMIT_EXCEEDED':
            description = t('login.error.rate_limit', {
              seconds: data?.resetIn || 60
            });
            setRemainingAttempts(0); // Account is locked
            break;
          case 'ACCOUNT_INACTIVE':
            description = t('login.error.inactive_account');
            setRemainingAttempts(null); // Don't show remaining attempts for inactive accounts
            break;
          case 'INVALID_CREDENTIALS':
            description = t('login.error.invalid_credentials');
            // Only show remaining attempts for invalid credentials (failed login attempts)
            const currentRemaining = data?.remaining ?? 10;
            setRemainingAttempts(currentRemaining > 0 ? currentRemaining : null);
            break;
          default:
            description = errorData.error || t('login.error.description');
            setRemainingAttempts(null);
        }
      } else {
        description = errorData?.error || t('login.error.description');
      }

      toast({
        title: t('login.error.title'),
        description,
        status: 'error',
        duration: 8000, // Longer duration for rate limit messages
        isClosable: true,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
    >
      <VStack
        as="form"
        onSubmit={handleSubmit}
        spacing={4}
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        w={{ base: '90%', md: '400px' }}
      >
        <HStack w="full" justifyContent="space-between">
          <Heading as="h1" size="lg">
            {t('login.title')}
          </Heading>
          <Select
            w="120px"
            onChange={(e) => router.push(`/${e.target.value}`)}
            value={lng}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
          </Select>
        </HStack>
        <FormControl id="username">
          <FormLabel>{t('login.email')}</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FormControl>
        <FormControl id="password">
          <FormLabel>{t('login.password')}</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormControl>
        <FormControl>
          <Checkbox isChecked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
            {t('login.remember_me')}
          </Checkbox>
        </FormControl>
        {remainingAttempts !== null && remainingAttempts > 0 && (
          <Text fontSize="sm" color="orange.500" textAlign="center">
            {t('login.attempts_remaining', { remaining: remainingAttempts })}
          </Text>
        )}
        <Button type="submit" width="full" isLoading={isLoggingIn} colorScheme="blue">
          {t('login.button')}
        </Button>
        <Text>
          {t('login.no_account')}{' '}
          <Link as={NextLink} href="/register" color="brand.primary">
            {t('login.signup_link')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;