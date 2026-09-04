/**
 * AuthContext — single source of truth for authentication state.
 *
 * State machine:
 *   loading  → fetching /auth/me with a stored token
 *   authed   → user confirmed via /auth/me or restored from secure local cache
 *   unauthed → no valid token, sign-out, or expired token
 *
 * Persists session state and user profile securely so the app stays logged in
 * seamlessly across restarts, cold starts, and offline conditions as long as the JWT is valid.
 */

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { setUnauthorizedHandler } from '@/lib/api';
import { isTokenExpired, tokenStore } from '@/lib/storage';
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

const defaultAuthContextValue: AuthContextValue = {
  status: 'unauthed',
  user: null,
  setUser: () => {},
  signOut: () => {},
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn('useAuth was called outside of <AuthProvider>. Returning default unauthenticated context.');
    return defaultAuthContextValue;
  }
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const cachedUserJson = tokenStore.getItem('userProfile');
    if (cachedUserJson) {
      try {
        return JSON.parse(cachedUserJson);
      } catch {}
    }
    return null;
  });

  const [status, setStatus] = useState<AuthStatus>(() => {
    const token = tokenStore.getItem('accessToken');
    const cachedUserJson = tokenStore.getItem('userProfile');
    if (!token) return 'unauthed';
    if (isTokenExpired(token) && !tokenStore.getItem('refreshToken')) return 'unauthed';
    return cachedUserJson ? 'authed' : 'loading';
  });

  const signOut = useCallback(() => {
    tokenStore.clearAll();
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

  // On mount — verify token with backend in background while serving cached session
  useEffect(() => {
    const token = tokenStore.getItem('accessToken');
    const refreshToken = tokenStore.getItem('refreshToken');
    const cachedUserJson = tokenStore.getItem('userProfile');

    if (!token && !refreshToken) {
      setStatus('unauthed');
      return;
    }

    if (token && isTokenExpired(token) && !refreshToken) {
      signOut();
      return;
    }

    let cachedUser: AuthUser | null = null;
    if (cachedUserJson) {
      try {
        cachedUser = JSON.parse(cachedUserJson);
      } catch {}
    }

    if (cachedUser) {
      const effectiveRole = cachedUser.activeRole || cachedUser.current_role || (cachedUser as any).role || 'customer';
      cachedUser.activeRole = effectiveRole as any;
      cachedUser.current_role = effectiveRole as any;
      setUserState(cachedUser);
      setStatus('authed');
    } else {
      setStatus('loading');
    }

    fetchCurrentUser()
      .then((fetchedUser) => {
        if (fetchedUser) {
          const effectiveRole = fetchedUser.activeRole || fetchedUser.current_role || (fetchedUser as any).role || 'customer';
          fetchedUser.activeRole = effectiveRole as any;
          fetchedUser.current_role = effectiveRole as any;
          setUserState(fetchedUser);
          setStatus('authed');
          tokenStore.setItem('userProfile', JSON.stringify(fetchedUser));
        } else if (!cachedUser) {
          setStatus('unauthed');
        }
      })
      .catch((err: any) => {
        // ONLY sign out if backend explicitly rejected with 401 Unauthorized
        // Transient network disconnects, timeouts, 5xx server errors MUST NOT log out valid sessions!
        const isUnauthorized = err?.response?.status === 401 || err?.message?.includes('Session expired');
        if (isUnauthorized) {
          signOut();
        } else if (cachedUser) {
          setUserState(cachedUser);
          setStatus('authed');
        } else if (token && !isTokenExpired(token)) {
          setStatus('authed');
        } else {
          setStatus('unauthed');
        }
      });
  }, [signOut]);

  /** Called immediately after login/register — caches profile for instant persistence */
  const setUser = useCallback((newUser: AuthUser) => {
    if (newUser) {
      const effectiveRole = newUser.activeRole || newUser.current_role || (newUser as any).role || 'customer';
      newUser.activeRole = effectiveRole as any;
      newUser.current_role = effectiveRole as any;
      tokenStore.setItem('userProfile', JSON.stringify(newUser));
    }
    setUserState(newUser);
    setStatus('authed');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
