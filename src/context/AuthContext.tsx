'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';

// Define the shape of the user object and the context
interface User {
  id: number;
  username: string;
  name: string;
  role: 'factory_admin' | 'floor_staff';
  organization_id: number;
  organization_name?: string;
  is_active: boolean;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<User>;
  logout: () => void;
  loading: boolean;
  handleAuthentication: (data: { user: User; token: string }, rememberMe: boolean) => Promise<User>;
  updateUser: (user: Partial<User>) => void;
  organizationName: string | null;
  setOrganizationName: (name: string) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      setToken(storedToken);

      if (storedToken) {
        try {
          const { data: userData } = await api.get('/auth/me');
          const finalUserData = { ...userData };
          if (finalUserData.organization_id && !finalUserData.organization_name) {
            try {
              const { data: orgData } = await api.get(`/organizations/${finalUserData.organization_id}`);
              finalUserData.organization_name = orgData.name;
              setOrganizationName(orgData.name);
            } catch (orgErr) {
              console.error("Could not fetch organization details", orgErr);
            }
          } else if (finalUserData.organization_name) {
            setOrganizationName(finalUserData.organization_name);
          }
          if (finalUserData.language) {
            await i18n.changeLanguage(finalUserData.language);
          }
          setUser(finalUserData);
        } catch {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, i18n]);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const response = await api.post('/auth/login', { username, password, rememberMe });
      await handleAuthentication(response.data, rememberMe);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Logout failed, but clearing client-side session anyway.', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      router.push('/');
    }
  };

  const handleAuthentication = async (data: { user: User; token: string }, rememberMe: boolean) => {
    const { user: userData, token: newToken } = data;

    if (rememberMe) {
      localStorage.setItem('token', newToken);
    } else {
      sessionStorage.setItem('token', newToken);
    }
    setToken(newToken);

    if (userData.language) {
      await i18n.changeLanguage(userData.language);
    }
    setUser(userData);
    return userData;
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (updatedData.language) {
      i18n.changeLanguage(updatedData.language);
    }
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updatedData };
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, handleAuthentication, updateUser, organizationName, setOrganizationName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Create a custom hook for easy access to the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}