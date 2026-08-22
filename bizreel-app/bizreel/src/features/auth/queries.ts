/**
 * User profile query — fetches the full authenticated user from GET /users/me.
 *
 * Strategy:
 * - useQuery hits /users/me on mount and whenever the query becomes stale.
 * - staleTime: 5 min — profile data changes infrequently.
 * - gcTime: 30 min — keep in cache while navigating away and back.
 * - TanStack Query + AsyncStorage persister means the last profile is shown
 *   instantly on cold launch while a background refetch runs.
 * - Query is only enabled when the user is authenticated (token present).
 */

import { useQuery } from '@tanstack/react-query';

import { tokenStore } from '@/lib/storage';
import { fetchUserProfile } from './api';

export const USER_PROFILE_QUERY_KEY = ['user', 'profile', 'me'] as const;

export function useCurrentUserProfile() {
  const hasToken = Boolean(tokenStore.getItem('accessToken'));

  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    enabled: hasToken,
    staleTime: 1000 * 60 * 5,   // 5 min
    gcTime: 1000 * 60 * 30,     // 30 min
    retry: 1,
  });
}
