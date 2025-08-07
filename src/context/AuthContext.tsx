'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
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
  login: (username: string, password:string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  handleAuthentication: (data: { user: User; token: string }) => Promise<User>;
  updateUser: (user: Partial<User>) => void;
  organizationName: string | null;
  setOrganizationName: (name: string) => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    Cookies.get('token') || null
  );
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data: userData } = await api.get('/auth/me');
          const finalUserData = { ...userData };
          if (finalUserData.organization_id && !finalUserData.organization_name) {
            try {
              // Fetch organization name if it's not included in the 'me' response
             const { data: orgData } = await api.get(`/organizations/${finalUserData.organization_id}`);
             finalUserData.organization_name = orgData.name;
             setOrganizationName(orgData.name);
           } catch (orgErr) {
             console.error("Could not fetch organization details", orgErr);
             // Proceed without organization name if it fails, so the app doesn't crash
           }
         } else if (finalUserData.organization_name) {
           setOrganizationName(finalUserData.organization_name);
         }
         if (finalUserData.language) {
            await i18n.changeLanguage(finalUserData.language);
         }
         setUser(finalUserData);
        } catch {
          // Token might be invalid
          Cookies.remove('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, i18n]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      await handleAuthentication(response.data);
      return response.data.user;
    } catch (error: any) {
      // The component calling login will handle displaying the error
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('token');
  };

  const handleAuthentication = async (data: { user: User; token: string }) => {
    const { user: userData, token: newToken } = data;

    // Set token first to ensure subsequent API calls are authenticated
    Cookies.set('token', newToken, { expires: 7, path: '/' }); // Set cookie for 7 days
    setToken(newToken);
    
    // The user object from login/register should be complete
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