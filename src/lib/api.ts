import axios from 'axios';
import { startApiLoading, stopApiLoading } from '../context/LoadingContext';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    // Check for token in localStorage first, then sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request and response interceptors for global loading state
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

api.interceptors.response.use(
  (response) => {
    stopApiLoading();
    return response;
  },
  (error) => {
    stopApiLoading();
    return Promise.reject(error);
  }
);

export default api;