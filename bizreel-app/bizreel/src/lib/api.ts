/**
 * Axios instance — all API calls go through here.
 * Base URL is read from the EXPO_PUBLIC_BASE_URL env variable.
 */

import axios from 'axios';

import { tokenStore } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL || 'https://bizreels-backend.onrender.com/api/v1',
  timeout: 35_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every request if present
api.interceptors.request.use((config) => {
  const token = tokenStore.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Network Connection Error. Please check your internet or retry.';
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      message = 'Server response timeout. The backend is waking up, please try again.';
    } else if (error?.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
