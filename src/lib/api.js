import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL || '/api'
    : '/api',
});

// The browser will automatically send the cookie, so we don't need an interceptor to add the token.

export default api;