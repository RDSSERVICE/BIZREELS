/**
 * AuthContext — single source of truth for authentication state.
 *
 * State machine:
 *   loading  → fetching /auth/me with a stored token
 *   authed   → user confirmed via /auth/me or seeded from login/register response
 *   unauthed → no token, sign-out, or expired token
 *
 * Key design: auth state is driven by React state (`user` + `isAuthenticated`),
 * NOT derived from tokenStore reads. tokenStore is not reactive — reading it
 * outside of a React render cycle won't trigger re-renders.
 */

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { setUnauthorizedHandler } from '@/lib/api';
import { tokenStore } from '@/lib/storage';
import { fetchCurrentUser } from './api';
import type { AuthUser } from './types';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

type AuthStatus = 'loading' | 'authed' | 'unauthed';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Called by mutations after login/register — seeds user without extra round-trip */
  setUser: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.getItem('accessToken') ? 'loading' : 'unauthed'
  );

  const signOut = useCallback(() => {
    tokenStore.removeItem('accessToken');
    tokenStore.removeItem('refreshToken');
    queryClient.clear();
    setUserState(null);
    setStatus('unauthed');
  }, [queryClient]);

  // Hook up API 401 Unauthorized handler to trigger signOut automatically
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [signOut]);

  // On mount — if a token exists, verify it with /auth/me
  useEffect(() => {
    const token = tokenStore.getItem('accessToken');
    if (!token) {
      setStatus('unauthed');
      return;
    }

    setStatus('loading');
    fetchCurrentUser()
      .then((fetchedUser) => {
        setUserState(fetchedUser);
        setStatus('authed');
      })
      .catch(() => {
        // Token invalid/expired — clear it
        signOut();
      });
  }, [signOut]);

  /** Called immediately after login/register — no second network call needed */
  const setUser = useCallback((newUser: AuthUser) => {
    setUserState(newUser);
    setStatus('authed');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
