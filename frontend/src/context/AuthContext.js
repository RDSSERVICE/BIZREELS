import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStore, userApi, authApi } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(!!tokenStore.getAccess());

  const refreshMe = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await userApi.me();
      tokenStore.setUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (e) {
      tokenStore.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAuthResponse = (data) => {
    tokenStore.set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    setUser(data.user);
  };

  const logout = async () => {
    const rt = tokenStore.getRefresh();
    try {
      if (rt) await authApi.logout(rt);
    } catch { /* noop */ }
    tokenStore.clear();
    setUser(null);
  };

  const updateLocalUser = (u) => {
    tokenStore.setUser(u);
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, applyAuthResponse, logout, refreshMe, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
