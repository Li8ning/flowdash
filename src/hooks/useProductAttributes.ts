import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ProductAttribute, GroupedAttributes } from '@/types';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function useProductAttributes() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const [attributes, setAttributes] = useState<GroupedAttributes>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (!user?.organization_id || user?.role === 'floor_staff') {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get<ProductAttribute[]>('/settings/attributes', {
          params: { organization_id: user.organization_id },
        });
        const grouped = data.reduce((acc, attr) => {
          const { type } = attr;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(attr);
          return acc;
        }, {} as GroupedAttributes);
        setAttributes(grouped);
      } catch (err) {
        console.error('Failed to fetch attributes', err);
        toast({
          title: t('product_manager.toast.error_loading_attributes'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [user?.organization_id, user?.role, toast, t]);

  return { attributes, loading };
}