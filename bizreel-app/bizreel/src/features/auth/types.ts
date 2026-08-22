/** Auth-related TypeScript types derived from the API response. */

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserSubscription {
  plan: string;
  plan_id: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  boostCredits: number;
  autoRenew: boolean;
  status: string;
}

export interface UserLocation {
  type: string;
  coordinates: [number, number];
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
}

export interface CustomerProfile {
  savedListings: string[];
  interestsSelectedAt: string | null;
  interests: string[];
}

export interface AuthUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  roles: string[];
  current_role: string;
  activeRole: string;
  kyc_status: 'unverified' | 'verified' | 'pending';
  profile_pic: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dob: string | null;
  occupation: string | null;
  profession: string | null;
  language: string;
  is_active: boolean;
  is_subscribed_verified: boolean;
  subscription: UserSubscription;
  rating_avg: number;
  rating_count: number;
  walletBalance: number;
  trust_score: number | null;
  city: string | null;
  followersCount: number;
  followingCount: number;
  chat_response_rate: number;
  avg_response_time_seconds: number | null;
  customerProfile: CustomerProfile | null;
  vendorProfile: unknown | null;
  creatorProfile: unknown | null;
  location: UserLocation;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
}

/** Shape returned directly by GET /users/me (no success/data wrapper) */
export interface UsersMeResponse {
  user: AuthUser;
}
