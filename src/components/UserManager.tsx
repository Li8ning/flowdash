'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  IconButton,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
  Text,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { DeleteIcon, SearchIcon, RepeatIcon, EditIcon } from '@chakra-ui/icons';
import UserProfileForm from '@/components/UserProfileForm';
import { useTranslation } from 'react-i18next';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  is_active: boolean | null;
}

const UserManager: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('floor_staff');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [alertAction, setAlertAction] = useState<{ type: 'remove' | 'reactivate'; userId: number } | null>(null);
  const cancelRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
      });
      const { data } = await api.get(`/users?${params.toString()}`);
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("API did not return an array for users:", data);
        setUsers([]);
      }
    } catch (err) {
      toast({
        title: t('user_manager.toast.error_fetching_users'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('user_manager.toast.error_fetching_users_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  }, [toast, statusFilter, searchQuery, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { username: newUsername, name: newName, password: newPassword, role: newRole });
      toast({
        title: t('user_manager.toast.user_invited'),
        description: t('user_manager.toast.user_invited_description', { username: newUsername }),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      onClose();
      fetchUsers();
    } catch (err) {
      toast({
        title: t('user_manager.toast.invitation_failed'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('user_manager.toast.invitation_failed_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    try {
      await api.delete(`/users/${userId}`);
      toast({
        title: t('user_manager.toast.user_removed'),
        description: t('user_manager.toast.user_removed_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchUsers();
    } catch (err) {
      toast({
        title: t('user_manager.toast.error_removing_user'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('user_manager.toast.error_removing_user_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  const handleReactivateUser = async (userId: number) => {
    try {
      await api.put(`/users/${userId}/reactivate`);
      toast({
        title: t('user_manager.toast.user_reactivated'),
        description: t('user_manager.toast.user_reactivated_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchUsers();
    } catch (err) {
      toast({
        title: t('user_manager.toast.error_reactivating_user'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('user_manager.toast.error_reactivating_user_description'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  const openAlert = (type: 'remove' | 'reactivate', userId: number) => {
    setAlertAction({ type, userId });
    onAlertOpen();
  };

  const confirmAction = () => {
    if (!alertAction) return;
    if (alertAction.type === 'remove') {
      handleRemoveUser(alertAction.userId);
    } else if (alertAction.type === 'reactivate') {
      handleReactivateUser(alertAction.userId);
    }
    onAlertClose();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onEditOpen();
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
  };

  const filteredUsers = users.filter(user => user.id !== currentUser?.id);

  return (
    <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder">
      {selectedUser && (
        <UserProfileForm
          isOpen={isEditOpen}
          onClose={onEditClose}
          user={selectedUser}
          onUserUpdate={handleUserUpdate}
        />
      )}
      <Flex justify="space-between" align="center" mb={6} direction={{ base: 'column', md: 'row' }}>
        <Heading as="h2" size={{ base: 'sm', md: 'lg' }} mb={{ base: 4, md: 0 }}>{t('user_manager.title')}</Heading>
        {currentUser?.role === 'factory_admin' && (
          <Button onClick={onOpen} colorScheme="blue">{t('user_manager.invite_new_user')}</Button>
        )}
      </Flex>
      <Divider mb={6} />

      <Flex mb={4} direction={['column', 'row']} gap={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder={t('user_manager.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t('user_manager.status_filter.all')}</option>
          <option value="active">{t('user_manager.status_filter.active')}</option>
          <option value="inactive">{t('user_manager.status_filter.inactive')}</option>
        </Select>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleInviteUser}>
          <ModalHeader>{t('user_manager.invite_modal.title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>{t('user_manager.invite_modal.username')}</FormLabel>
                <Input
                  type="text"
                  placeholder={t('user_manager.invite_modal.username_placeholder')}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
               <FormLabel>{t('user_manager.invite_modal.full_name')}</FormLabel>
               <Input
                 type="text"
                 placeholder={t('user_manager.invite_modal.full_name_placeholder')}
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
               />
             </FormControl>
             <FormControl isRequired>
               <FormLabel>{t('user_manager.invite_modal.password')}</FormLabel>
               <Input
                 type="password"
                 placeholder={t('user_manager.invite_modal.password_placeholder')}
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
               />
             </FormControl>
              <FormControl isRequired>
                <FormLabel>{t('user_manager.invite_modal.role')}</FormLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="floor_staff">{t('user_manager.invite_modal.role.floor_staff')}</option>
                  <option value="factory_admin">{t('user_manager.invite_modal.role.factory_admin')}</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" colorScheme="green" mr={3}>
              {t('user_manager.invite_modal.invite_button')}
            </Button>
            <Button variant="ghost" onClick={onClose}>{t('user_manager.invite_modal.cancel_button')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box overflowX="auto">
        <TableContainer>
          <Table variant="simple" colorScheme="teal" sx={{
            '@media (max-width: 768px)': {
              thead: {
                display: 'none',
              },
              tr: {
                display: 'block',
                marginBottom: '1rem',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: 'md',
                padding: '1rem',
              },
              td: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'gray.200',
                padding: '0.75rem 0',
                '&:last-child': {
                  borderBottom: 'none',
                },
                '&::before': {
                  content: 'attr(data-label)',
                  fontWeight: 'bold',
                  marginRight: '1rem',
                },
              },
            },
          }}>
            <Thead bg="brand.background">
              <Tr>
                <Th>{t('user_manager.table.name')}</Th>
                <Th>{t('user_manager.table.username')}</Th>
                <Th>{t('user_manager.table.role')}</Th>
                <Th>{t('user_manager.table.status')}</Th>
                {currentUser?.role === 'factory_admin' && <Th>{t('user_manager.table.actions')}</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id}
                    sx={{
                        '@media (min-width: 769px)': {
                            '&:hover': {
                                backgroundColor: 'gray.50',
                                cursor: 'pointer'
                            }
                        }
                    }}
                >
                  <Td data-label={t('user_manager.table.name')}><Text noOfLines={1}>{user.name}</Text></Td>
                  <Td data-label={t('user_manager.table.username')}><Text noOfLines={1}>{user.username}</Text></Td>
                  <Td data-label={t('user_manager.table.role')}><Text noOfLines={1}>{user.role}</Text></Td>
                  <Td data-label={t('user_manager.table.status')}>
                    <Text color={user.is_active !== false ? 'green.500' : 'red.500'}>
                      {user.is_active !== false ? t('user_manager.status.active') : t('user_manager.status.inactive')}
                    </Text>
                  </Td>
                  {currentUser?.role === 'factory_admin' && (
                    <Td data-label={t('user_manager.table.actions')}>
                      <Flex gap={2}>
                        <IconButton
                          aria-label={t('user_manager.actions.edit')}
                          icon={<EditIcon />}
                          colorScheme="blue"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        />
                        {user.is_active !== false ? (
                          <IconButton
                            aria-label={t('user_manager.actions.deactivate')}
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            size="sm"
                            onClick={() => openAlert('remove', user.id)}
                          />
                        ) : (
                          <IconButton
                            aria-label={t('user_manager.actions.reactivate')}
                            icon={<RepeatIcon />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => openAlert('reactivate', user.id)}
                          />
                        )}
                      </Flex>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {alertAction?.type === 'remove' ? t('user_manager.alert.deactivate.title') : t('user_manager.alert.reactivate.title')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {t('user_manager.alert.body', { action: alertAction?.type === 'remove' ? t('user_manager.alert.action.deactivate') : t('user_manager.alert.action.reactivate') })}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                {t('user_manager.alert.cancel_button')}
              </Button>
              <Button
                colorScheme={alertAction?.type === 'remove' ? 'red' : 'green'}
                onClick={confirmAction}
                ml={3}
              >
                {alertAction?.type === 'remove' ? t('user_manager.alert.deactivate_button') : t('user_manager.alert.reactivate_button')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UserManager;