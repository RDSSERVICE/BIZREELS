import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <PhoneScreen>
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

        <div className="relative z-10 px-6 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-white/80 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            India-first · Reels-first · Local
          </div>

          <h1 className="font-heading mt-6 text-5xl sm:text-6xl font-bold leading-[0.95] tracking-tight">
            <span className="block">{t("landing.tagline_line1")}</span>
            <span className="block text-gradient-brand">{t("landing.tagline_line2")}</span>
            <span className="block">{t("landing.tagline_line3")}</span>
          </h1>

          <p className="mt-5 text-white/70 text-base leading-relaxed max-w-sm">
            {t("landing.hero_subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link to={user ? "/dashboard" : "/login"} className="w-full">
              <Button
                data-testid="landing-get-started-btn"
                className="w-full h-14 rounded-full btn-brand text-base font-semibold border-0"
              >
                {t("landing.cta_primary")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link to="/login" className="text-center text-sm text-white/60 hover:text-white transition-colors py-2" data-testid="landing-login-link">
                {t("landing.cta_secondary")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-16 space-y-3">
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
    </PhoneScreen>
  );
}

function FeatureCard({ icon, title, body, tone }) {
  const toneMap = {
    purple: "text-purple-300 bg-purple-500/10 border-purple-400/20",
    pink: "text-pink-300 bg-pink-500/10 border-pink-400/20",
    orange: "text-orange-300 bg-orange-500/10 border-orange-400/20",
  };
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4" data-testid={`feature-card-${tone}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneMap[tone]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-semibold text-base">{title}</div>
        <div className="text-sm text-white/60 mt-1 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
