/**
 * Reels feed — infinite query with prefetch & interaction mutations.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addReelComment,
  fetchReelComments,
  fetchReelsFeed,
  followUser,
  toggleReelLike,
  toggleReelSave,
  unfollowUser,
} from './api';
import type { Reel } from './types';

export const REELS_QUERY_KEY = ['reels', 'feed'] as const;

export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: REELS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchReelsFeed(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,
  });
}

/** Flattens all pages into a single ordered array of reels */
export function flattenReels(
  pages: { data: Reel[] }[] | undefined
): Reel[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.data || []);
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
      getNextPageParam: (lastPage: any) => (lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined),
    });
  };
}

export function useToggleReelLike() {
  return useMutation({
    mutationFn: (reelId: string) => toggleReelLike(reelId),
  });
}

export function useToggleReelSave() {
  return useMutation({
    mutationFn: ({ reelId, isSaved }: { reelId: string; isSaved: boolean }) =>
      toggleReelSave(reelId, isSaved),
  });
}

export function useReelComments(reelId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['reels', reelId, 'comments'],
    queryFn: () => fetchReelComments(reelId),
    enabled: enabled && !!reelId,
  });
}

export function useAddReelComment(reelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => addReelComment(reelId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', reelId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    },
  });
}
