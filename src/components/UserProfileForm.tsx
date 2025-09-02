import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
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
import api from '@/lib/api';
import { User } from '@/types';
import { useTranslation } from 'react-i18next';

interface UserProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (user: Partial<User>) => void;
}

const UserProfileForm = ({ isOpen, onClose, user, onUserUpdate }: UserProfileFormProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setValidationErrors({}); // Clear validation errors when user changes
    }
  }, [user]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    // Clear previous validation errors
    setValidationErrors({});

    // Client-side validation
    const errors: {[key: string]: string} = {};

    if (newUsername.trim()) {
      // Length validation
      if (newUsername.length < 3) {
        errors.username = t('validation.min_length', { field: t('user_manager.table.username'), count: 3 });
      } else if (newUsername.length > 20) {
        errors.username = t('validation.max_length', { field: t('user_manager.table.username'), count: 20 });
      }
      // Character validation
      else if (!/^[a-zA-Z0-9._-]+$/.test(newUsername)) {
        errors.username = t('validation.invalid_format', { field: t('user_manager.table.username') });
      }
      // Format validation
      else if (/^[._-]/.test(newUsername)) {
        errors.username = t('validation.username_no_special_start', { field: t('user_manager.table.username') });
      }
      else if (/[._-]$/.test(newUsername)) {
        errors.username = t('validation.username_no_special_end', { field: t('user_manager.table.username') });
      }
      else if (/[._-]{2,}/.test(newUsername)) {
        errors.username = t('validation.username_no_consecutive_special', { field: t('user_manager.table.username') });
      }
      // Reserved words validation
      else if (['admin', 'root', 'system', 'superuser', 'administrator', 'support', 'help', 'info', 'contact', 'webmaster', 'api', 'test', 'demo', 'guest', 'user', 'null', 'undefined'].includes(newUsername.toLowerCase())) {
        errors.username = t('validation.username_reserved', { field: t('user_manager.table.username') });
      }
    }

    setValidationErrors(errors);

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

  const handleSubmit = () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: 'Please fix the validation errors.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isUsernameAvailable) {
      toast({
        title: 'Username is not available.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onUserUpdate({ id: user.id, name, username });
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
          <FormControl mt={4} isInvalid={!isUsernameAvailable || !!validationErrors.username}>
            <FormLabel>Username</FormLabel>
            <InputGroup>
              <Input
                value={username}
                onChange={handleUsernameChange}
                pr="4.5rem"
                maxLength={20}
                isInvalid={!!validationErrors.username}
              />
              {isCheckingUsername && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
            {validationErrors.username && (
              <FormErrorMessage>{validationErrors.username}</FormErrorMessage>
            )}
            {!validationErrors.username && !isCheckingUsername && !isDirty && username !== user.username && (
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
            isDisabled={isDirty || isCheckingUsername || !isUsernameAvailable || Object.keys(validationErrors).length > 0}
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