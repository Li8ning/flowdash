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
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

const Login = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast({
        title: t('login.success.title'),
        description: t('login.success.description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: t('login.error.title'),
        description: err.response?.data?.msg || t('login.error.description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
            onChange={(e) => changeLanguage(e.target.value)}
            value={language}
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
        <Button type="submit" colorScheme="blue" width="full">
          {t('login.button')}
        </Button>
        <Text>
          {t('login.no_account')}{' '}
          <Link as={NextLink} href="/register" color="blue.500">
            {t('login.signup_link')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;