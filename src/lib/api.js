import axios from 'axios';
import Cookies from 'js-cookie';
import { startApiLoading, stopApiLoading } from '../context/LoadingContext';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL || '/api'
    : '/api',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    startApiLoading();
    return config;
  },
  (error) => {
    stopApiLoading();
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    stopApiLoading();
    return response;
  },
  (error) => {
    stopApiLoading();
    // Check for 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      // Ensure this code runs only in the browser
      if (typeof window !== 'undefined') {
        // Do not redirect for password update errors
        if (error.config.url.includes('/password')) {
          return Promise.reject(error);
        }

        // Avoid redirect loops if already on the login page
        if (window.location.pathname !== '/') {
          Cookies.remove('token');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);


// The browser will automatically send the cookie, so we don't need an interceptor to add the token.

export default api;