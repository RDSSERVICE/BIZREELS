export interface Reel {
  _id: string;
  creator: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  hashtags: string[];
  postType: string;
  category: string;
  subcategory: string;
  mediaUrls: string[];
  mediaType: 'video' | 'image';
  views: number;
  likesCount: number;
  commentsCount: number;
  isBoosted: boolean;
  createdAt: string;
  tier?: number;
  creatorName: string;
  creatorAvatar: string | null;
  creatorRole: string;
  isLiked: boolean;
}

export interface ReelsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ReelsFeedResponse {
  success: boolean;
  message: string;
  data: Reel[];
  meta: ReelsMeta;
}
