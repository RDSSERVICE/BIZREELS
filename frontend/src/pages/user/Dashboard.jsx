import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, User as UserIcon, Sparkles, Search, Store, ArrowRight, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScreenHeader from "@/components/app/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import BecomeVendorModal from "@/components/app/BecomeVendorModal";
import OnboardingChecklist from "@/components/app/OnboardingChecklist";
import ReferralCard from "@/components/app/ReferralCard";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showBV, setShowBV] = useState(false);

  const isVendor = user?.roles?.includes("vendor");
  const isAdmin = user?.roles?.includes("admin");

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between border-b border-white/5 pb-3">
        <img src="/bizreels logo transparent.png" alt="BizReels Logo" className="h-7 w-auto object-contain" />
        <span className="text-[10px] tracking-widest text-white/40 uppercase font-bold">BizReels Hub</span>
      </div>
      <ScreenHeader
        title={t("dashboard.greeting", { name: user?.name || "there" })}
        subtitle={t("dashboard.role_line", { role: user?.current_role || "customer" })}
        right={
          <Link to="/profile" className="glass rounded-full h-11 w-11 flex items-center justify-center" data-testid="profile-link">
            <UserIcon className="h-4 w-4" />
          </Link>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-4 pb-10" data-testid="dashboard-body">
        {/* Onboarding checklist (hides itself when complete + credited) */}
        <OnboardingChecklist />
        {/* Refer & earn */}
        <ReferralCard />
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

        {/* Primary CTAs — 2-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/browse" data-testid="dashboard-browse-cta">
            <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
              <div className="glow-brand absolute inset-0 opacity-40" />
              <div className="relative flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-lg">{t("dashboard.browse_cta")}</div>
                  <div className="text-xs text-white/60 mt-0.5">Vendors, products & services near you</div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>

          {isVendor ? (
            <Link to="/vendor/dashboard" data-testid="dashboard-vendor-cta">
              <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">{t("dashboard.vendor_cta")}</div>
                    <div className="text-xs text-white/60 mt-0.5">Manage your listings, add new ones</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowBV(true)}
              data-testid="dashboard-become-vendor-cta"
              className="text-left"
            >
              <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">{t("dashboard.become_vendor_cta")}</div>
                    <div className="text-xs text-white/60 mt-0.5">Start selling your products or services</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </button>
          )}

          {isVendor && (
            <Link to="/vendor/analytics" data-testid="dashboard-analytics-cta">
              <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">Analytics</div>
                    <div className="text-xs text-white/60 mt-0.5">Views, chats, deals, conversion, boost ROI</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" data-testid="dashboard-admin-cta">
              <div className="glass rounded-3xl p-5 relative overflow-hidden group border border-yellow-400/30 h-full">
                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-bold text-lg">Admin panel</div>
                    <div className="text-xs text-white/60 mt-0.5">Users · Listings · Reports · KYC</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          )}

          {/* Always-visible entry points to profile edit + identity verification */}
          <Link to="/profile" data-testid="dashboard-profile-cta">
            <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
              <div className="relative flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-lg">Profile &amp; settings</div>
                  <div className="text-xs text-white/60 mt-0.5">Update name, city, photo &amp; roles</div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>

          <Link to="/kyc/verify" data-testid="dashboard-kyc-cta">
            <div className="glass rounded-3xl p-5 relative overflow-hidden group h-full">
              <div className="relative flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-lg">Identity verification</div>
                  <div className="text-xs text-white/60 mt-0.5">Aadhaar · PAN · GST · Bank</div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* Phase-1 hint */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-pink-300" />
            Phase 1 · Listings & Media
          </div>
          <h3 className="font-heading text-2xl font-bold mt-4 leading-tight">
            Browse local, sell local
          </h3>
          <p className="text-sm text-white/70 mt-2 leading-relaxed max-w-xl">
            Reels-first feed, live chat, negotiation and requirements are coming in upcoming phases.
          </p>
        </div>

        <Button
          data-testid="logout-btn"
          onClick={handleLogout}
          variant="outline"
          className="w-full sm:w-auto sm:min-w-[200px] h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
        >
          <LogOut className="h-4 w-4 mr-1" /> {t("profile.logout")}
        </Button>
      </div>

      <BecomeVendorModal
        open={showBV}
        onOpenChange={setShowBV}
        onDone={() => navigate("/vendor/dashboard")}
      />
    </div>
  );
}
