import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { navForRole } from "@/lib/roleNav";

export default function BottomNav() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    chatApi.unreadTotal().then(({ data }) => setUnread(data.unread_total || 0)).catch(() => {});
    const s = getSocket();
    if (s) {
      const h = () => chatApi.unreadTotal().then(({ data }) => setUnread(data.unread_total || 0)).catch(() => {});
      s.on("message:new", h);
      s.on("message:read", h);
      return () => { s.off("message:new", h); s.off("message:read", h); };
    }
  }, [user?.id]);

  const role = user?.current_role || (user?.roles || [])[0] || "customer";
  const items = navForRole(role).map((it) => ({
    ...it,
    to: (!user && (it.testId === "nav-chat" || it.testId === "nav-profile")) ? "/login" : it.to,
    badge: it.showUnread ? unread : 0,
  }));

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 bg-black/85 backdrop-blur-lg border-t border-white/10" data-testid="bottom-nav">
      <div className="max-w-3xl mx-auto flex items-center justify-around py-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink key={it.testId} to={it.to} data-testid={it.testId} className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] sm:text-xs transition-colors ${isActive ? "text-white" : "text-white/50"}`}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center ${it.isCta ? "bg-gradient-brand text-white" : isActive ? "text-white" : "text-white/60"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {it.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-pink-500 text-[9px] font-bold text-white flex items-center justify-center">
                        {it.badge > 99 ? "99+" : it.badge}
                      </span>
                    )}
                  </div>
                  <span className={isActive ? "font-semibold" : ""}>{it.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
