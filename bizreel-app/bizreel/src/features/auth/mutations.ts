import { useMutation } from '@tanstack/react-query';

import { tokenStore } from '@/lib/storage';
import { loginUser, registerUser, sendOtp, verifyOtp } from './api';
import { useAuth } from './context';
import type { LoginPayload, RegisterPayload, SendOtpPayload, VerifyOtpPayload } from './types';

function persistAuth(accessToken: string, refreshToken: string) {
  tokenStore.setItem('accessToken', accessToken);
  tokenStore.setItem('refreshToken', refreshToken);
}

export function useRegister() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onSuccess: (data) => {
      const accessToken = data.data?.accessToken || (data as any).access_token;
      const refreshToken = data.data?.refreshToken || (data as any).refresh_token;
      const user = data.data?.user || (data as any).user;
      if (accessToken && refreshToken) {
        persistAuth(accessToken, refreshToken);
      }
      if (user) {
        setUser(user);
      }
    },
  });
}

export const useRegisterWithPhone = useRegister;

export function useLogin() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data) => {
      const accessToken = data.data?.accessToken || (data as any).access_token;
      const refreshToken = data.data?.refreshToken || (data as any).refresh_token;
      const user = data.data?.user || (data as any).user;
      if (accessToken && refreshToken) {
        persistAuth(accessToken, refreshToken);
      }
      if (user) {
        setUser(user);
      }
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => sendOtp(payload),
  });
}

export function useVerifyOtp(autoLogin: boolean = true) {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtp(payload),
    onSuccess: (data) => {
      const accessToken = data.data?.accessToken || (data as any).access_token;
      const refreshToken = data.data?.refreshToken || (data as any).refresh_token;
      const user = data.data?.user || (data as any).user;
      if (accessToken && refreshToken) {
        tokenStore.setItem('accessToken', accessToken);
        tokenStore.setItem('refreshToken', refreshToken);
      }
      if (autoLogin && user) {
        setUser(user);
      }
    },
  });
}
