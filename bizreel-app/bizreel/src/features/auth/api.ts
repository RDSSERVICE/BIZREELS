/** Raw API call functions for auth endpoints. */

import { api } from '@/lib/api';
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, UsersMeResponse } from './types';

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

/**
 * Fetch the currently authenticated user (used for session hydration on app start).
 * Endpoint: GET /auth/me
 * Response shape: { success, message, data: { user } }
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await api.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
  return response.data.data.user;
}

/**
 * Fetch the full user profile for the profile screen.
 * Endpoint: GET /users/me
 * Response shape: { user: AuthUser } — no success/data wrapper.
 * Returns richer fields than /auth/me: walletBalance, followersCount,
 * rating_avg, customerProfile, location, etc.
 */
export async function fetchUserProfile(): Promise<AuthUser> {
  const response = await api.get<UsersMeResponse>('/users/me');
  return response.data.user;
}
