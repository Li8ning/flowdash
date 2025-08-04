import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { AxiosError } from 'axios';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  is_active: boolean | null;
}

interface UserProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (user: User) => void;
}

const UserProfileForm = ({ isOpen, onClose, user, onUserUpdate }: UserProfileFormProps) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
    }
  }, [user]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (newUsername !== user.username) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (username && username !== user.username) {
        setIsCheckingUsername(true);
        try {
          const response = await api.get(`/users/check-username?username=${username}&excludeId=${user.id}`);
          setIsUsernameAvailable(response.data.isAvailable);
        } catch (error) {
          console.error('Error checking username:', error);
          setIsUsernameAvailable(true);
        } finally {
          setIsCheckingUsername(false);
          setIsDirty(false);
        }
      } else {
        setIsUsernameAvailable(true);
        setIsDirty(false);
      }
    }, 1000); // Increased debounce delay to 1 second

    return () => {
      clearTimeout(handler);
    };
  }, [username, user.username, user.id]);

  const handleSubmit = async () => {
    if (!isUsernameAvailable) {
      toast({
        title: 'Username is not available.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await api.put(`/users/${user.id}`, { name, username });
      onUserUpdate(response.data);
      toast({
        title: 'User updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      const axiosError = error as AxiosError<{ error: string }>;
      toast({
        title: 'Error updating user.',
        description: axiosError.response?.data?.error || 'An unexpected error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent bg="brand.surface" mx={{ base: 4, md: 0 }}>
        <ModalHeader>Edit User Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <FormControl mt={4} isInvalid={!isUsernameAvailable}>
            <FormLabel>Username</FormLabel>
            <InputGroup>
              <Input value={username} onChange={handleUsernameChange} pr="4.5rem" />
              {isCheckingUsername && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
            {!isCheckingUsername && !isDirty && username !== user.username && (
              isUsernameAvailable ? (
                <Text color="green.500" fontSize="sm" mt={1}>Username is available.</Text>
              ) : (
                <Text color="red.500" fontSize="sm" mt={1}>Username is already taken.</Text>
              )
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="green"
            mr={3}
            onClick={handleSubmit}
            isDisabled={isDirty || isCheckingUsername || !isUsernameAvailable}
          >
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserProfileForm;