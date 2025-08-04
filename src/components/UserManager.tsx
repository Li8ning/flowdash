'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@chakra-ui/react';
import { DeleteIcon, SearchIcon, RepeatIcon, EditIcon } from '@chakra-ui/icons';
import UserProfileForm from '@/components/UserProfileForm';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  is_active: boolean | null;
}

const UserManager: React.FC = () => {
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
        title: 'Error',
        description: 'Failed to fetch users.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  }, [toast, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { username: newUsername, name: newName, password: newPassword, role: newRole });
      toast({
        title: 'User Invited',
        description: `An invitation has been sent to ${newUsername}.`,
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
        title: 'Invitation Failed',
        description: 'There was an error inviting the user.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        toast({
          title: 'User Removed',
          description: 'The user has been successfully removed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to remove the user.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        console.error(err);
      }
    }
  };

  const handleReactivateUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to reactivate this user?')) {
      try {
        await api.put(`/users/${userId}/reactivate`);
        toast({
          title: 'User Reactivated',
          description: 'The user has been successfully reactivated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        fetchUsers();
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to reactivate the user.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        console.error(err);
      }
    }
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
        <Heading as="h2" size="lg" mb={{ base: 4, md: 0 }}>User Management</Heading>
        <Button onClick={onOpen} colorScheme="blue">Invite New User</Button>
      </Flex>
      <Divider mb={6} />

      <Flex mb={4} direction={['column', 'row']} gap={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="active">Active Users</option>
          <option value="inactive">Inactive Users</option>
        </Select>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleInviteUser}>
          <ModalHeader>Invite New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
               <FormLabel>Full Name</FormLabel>
               <Input
                 type="text"
                 placeholder="Enter full name"
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
               />
             </FormControl>
             <FormControl isRequired>
               <FormLabel>Password or PIN</FormLabel>
               <Input
                 type="password"
                 placeholder="Enter temporary password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
               />
             </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="floor_staff">Floor Staff</option>
                  <option value="factory_admin">Factory Admin</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" colorScheme="green" mr={3}>
              Invite User
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box overflowX="auto">
        <TableContainer>
          <Table variant="simple" colorScheme="teal">
            <Thead bg="brand.background">
              <Tr>
                <Th>Name</Th>
              <Th>Username</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user) => (
              <Tr key={user.id}>
                <Td><Text noOfLines={1}>{user.name}</Text></Td>
                <Td><Text noOfLines={1}>{user.username}</Text></Td>
                <Td><Text noOfLines={1}>{user.role}</Text></Td>
                <Td>
                  <Text color={user.is_active !== false ? 'green.500' : 'red.500'}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </Text>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit user"
                      icon={<EditIcon />}
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    />
                    {user.is_active !== false ? (
                      <IconButton
                        aria-label="Deactivate user"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                      />
                    ) : (
                      <IconButton
                        aria-label="Reactivate user"
                        icon={<RepeatIcon />}
                        colorScheme="green"
                        size="sm"
                        onClick={() => handleReactivateUser(user.id)}
                      />
                    )}
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default UserManager;