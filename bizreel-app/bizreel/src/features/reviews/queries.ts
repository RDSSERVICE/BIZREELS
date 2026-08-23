import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReview, getListingReviews } from './api';
import type { CreateReviewInput } from './types';

export function useListingReviews(listingId: string) {
  return useQuery({
    queryKey: ['reviews', 'listing', listingId],
    queryFn: () => getListingReviews(listingId),
    enabled: Boolean(listingId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'listing', variables.listing_id] });
      queryClient.invalidateQueries({ queryKey: ['listings', variables.listing_id] });
    },
  });
}
