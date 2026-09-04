/**
 * Reels feed — infinite query with prefetch & interaction mutations.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addReelComment,
  boostReel,
  createReel,
  deleteReel,
  fetchMyReels,
  fetchReelComments,
  fetchReelsFeed,
  followUser,
  toggleReelLike,
  toggleReelSave,
  unfollowUser,
} from './api';
import type { Reel } from './types';

export const REELS_QUERY_KEY = ['reels', 'feed'] as const;

export function useReelsFeed(searchParams?: { q?: string; hashtags?: string; category?: string }) {
  return useInfiniteQuery({
    queryKey: ['reels', 'feed', searchParams?.q || '', searchParams?.hashtags || '', searchParams?.category || ''],
    queryFn: ({ pageParam }) => fetchReelsFeed(pageParam as number, searchParams),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,
  });
}

/** Flattens all pages into a single ordered array of unique reels */
export function flattenReels(
  pages: { data: Reel[] }[] | undefined
): Reel[] {
  if (!pages) return [];
  const allReels = pages.flatMap((p) => p.data || []);
  const seen = new Set<string>();
  return allReels.filter((reel) => {
    const id = reel?._id || (reel as any)?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reelId: string) => toggleReelLike(reelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

export function useToggleReelSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reelId, isSaved }: { reelId: string; isSaved: boolean }) =>
      toggleReelSave(reelId, isSaved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
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
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', userId] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', userId] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

export function useMyReels() {
  return useQuery({
    queryKey: ['reels', 'my-reels'],
    queryFn: fetchMyReels,
  });
}

export function useCreateReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', 'my-reels'] });
      queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
    },
  });
}

export function useDeleteReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', 'my-reels'] });
      queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
    },
  });
}

export function useBoostReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: boostReel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', 'my-reels'] });
    },
  });
}
