import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStore, userApi, authApi } from '@/src/lib/api';

interface AuthContextType {
  user: any;
  loading: boolean;
  applyAuthResponse: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<any>;
  updateLocalUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const access = await tokenStore.getAccess();
    if (!access) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await userApi.me();
      await tokenStore.setUser(data.user);
      setUser(data.user);
      return data.user;
    } catch {
      await tokenStore.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const applyAuthResponse = async (data: any) => {
    await tokenStore.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    setUser(data.user);
  };

  const logout = async () => {
    const rt = await tokenStore.getRefresh();
    try {
      if (rt) await authApi.logout(rt);
    } catch {}
    await tokenStore.clear();
    setUser(null);
  };

  const updateLocalUser = (u: any) => {
    tokenStore.setUser(u);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, applyAuthResponse, logout, refreshMe, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
