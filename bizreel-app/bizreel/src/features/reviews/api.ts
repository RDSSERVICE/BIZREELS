import { api } from '@/lib/api';
import type { CreateReviewInput, Review } from './types';

export async function getListingReviews(listingId: string): Promise<Review[]> {
  const { data } = await api.get(`/reviews/listing/${listingId}`);
  const items = data.data || data.reviews || data.items || data || [];
  return Array.isArray(items) ? items : [];
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const payload = {
    listing: input.listing_id,
    rating: input.rating,
    comment: input.comment,
  };
  const { data } = await api.post('/reviews', payload);
  return data.data || data;
}
