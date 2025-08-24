import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { useToast } from '@chakra-ui/react';

interface CrudState<T> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface UseCrudOptions<T> {
  initialData?: T[];
  endpoint: string;
  idKey?: keyof T;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  initialFetch?: boolean;
}

export function useCrud<T>({
  initialData = [],
  endpoint,
  idKey = 'id' as keyof T,
  onSuccess,
  onError,
  initialFetch = true,
}: UseCrudOptions<T>) {
  const [state, setState] = useState<CrudState<T>>({
    data: initialData,
    total: 0,
    loading: false,
    error: null,
  });
  const toast = useToast();

  const defaultOnSuccess = useCallback((message: string) => {
    toast({
      title: 'Success',
      description: message,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  const defaultOnError = useCallback((message: string) => {
    toast({
      title: 'Error',
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  const handleSuccess = onSuccess || defaultOnSuccess;
  const handleError = onError || defaultOnError;

  const fetchData = useCallback(async (page?: number, filters?: Record<string, unknown>, limit?: number) => {
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      const params: Record<string, unknown> = { ...filters };
      if (page) {
        params.page = page;
        if (page === 1) {
          params.getTotal = true;
        }
      }
      if (limit) {
        params.limit = limit;
      }
      const response = await api.get(endpoint, { params });
      setState(prevState => {
        const dataContainer = response.data;
        let responseData;

        if (dataContainer && Array.isArray(dataContainer.data)) {
          responseData = dataContainer.data;
        } else if (Array.isArray(dataContainer)) {
          responseData = dataContainer;
        } else {
          responseData = dataContainer ? dataContainer.data : undefined;
        }
        
        const newData = Array.isArray(responseData) ? responseData : (responseData ? [responseData] : []);
        
        return {
          ...prevState,
          data: page && page > 1 ? [...prevState.data, ...newData] : newData,
          total: response.data.totalCount !== undefined ? response.data.totalCount : prevState.total,
          loading: false,
          error: null,
        };
      });
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to fetch data.';
      setState({ data: [], total: 0, loading: false, error: errorMessage });
      handleError(errorMessage);
    }
  }, [endpoint, handleError]);

  const createItem = async (item: Omit<T, 'id'> & { password?: string }) => {
    try {
      const response = await api.post<T>(endpoint, item);
      await fetchData(1); // Refetch the first page
      handleSuccess('Item created successfully.');
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to create item.';
      handleError(errorMessage);
      throw error;
    }
  };

  const updateItem = async (id: number | string, item: Partial<T>) => {
    try {
      const response = await api.patch<T>(`${endpoint}/${id}`, item);
      setState(prevState => ({
        ...prevState,
        data: prevState.data.map(d => (d[idKey] === id ? response.data : d)),
      }));
      handleSuccess('Item updated successfully.');
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to update item.';
      handleError(errorMessage);
      throw error;
    }
  };

  const deleteItem = async (id: number | string) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      setState(prevState => ({
        ...prevState,
        data: prevState.data.filter(d => d[idKey] !== id),
      }));
      handleSuccess('Item deleted successfully.');
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to delete item.';
      handleError(errorMessage);
      throw error;
    }
  };

  const archiveItem = async (id: number | string) => {
    try {
      await api.patch(`${endpoint}/${id}`, { is_archived: true });
      // Refetch data to reflect the archived status
      fetchData(1);
      handleSuccess('Item archived successfully.');
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to archive item.';
      handleError(errorMessage);
      throw error;
    }
  };

  const reactivateItem = async (id: number | string) => {
    try {
      await api.put(`${endpoint}/${id}/reactivate`);
      fetchData(1); // Refetch data to reflect the reactivated status
      handleSuccess('Item reactivated successfully.');
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as { error: string })?.error || 'Failed to reactivate item.';
      handleError(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [endpoint, initialFetch, fetchData]);

  return { ...state, fetchData, createItem, updateItem, deleteItem, archiveItem, reactivateItem };
}