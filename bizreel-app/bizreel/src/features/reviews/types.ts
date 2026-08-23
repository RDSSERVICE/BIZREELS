export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  listing?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  listing_id: string;
  rating: number;
  comment: string;
}
