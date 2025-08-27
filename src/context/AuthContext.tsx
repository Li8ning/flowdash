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
  role: 'super_admin' | 'admin' | 'floor_staff';
  organization_id: number;
  organization_name?: string;
  is_active: boolean;
  language?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<User>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: Partial<User>) => void;
  organizationName: string | null;
  setOrganizationName: (name: string) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const loadUserOnMount = async () => {
      try {
        const { data: userData } = await api.get('/auth/me');
        await processUserData(userData);
      } catch {
        // No valid session, user is not logged in
        setUser(null);
      }
      setLoading(false);
    };

    loadUserOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Redirect after a successful login
    if (!loading && user && !window.location.pathname.includes('/dashboard')) {
      const redirectUrl = `/${user.language || 'en'}/dashboard`;
      router.push(redirectUrl);
    }
  }, [user, loading, router]);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const response = await api.post('/auth/login', { username, password, rememberMe });
      // processUserData will call setUser, which will trigger the useEffect above
      const user = await processUserData(response.data.user);
      return user;
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
      router.push('/');
    }
  };

  const processUserData = async (userData: User) => {
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
    return finalUserData;
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
      value={{ user, login, logout, loading, updateUser, organizationName, setOrganizationName }}
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