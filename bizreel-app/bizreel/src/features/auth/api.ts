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

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await api.get<{ success: boolean; data: { user: AuthUser } }>('/auth/me');
  return response.data.data.user;
}

export async function fetchUserProfile(): Promise<AuthUser> {
  const response = await api.get<UsersMeResponse>('/users/me');
  return response.data.user;
}

export async function switchUserRole(role: 'customer' | 'vendor' | 'creator'): Promise<AuthUser> {
  try {
    const response = await api.patch<{ success: boolean; data?: { user: AuthUser }; user?: AuthUser }>(
      '/auth/switch-role',
      { role }
    );
    return response.data.data?.user || response.data.user || (response.data as any);
  } catch (err) {
    const response = await api.post<{ success: boolean; data?: { user: AuthUser }; user?: AuthUser }>(
      '/auth/add-role',
      { role }
    );
    return response.data.data?.user || response.data.user || (response.data as any);
  }
}
