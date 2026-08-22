import { api } from '@/lib/api';
import type { ReelsFeedResponse } from './types';

export const REELS_LIMIT = 3;

export async function fetchReelsFeed(page: number): Promise<ReelsFeedResponse> {
  const response = await api.get<ReelsFeedResponse>('/reels', {
    params: { page, limit: REELS_LIMIT },
  });
  return response.data;
}
