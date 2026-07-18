import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStore, userApi, authApi } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const s = getSocket();
    if (!s) return;

    const onMessageNew = (msg) => {
      if (!window.location.pathname.includes(`/chat/${msg.thread_id}`)) {
        toast.message(`New message`, {
          description: msg.text || "You received a new message.",
          action: {
            label: "Reply",
            onClick: () => {
              window.location.href = `/chat/${msg.thread_id}`;
            }
          }
        });
      }
    };

    const onDealUpdated = (deal) => {
      if (!window.location.pathname.includes(`/chat/${deal.thread_id}`) && !window.location.pathname.includes("/deals")) {
        toast.message("Deal updated", {
          description: `Offer: ₹${deal.current_offer.toLocaleString("en-IN")} (${deal.status})`,
          action: {
            label: "View",
            onClick: () => {
              window.location.href = `/chat/${deal.thread_id}`;
            }
          }
        });
      }
    };

    const onNotificationNew = (notif) => {
      if (!window.location.pathname.includes("/notifications")) {
        toast.message(notif.title, {
          description: notif.body || "New alert received.",
          action: notif.action_url ? {
            label: "Open",
            onClick: () => {
              window.location.href = notif.action_url;
            }
          } : undefined
        });
      }
    };

    const onWalletUpdated = (wData) => {
      if (!window.location.pathname.includes("/wallet")) {
        toast.message("Wallet updated!", {
          description: `Balance: ₹${(wData.balance_inr_paise / 100).toLocaleString("en-IN")} (${wData.credits} credits)`,
          action: {
            label: "View",
            onClick: () => {
              window.location.href = "/wallet";
            }
          }
        });
      }
    };

    s.on("message:new", onMessageNew);
    s.on("deal:updated", onDealUpdated);
    s.on("notification:new", onNotificationNew);
    s.on("wallet:updated", onWalletUpdated);

    return () => {
      s.off("message:new", onMessageNew);
      s.off("deal:updated", onDealUpdated);
      s.off("notification:new", onNotificationNew);
      s.off("wallet:updated", onWalletUpdated);
    };
  }, [user]);

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
