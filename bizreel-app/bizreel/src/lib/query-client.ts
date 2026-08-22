/**
 * TanStack Query client with AsyncStorage-backed persistence.
 *
 * How it works:
 * - The QueryClient holds all server state in memory.
 * - The async persister serializes the full cache to AsyncStorage on every change.
 * - On app start, the cache is rehydrated from AsyncStorage before the first render.
 * - maxAge: 24 hours — stale entries older than this are dropped on rehydration.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // fresh for 5 min
      gcTime: 1000 * 60 * 10,     // keep in memory 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

if (typeof window !== 'undefined' || Platform.OS !== 'web') {
  try {
    const persister = createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'TANSTACK_QUERY_CACHE',
    });

    persistQueryClient({
      queryClient,
      persister,
      maxAge: ONE_DAY_MS,
    });
  } catch (e) {
    console.warn('Persist query client failed:', e);
  }
}
