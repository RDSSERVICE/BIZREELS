/**
 * Axios instance — all API calls go through here.
 * Base URL is read from the EXPO_PUBLIC_BASE_URL env variable.
 */

import axios from 'axios';

import { tokenStore } from './storage';

const DEFAULT_BACKEND_URL = 'https://bizreels-backend.onrender.com/api/v1';

export const getBaseUrl = (): string => {
  const envUrl =
    process.env.EXPO_PUBLIC_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    DEFAULT_BACKEND_URL;

  let cleanUrl = envUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api/v1')) {
    if (cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/v1`;
    } else {
      cleanUrl = `${cleanUrl}/api/v1`;
    }
  }
  return cleanUrl;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
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

type UnauthorizedCallback = () => void;
let unauthorizedHandler: UnauthorizedCallback | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export function setUnauthorizedHandler(handler: UnauthorizedCallback | null) {
  unauthorizedHandler = handler;
}

// Normalize error responses, handle 401 token expiry with automatic token refresh & retry network timeouts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isAuthEndpoint =
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/register') ||
      config?.url?.includes('/auth/refresh');

    // Automatically handle 401 Unauthorized (Expired or Invalid Token)
    if (error?.response?.status === 401 && !isAuthEndpoint && config && !config._authRetry) {
      config._authRetry = true;
      const refreshToken = tokenStore.getItem('refreshToken');

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshUrl = `${getBaseUrl()}/auth/refresh-token`;
            const refreshRes = await axios.post(refreshUrl, { refreshToken }, { timeout: 15000 });
            const data = refreshRes.data?.data || refreshRes.data || {};
            const newAccessToken = data.accessToken || data.token;
            const newRefreshToken = data.refreshToken || refreshToken;

            if (newAccessToken) {
              tokenStore.setItem('accessToken', newAccessToken);
              tokenStore.setItem('refreshToken', newRefreshToken);
              isRefreshing = false;
              onRefreshed(newAccessToken);
              config.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(config);
            }
          } catch (refreshErr) {
            isRefreshing = false;
            refreshSubscribers = [];
            tokenStore.clearAll();
            if (unauthorizedHandler) {
              unauthorizedHandler();
            }
            return Promise.reject(new Error('Session expired. Please log in again.'));
          }
        } else {
          // Wait for ongoing refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(config));
            });
          });
        }
      } else {
        // No refresh token available
        tokenStore.clearAll();
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }
    }

    if (config && !config._retry && (error?.code === 'ECONNABORTED' || !error?.response)) {
      config._retry = true;
      try {
        await new Promise((res) => setTimeout(res, 2000));
        return await api(config);
      } catch (retryErr) {
        // Fallthrough to standard error handling below
      }
    }

    let message = 'Network Connection Error. Please check your internet or retry.';
    const data = error?.response?.data;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const details = data.errors.map((e: any) => e.message || e.msg || e).filter(Boolean).join(' | ');
      message = data.message ? `${data.message}: ${details}` : details;
    } else if (data?.message) {
      message = data.message;
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      message = 'Server response timeout. The backend is waking up, please try again.';
    } else if (error?.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export { resolveImageUrl } from '../utils/image';
