'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
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
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon, SearchIcon, RepeatIcon, EditIcon } from '@chakra-ui/icons';
import UserProfileForm from '@/components/UserProfileForm';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { useCrud } from '@/hooks/useCrud';
import { User, Role } from '@/types';

const UserManager: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('floor_staff');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [alertAction, setAlertAction] = useState<{ type: 'remove' | 'reactivate'; userId: number } | null>(null);
  const cancelRef = useRef(null);

  const {
    data: users,
    loading: isLoading,
    fetchData,
    createItem,
    deleteItem,
    updateItem,
    reactivateItem,
  } = useCrud<User>({
    endpoint: '/users',
  });

  useEffect(() => {
    const filters = {
      status: statusFilter,
      search: debouncedSearchQuery,
    };
    fetchData(undefined, filters);
  }, [fetchData, statusFilter, debouncedSearchQuery]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUser?.organization_id) {
        await createItem({
          username: newUsername,
          name: newName,
          role: newRole as Role,
          password: newPassword,
          organization_id: currentUser.organization_id,
          is_active: true,
        });
      }
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      onClose();
    } catch {
      // Error is handled by the hook
    }
  };

  const openAlert = (type: 'remove' | 'reactivate', userId: number) => {
    setAlertAction({ type, userId });
    onAlertOpen();
  };

  const confirmAction = () => {
    if (!alertAction) return;
    if (alertAction.type === 'remove') {
      deleteItem(alertAction.userId);
    } else if (alertAction.type === 'reactivate') {
      reactivateItem(alertAction.userId);
    }
    onAlertClose();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    onEditOpen();
  };

  const handleUserUpdate = (updatedUser: Partial<User>) => {
    if (updatedUser.id) {
      updateItem(updatedUser.id, updatedUser);
    }
    onEditClose();
  };

  const filteredUsers = users.filter(user => {
    if (user.id === currentUser?.id) return false; // Exclude self
    if (currentUser?.role === 'admin' && user.role === 'super_admin') return false; // Admins cannot see super_admins
    return true;
  });
 
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
        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
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
                  {currentUser?.role === 'super_admin' && <option value="admin">{t('user_manager.invite_modal.role.admin')}</option>}
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && <option value="floor_staff">{t('user_manager.invite_modal.role.floor_staff')}</option>}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" colorScheme="green" mr={3} isLoading={isLoading}>
              {t('user_manager.invite_modal.invite_button')}
            </Button>
            <Button variant="ghost" onClick={onClose}>{t('user_manager.invite_modal.cancel_button')}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box overflowX="auto">
        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
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
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && <Th>{t('user_manager.table.actions')}</Th>}
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
                    {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
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
        )}
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