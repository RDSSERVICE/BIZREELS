import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, Plus, MessageCircle, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function BottomNav() {
  const { user } = useAuth();
  const isVendor = user?.roles?.includes("vendor");
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

  const centerItem = isVendor
    ? { to: "/vendor/listing/new", label: "Sell", icon: Plus, testId: "nav-add", isCta: true }
    : { to: "/requirements/new", label: "Post", icon: Plus, testId: "nav-post", isCta: true };

  const items = [
    { to: "/feed", label: "Feed", icon: Home, testId: "nav-feed" },
    { to: "/explore", label: "Explore", icon: Compass, testId: "nav-explore" },
    centerItem,
    { to: user ? "/chat" : "/login", label: "Chat", icon: MessageCircle, testId: "nav-chat", badge: unread },
    { to: user ? "/profile" : "/login", label: "Me", icon: UserIcon, testId: "nav-profile" },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 bg-black/85 backdrop-blur-lg border-t border-white/10" data-testid="bottom-nav">
      <div className="flex items-center justify-around py-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink key={it.testId} to={it.to} data-testid={it.testId} className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors ${isActive ? "text-white" : "text-white/50"}`}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${it.isCta ? "bg-gradient-brand text-white" : isActive ? "text-white" : "text-white/60"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {it.badge > 0 && (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-pink-500 text-white h-4 min-w-4 px-1 rounded-full flex items-center justify-center font-semibold" data-testid="nav-chat-badge">
                        {it.badge}
                      </span>
                    )}
                  </div>
                  <span>{it.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
