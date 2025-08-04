'use client';

import React, { useState } from 'react';
import api from '../lib/api';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';

interface InventoryLog {
  id: number;
  product_name: string;
  color: string;
  model: string;
  quantity_change: number;
  created_at: string;
}

interface EditLogModalProps {
  log: InventoryLog;
  onClose: () => void;
  onUpdate: (updatedLog: InventoryLog) => void;
}

const EditLogModal: React.FC<EditLogModalProps> = ({ log, onClose, onUpdate }) => {
  const [quantityChange, setQuantityChange] = useState(log.quantity_change);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: updatedLog } = await api.put(`/inventory/log/${log.id}`, {
        quantity_change: quantityChange,
      });
      onUpdate(updatedLog);
      onClose();
      toast({
        title: 'Log updated.',
        description: 'The inventory log has been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error updating log.',
        description: 'Failed to update the inventory log.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error(err);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Inventory Log</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormControl>
              <FormLabel>Quantity Change</FormLabel>
              <Input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(Number(e.target.value))}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit">
              Update
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditLogModal;