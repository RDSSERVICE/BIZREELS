import { useMutation } from '@tanstack/react-query';

import { tokenStore } from '@/lib/storage';
import { loginUser, registerUser } from './api';
import { useAuth } from './context';
import type { LoginPayload, RegisterPayload } from './types';

function persistAuth(accessToken: string, refreshToken: string) {
  tokenStore.setItem('accessToken', accessToken);
  tokenStore.setItem('refreshToken', refreshToken);
}

export function useRegister() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onSuccess: (data) => {
      persistAuth(data.data.accessToken, data.data.refreshToken);
      // Seed user into context → AuthGate sees 'authed' → redirects to /(tabs)
      setUser(data.data.user);
    },
  });
}

export function useLogin() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data) => {
      persistAuth(data.data.accessToken, data.data.refreshToken);
      setUser(data.data.user);
    },
  });
}
