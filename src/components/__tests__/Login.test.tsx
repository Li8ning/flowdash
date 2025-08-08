import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from '../Login';
import { AuthProvider } from '@/context/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme/theme';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key itself
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  // Provide a dummy implementation for initReactI18next to prevent i18next initialization error
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock the AuthContext to provide a dummy login function
jest.mock('@/context/AuthContext', () => ({
  ...jest.requireActual('@/context/AuthContext'),
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

// Mock the LanguageContext
jest.mock('@/context/LanguageContext', () => ({
  ...jest.requireActual('@/context/LanguageContext'),
  useLanguage: () => ({
    language: 'en',
    changeLanguage: jest.fn(),
  }),
}));


describe('Login Component', () => {
  it('renders the login form', () => {
    render(
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ChakraProvider>
    );

    // Check if the main heading is there
    expect(screen.getByRole('heading', { name: /login.title/i })).toBeInTheDocument();

    // Check for input fields by their labels
    expect(screen.getByLabelText(/login.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/login.password/i)).toBeInTheDocument();

    // Check for the login button
    expect(screen.getByRole('button', { name: /login.button/i })).toBeInTheDocument();
  });
});