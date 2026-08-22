/**
 * Axios instance — all API calls go through here.
 * Base URL is read from the EXPO_PUBLIC_BASE_URL env variable.
 */

import axios from 'axios';

import { tokenStore } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL,
  timeout: 15_000,
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
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);
