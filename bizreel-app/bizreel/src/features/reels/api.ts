import { api } from '@/lib/api';
import type { Comment, ReelsFeedResponse } from './types';

export const REELS_LIMIT = 5;

export async function fetchReelsFeed(page: number): Promise<ReelsFeedResponse> {
  const response = await api.get<ReelsFeedResponse>('/reels', {
    params: { page, limit: REELS_LIMIT },
  });
  return response.data;
}

export async function toggleReelLike(reelId: string): Promise<{ success: boolean; liked: boolean }> {
  const { data } = await api.post<{ success: boolean; data: { liked: boolean } }>(`/reels/${reelId}/like`);
  return { success: data.success, liked: data.data?.liked ?? true };
}

export async function toggleReelSave(reelId: string, isSaved: boolean): Promise<boolean> {
  const endpoint = isSaved ? `/reels/${reelId}/unsave` : `/reels/${reelId}/save`;
  const { data } = await api.post<{ success: boolean }>(endpoint);
  return data.success;
}

export async function fetchReelComments(reelId: string): Promise<Comment[]> {
  const { data } = await api.get<{ success: boolean; data: Comment[] }>(`/reels/${reelId}/comments`);
  return data.data || [];
}

export async function addReelComment(reelId: string, text: string): Promise<Comment> {
  const { data } = await api.post<{ success: boolean; data: Comment }>(`/reels/${reelId}/comments`, { text });
  return data.data;
}

export async function followUser(userId: string): Promise<boolean> {
  const { data } = await api.post(`/follow/${userId}`);
  return data.success || true;
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const { data } = await api.delete(`/follow/${userId}`);
  return data.success || true;
}

export async function fetchMyReels(): Promise<any[]> {
  const { data } = await api.get('/reels/my-reels');
  const items = data.data || data.items || data || [];
  return Array.isArray(items) ? items : [];
}

export async function createReel(payload: {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  taggedListing?: string;
  hashtags?: string[];
  mediaType?: 'video' | 'image';
}): Promise<any> {
  const { data } = await api.post('/reels', payload);
  return data.data || data;
}

export async function deleteReel(reelId: string): Promise<boolean> {
  const { data } = await api.delete(`/reels/${reelId}`);
  return data.success || true;
}

export async function boostReel(reelId: string): Promise<boolean> {
  const { data } = await api.post(`/reels/${reelId}/boost`);
  return data.success || true;
}
