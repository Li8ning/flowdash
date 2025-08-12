'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
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
  HStack,
  IconButton,
  Select,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface InventoryLog {
  id: number;
  product_id: number;
  product_name: string;
  color: string;
  design: string;
  produced: number;
  created_at: string;
  quality: string;
  packaging_type: string;
}

interface EditLogModalProps {
  log: InventoryLog;
  onClose: () => void;
  onUpdate: (updatedLog: InventoryLog) => void;
}

const EditLogModal: React.FC<EditLogModalProps> = ({ log, onClose, onUpdate }) => {
  const [produced, setProduced] = useState(log.produced);
  const [quality, setQuality] = useState(log.quality);
  const [packagingType, setPackagingType] = useState(log.packaging_type);
  const [availablePackagingTypes, setAvailablePackagingTypes] = useState<string[]>([]);
  const toast = useToast();
  const { t } = useTranslation();

  const QUALITY_OPTIONS = ['First', 'Second', 'ROK'];

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await api.get(`/products/${log.product_id}`);
        setAvailablePackagingTypes(data.available_packaging_types || []);
      } catch (error) {
        console.error("Failed to fetch product details", error);
        toast({
          title: "Error",
          description: "Could not load packaging types.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (log.product_id) {
      fetchProductDetails();
    }
  }, [log.product_id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: updatedLog } = await api.put(`/inventory/logs/${log.id}`, {
        produced: produced,
        quality: quality,
        packaging_type: packagingType,
      });
      onUpdate(updatedLog);
      onClose();
      toast({
        title: t('edit_log_modal.toast.log_updated'),
        description: t('edit_log_modal.toast.log_updated_description'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: t('edit_log_modal.toast.error_updating_log'),
        description: (err as AxiosError<{ error: string }>)?.response?.data?.error || t('edit_log_modal.toast.error_updating_log_description'),
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
        <ModalHeader>{t('edit_log_modal.title')}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>{t('edit_log_modal.quantity_change')}</FormLabel>
                <HStack>
                  <IconButton
                    aria-label="Decrease quantity"
                    icon={<MinusIcon />}
                    onClick={() => setProduced(produced - 1)}
                  />
                  <Input
                    type="number"
                    value={produced}
                    onChange={(e) => setProduced(Number(e.target.value))}
                    textAlign="center"
                  />
                  <IconButton
                    aria-label="Increase quantity"
                    icon={<AddIcon />}
                    onClick={() => setProduced(produced + 1)}
                  />
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel>{t('edit_log_modal.quality')}</FormLabel>
                <Select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  {QUALITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(`product_manager.quality.${option.toLowerCase()}`)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>{t('edit_log_modal.packaging_type')}</FormLabel>
                <Select value={packagingType} onChange={(e) => setPackagingType(e.target.value)}>
                  {availablePackagingTypes.map((option) => (
                    <option key={option} value={option}>
                      {t(`product_manager.packaging_type.${option.toLowerCase()}`)}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit">
              {t('edit_log_modal.update')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('edit_log_modal.cancel')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditLogModal;