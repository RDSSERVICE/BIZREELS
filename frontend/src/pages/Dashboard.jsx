import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <PhoneScreen>
      <ScreenHeader
        title={t("dashboard.greeting", { name: user?.name || "there" })}
        subtitle={t("dashboard.role_line", { role: user?.current_role || "customer" })}
        right={
          <Link to="/profile" className="glass rounded-full h-11 w-11 flex items-center justify-center" data-testid="profile-link">
            <UserIcon className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-6 space-y-4 pb-10" data-testid="dashboard-body">
        {/* Role chips */}
        <div className="flex flex-wrap gap-2">
          {(user?.roles || []).map((r) => (
            <span
              key={r}
              data-testid={`role-chip-${r}`}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                r === user?.current_role
                  ? "bg-gradient-brand text-white border-transparent"
                  : "bg-white/5 text-white/70 border-white/10"
              }`}
            >
              {r}
            </span>
          ))}
        </div>

        {/* Stub card */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="glow-brand absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-pink-300" />
              Phase 0 · Auth foundation
            </div>
            <h3 className="font-heading text-2xl font-bold mt-4 leading-tight">
              {t("dashboard.stub_title")}
            </h3>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              {t("dashboard.stub_body")}
            </p>
          </div>
        </div>

        {/* Placeholder feed grid */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/5 animate-pulse" data-testid={`feed-skeleton-${i}`} />
          ))}
        </div>

        <Button
          data-testid="logout-btn"
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
        >
          <LogOut className="h-4 w-4 mr-1" /> {t("profile.logout")}
        </Button>
      </div>
    </PhoneScreen>
  );
}
