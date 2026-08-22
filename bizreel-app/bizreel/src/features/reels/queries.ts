/**
 * Reels feed — infinite query with prefetch.
 *
 * Strategy:
 * - useInfiniteQuery pages through /reels?page=N&limit=3
 * - When the user reaches a reel, prefetchNextPage() is called
 *   so the next 3 reels are already in cache before the user scrolls to them.
 * - TanStack Query + AsyncStorage persister caches the feed offline.
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { fetchReelsFeed } from './api';
import type { Reel } from './types';

export const REELS_QUERY_KEY = ['reels', 'feed'] as const;

export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: REELS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchReelsFeed(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,
  });
}

/** Flattens all pages into a single ordered array of reels */
export function flattenReels(
  pages: { data: Reel[] }[] | undefined
): Reel[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.data);
}

/** Hook: prefetches the next page when called */
export function usePrefetchNextReelsPage() {
  const queryClient = useQueryClient();

  return (currentPage: number, hasNextPage: boolean) => {
    if (!hasNextPage) return;
    const nextPage = currentPage + 1;
    queryClient.prefetchInfiniteQuery({
      queryKey: REELS_QUERY_KEY,
      queryFn: ({ pageParam }) => fetchReelsFeed(pageParam as number),
      initialPageParam: nextPage,
      pages: 1,
    });
  };
}
