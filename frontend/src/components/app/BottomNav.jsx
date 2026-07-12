import { NavLink } from "react-router-dom";
import { Home, Compass, Plus, Bookmark, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const { user } = useAuth();
  const isVendor = user?.roles?.includes("vendor");
  const items = [
    { to: "/feed", label: "Feed", icon: Home, testId: "nav-feed" },
    { to: "/explore", label: "Explore", icon: Compass, testId: "nav-explore" },
    isVendor
      ? { to: "/vendor/listing/new", label: "Sell", icon: Plus, testId: "nav-add", isCta: true }
      : { to: "/saved", label: "Saved", icon: Bookmark, testId: "nav-saved" },
    { to: "/saved", label: "Saved", icon: Bookmark, testId: "nav-saved-alt", hide: !isVendor },
    { to: user ? "/profile" : "/login", label: "Me", icon: UserIcon, testId: "nav-profile" },
  ].filter((it) => !it?.hide);

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-30 bg-black/85 backdrop-blur-lg border-t border-white/10"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around py-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.testId}
              to={it.to}
              data-testid={it.testId}
              className={({ isActive }) => `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors ${
                isActive ? "text-white" : "text-white/50"
              }`}
            >
              {({ isActive }) => (
                <>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    it.isCta
                      ? "bg-gradient-brand text-white"
                      : isActive ? "text-white" : "text-white/60"
                  }`}>
                    <Icon className="h-5 w-5" />
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
