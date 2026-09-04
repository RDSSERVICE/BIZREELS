import { api } from '@/lib/api';
import type { Comment, ReelsFeedResponse } from './types';

export const REELS_LIMIT = 5;

export async function fetchReelsFeed(
  page: number,
  searchParams?: { q?: string; hashtags?: string; category?: string }
): Promise<ReelsFeedResponse> {
  const response = await api.get<ReelsFeedResponse>('/reels', {
    params: { page, limit: REELS_LIMIT, ...searchParams },
  });
  if (response.data && Array.isArray(response.data.data)) {
    response.data.data = response.data.data.map((r: any) => ({
      ...r,
      isLiked: Boolean(r.isLiked || r.is_liked || r.hasLiked || r.viewer_state?.liked),
      isSaved: Boolean(r.isSaved || r.is_saved || r.hasSaved || r.viewer_state?.saved),
      isFollowing: Boolean(r.isFollowing || r.is_following || r.viewer_following || r.viewer_state?.following),
    }));
  }
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
  const { data } = await api.get<any>(`/reels/${reelId}/comments`);
  const rawList = data.data?.comments || data.data || data.comments || (Array.isArray(data) ? data : []);
  const list = Array.isArray(rawList) ? rawList : [];

  return list.map((c: any) => {
    const userObj =
      (typeof c.user === 'object' && c.user) ||
      (typeof c.userId === 'object' && c.userId) ||
      {};
    const userName = userObj.name || userObj.businessName || c.userName || c.username || 'User';
    const commentText = c.content || c.text || c.comment || '';

    return {
      _id: c._id || c.id || Math.random().toString(),
      user: {
        _id: userObj._id || '',
        name: userName,
        avatarUrl: userObj.avatarUrl || userObj.profile_pic || userObj.logo || null,
        businessName: userObj.businessName || null,
      },
      userId: userObj,
      text: commentText,
      content: commentText,
      comment: commentText,
      createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    };
  });
}

export async function addReelComment(reelId: string, text: string): Promise<Comment> {
  const { data } = await api.post<any>(`/reels/${reelId}/comments`, {
    text,
    content: text,
    comment: text,
  });
  const c = data.data?.comment || data.data || data;
  const userObj = (typeof c?.user === 'object' && c.user) || (typeof c?.userId === 'object' && c.userId) || {};
  const userName = userObj.name || userObj.businessName || c?.userName || 'User';
  const commentText = c?.content || c?.text || c?.comment || text;

  return {
    _id: c?._id || c?.id || Math.random().toString(),
    user: {
      _id: userObj._id || '',
      name: userName,
      avatarUrl: userObj.avatarUrl || null,
      businessName: userObj.businessName || null,
    },
    userId: userObj,
    text: commentText,
    content: commentText,
    comment: commentText,
    createdAt: c?.createdAt || new Date().toISOString(),
  };
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
  postType?: string;
  postPurpose?: string;
  taggedListing?: string;
  category?: string;
  subcategory?: string;
  hashtags?: string[];
  mediaType?: 'video' | 'image';
  saveToServiceGallery?: boolean;
}): Promise<any> {
  const body = {
    ...payload,
    videoUrl: payload.videoUrl,
    mediaUrl: payload.videoUrl,
    mediaUrls: [payload.videoUrl],
    thumbnailUrl: payload.thumbnailUrl || payload.videoUrl,
    targetListing: payload.taggedListing,
    postType: payload.postType || 'product',
    postPurpose: payload.postPurpose || 'General Promotion',
  };
  const { data } = await api.post('/reels', body);
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

export async function recordReelView(reelId: string, watchDurationSeconds: number = 3): Promise<boolean> {
  try {
    const { data } = await api.post(`/reels/${reelId}/view`, { watchDuration: watchDurationSeconds });
    return data.success || true;
  } catch {
    return false;
  }
}

