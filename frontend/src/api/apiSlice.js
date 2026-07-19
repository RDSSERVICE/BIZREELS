import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../config';
import { tokenStore } from '../lib/api';
import { tokenRefreshed, logout } from '../features/auth/authSlice';

/**
 * RTK Query Base API
 * Central API slice with automatic auth header injection,
 * token refresh on 401, and tag-based cache invalidation for real-time polling.
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = tokenStore.getAccess() || getState().auth.accessToken;
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
    const refreshToken = tokenStore.getRefresh();

    // Attempt refresh via /auth/refresh-token or /auth/refresh
    let refreshResult = await baseQuery(
      {
        url: '/auth/refresh-token',
        method: 'POST',
        body: { refreshToken: refreshToken || undefined, refresh_token: refreshToken || undefined },
      },
      api,
      extraOptions
    );

    if (refreshResult?.error) {
      // Fallback try legacy route
      refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken || undefined },
        },
        api,
        extraOptions
      );
    }

    const resBody = refreshResult?.data;
    const newAccessToken =
      resBody?.data?.accessToken ||
      resBody?.data?.access_token ||
      resBody?.accessToken ||
      resBody?.access_token;

    if (newAccessToken) {
      const newRefreshToken =
        resBody?.data?.refreshToken ||
        resBody?.data?.refresh_token ||
        resBody?.refreshToken ||
        resBody?.refresh_token;

      tokenStore.set({
        access_token: newAccessToken,
        refresh_token: newRefreshToken || refreshToken,
      });

      api.dispatch(tokenRefreshed(newAccessToken));

      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — force logout
      tokenStore.clear();
      api.dispatch(logout());
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
    'Categories',
    'AdminUsers',
    'AdminListings',
    'AdminKyc',
    'AdminReports',
    'AdminSettings',
    'AdminOverview',
    'AdminTransactions',
    'AdminOrders',
    'AdminCommissions',
    'AdminAuditLog',
    'BoostPlans',
    'Locations',
    'Coupons',
    'Cms',
    'AppSettings',
    'Reviews',
    'VendorDashboard',
    'VendorBoosts',
    'VendorLeads',
    'CreatorDashboard',
    'CreatorPortfolio',
    'CreatorPricing',
    'CreatorAvailability',
    'CreatorOrders',
  ],
  endpoints: () => ({}), // Injected per feature
});

export default apiSlice;
