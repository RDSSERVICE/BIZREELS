import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck, Users, Store, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

import LanguageToggle from "@/components/app/LanguageToggle";
import { CategoryShowcase, Testimonials, CityChampions, PressLogos } from "@/components/app/LandingSections";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

function useLandingStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    // Aggregate from public endpoints
    Promise.all([
      api.get("/v1/listings/?limit=1").catch(() => ({ data: { total: 0 } })),
    ]).then(([listRes]) => {
      const total = listRes.data?.total ?? listRes.data?.items?.length ?? 0;
      setStats({ listings: total, cities: 10, vendors: 20 });
    });
  }, []);
  return stats;
}

export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const stats = useLandingStats();

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="glow-brand absolute inset-0" />
        <div
          className="absolute inset-0 opacity-30 mix-blend-luminosity"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1634484675974-d3d30cdc0fc7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzdHJlZXQlMjB2ZW5kb3IlMjBjaW5lbWF0aWMlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODM4ODUxODN8MA&ixlib=rb-4.1.0&q=85)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/bizreels logo transparent.png" alt="BizReels Logo" className="h-10 w-auto object-contain" />
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-white/80 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                India-first · Reels-first · Local
              </div>
            </div>
            <LanguageToggle compact />
          </div>

          {/* Desktop: two-column hero layout */}
          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tight">
                <span className="block">{t("landing.tagline_line1")}</span>
                <span className="block text-gradient-brand">{t("landing.tagline_line2")}</span>
                <span className="block">{t("landing.tagline_line3")}</span>
              </h1>

              <p className="mt-5 text-white/70 text-base lg:text-lg leading-relaxed max-w-lg">
                {t("landing.hero_subtitle")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to={user ? "/feed" : "/login"} className="w-full sm:w-auto">
                  <Button
                    data-testid="landing-get-started-btn"
                    className="w-full sm:w-auto sm:min-w-[280px] h-14 rounded-full btn-brand text-base font-semibold border-0"
                  >
                    {t("landing.cta_primary")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                {!user && (
                  <Link to="/login" className="text-center text-sm text-white/60 hover:text-white transition-colors py-2 sm:py-4 sm:px-4" data-testid="landing-login-link">
                    {t("landing.cta_secondary")}
                  </Link>
                )}
              </div>
            </div>

            {/* Stats — shown below text on mobile, beside it on desktop */}
            {stats && stats.listings > 0 && (
              <div className="mt-8 lg:mt-0" data-testid="landing-stats">
                <div className="grid grid-cols-3 gap-2 lg:gap-4">
                  <div className="glass rounded-2xl p-3 lg:p-5 text-center">
                    <Store className="h-4 w-4 lg:h-6 lg:w-6 mx-auto text-indigo-300 mb-1" />
                    <div className="font-heading font-bold text-lg lg:text-2xl">{stats.vendors}+</div>
                    <div className="text-[10px] lg:text-xs text-white/60 uppercase tracking-wider">Vendors</div>
                  </div>
                  <div className="glass rounded-2xl p-3 lg:p-5 text-center">
                    <Users className="h-4 w-4 lg:h-6 lg:w-6 mx-auto text-violet-300 mb-1" />
                    <div className="font-heading font-bold text-lg lg:text-2xl">{stats.listings}+</div>
                    <div className="text-[10px] lg:text-xs text-white/60 uppercase tracking-wider">Live listings</div>
                  </div>
                  <div className="glass rounded-2xl p-3 lg:p-5 text-center">
                    <MapPin className="h-4 w-4 lg:h-6 lg:w-6 mx-auto text-orange-300 mb-1" />
                    <div className="font-heading font-bold text-lg lg:text-2xl">{stats.cities}</div>
                    <div className="text-[10px] lg:text-xs text-white/60 uppercase tracking-wider">Cities</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features — 3-column on desktop */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title={t("landing.features.reels_title")}
            body={t("landing.features.reels_body")}
            tone="purple"
          />
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5" />}
            title={t("landing.features.chat_title")}
            body={t("landing.features.chat_body")}
            tone="pink"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t("landing.features.trust_title")}
            body={t("landing.features.trust_body")}
            tone="orange"
          />
        </div>
      </div>

      <CategoryShowcase />
      <CityChampions />
      <Testimonials />
      <PressLogos />

      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-white/5 sm:justify-center" data-testid="landing-bottom-cta">
        <Link to={user ? "/feed" : "/feed"} className="w-full sm:w-auto">
          <Button data-testid="bottom-cta-primary" className="w-full sm:w-auto sm:min-w-[280px] h-12 rounded-full btn-brand border-0 font-semibold text-sm">
            Explore Listings <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to={user ? "/vendor/dashboard" : "/login"} className="w-full sm:w-auto">
          <Button data-testid="bottom-cta-secondary" variant="outline" className="w-full sm:w-auto sm:min-w-[280px] h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-semibold text-sm">
            Start selling in 2 minutes
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, body, tone }) {
  const toneMap = {
    purple: "text-violet-300 bg-violet-500/10 border-violet-400/20",
    pink: "text-indigo-300 bg-indigo-500/10 border-indigo-400/20",
    orange: "text-orange-300 bg-orange-500/10 border-orange-400/20",
  };
  return (
    <div className="glass rounded-2xl p-5 lg:p-6 flex items-start gap-4" data-testid={`feature-card-${tone}`}>
      <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center border ${toneMap[tone]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-semibold text-base lg:text-lg">{title}</div>
        <div className="text-sm text-white/60 mt-1 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
