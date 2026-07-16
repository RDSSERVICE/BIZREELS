import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../config';

/**
 * RTK Query Base API
 * Central API slice with automatic auth header injection,
 * token refresh on 401, and tag-based cache invalidation.
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Wrapper that handles 401 responses by attempting a silent token refresh.
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt token refresh
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult?.data?.success) {
      // Store new token
      api.dispatch({
        type: 'auth/tokenRefreshed',
        payload: refreshResult.data.data.accessToken,
      });

      // Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — force logout
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Reels',
    'Products',
    'Services',
    'Requirements',
    'Quotes',
    'Orders',
    'Chat',
    'Notifications',
    'Wallet',
    'Subscription',
    'Analytics',
    'Search',
    'Creators',
  ],
  endpoints: () => ({}), // Injected per feature
});

export default apiSlice;
