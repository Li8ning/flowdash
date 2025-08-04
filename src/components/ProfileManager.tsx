'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

const ProfileManager = () => {
  const { user, updateUser, organizationName, setOrganizationName } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (organizationName) {
      setOrgName(organizationName);
    }
  }, [organizationName]);

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.organization_id) {
      toast({
        title: t('profile_manager.toast.auth_error'),
        description: t('profile_manager.toast.auth_error_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await api.put(`/organizations/${user.organization_id}`, { name: orgName });
      setOrganizationName(response.data.name);
      toast({
        title: t('profile_manager.toast.org_updated'),
        description: t('profile_manager.toast.org_updated_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t('profile_manager.toast.update_failed'),
        description: (err as any).response?.data?.error || t('profile_manager.toast.update_failed_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateDetails = async () => {
    try {
      const payload = { name, username };
      const { data } = await api.put(`/users/${user?.id}`, payload);
      updateUser(data);
      toast({
        title: t('profile_manager.toast.details_updated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      toast({
        title: t('profile_manager.toast.error_updating_details'),
        description: err.response?.data?.error || t('profile_manager.toast.error_updating_details_description'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast({
        title: t('profile_manager.toast.passwords_no_match'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!password) {
        toast({
            title: t('profile_manager.toast.password_empty'),
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
        title: t('profile_manager.toast.password_updated'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: t('profile_manager.toast.error_updating_password'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Stack spacing={8} p={{ base: 2, md: 8 }} maxW="2xl" mx="auto">
      <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
        <Heading size={{ base: 'sm', md: 'lg' }} mb={6}>{t('profile_manager.user_details.title')}</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>{t('profile_manager.user_details.username')}</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>{t('profile_manager.user_details.full_name')}</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <Button colorScheme="teal" onClick={handleUpdateDetails} alignSelf="flex-start">
            {t('profile_manager.user_details.update_button')}
          </Button>
        </Stack>
      </Box>

      {user?.role === 'factory_admin' && (
        <Box
          as="form"
          onSubmit={handleUpdateOrganization}
          p={6}
          borderWidth="1px"
          borderRadius="lg"
          shadow="md"
        >
          <Heading size={{ base: 'sm', md: 'lg' }} mb={4}>
            {t('profile_manager.organization_settings.title')}
          </Heading>
          <Divider mb={6} />
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{t('profile_manager.organization_settings.name')}</FormLabel>
              <Input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('profile_manager.organization_settings.name_placeholder')}
              />
            </FormControl>
            <Flex justify="flex-end">
              <Button type="submit" colorScheme="blue">
                {t('profile_manager.organization_settings.update_button')}
              </Button>
            </Flex>
          </Stack>
        </Box>
      )}

      <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md">
        <Heading size={{ base: 'sm', md: 'lg' }} mb={6}>{t('profile_manager.change_password.title')}</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>{t('profile_manager.change_password.new_password')}</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('profile_manager.change_password.confirm_new_password')}</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>
          <Button colorScheme="teal" onClick={handleUpdatePassword} alignSelf="flex-start">
            {t('profile_manager.change_password.update_button')}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ProfileManager;