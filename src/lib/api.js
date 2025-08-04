import axios from 'axios';
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
    return Promise.reject(error);
  }
);


// The browser will automatically send the cookie, so we don't need an interceptor to add the token.

export default api;