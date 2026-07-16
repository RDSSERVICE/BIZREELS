import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScreenHeader from "@/components/app/ScreenHeader";
import { authApi } from "@/lib/api";

// Google G-logo (multi-colour SVG, per Google brand guidelines)
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.bizreelsagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      toast.success("OTP sent");
      navigate("/verify-otp", { state: { phone, dev_otp: data.dev_otp } });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to send OTP. Please try again.";
      toast.error(typeof msg === "string" ? msg : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="relative min-h-screen flex items-start justify-center">
        <div className="glow-brand absolute inset-0 opacity-60" />
        <div className="relative w-full max-w-md mx-auto">
          <div className="px-4 sm:px-6 pt-8 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="login-back-link">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Link>
            <img src="/bizreels logo transparent.png" alt="BizReels Logo" className="h-8 w-auto object-contain" />
          </div>
          <ScreenHeader
            title={t("auth.login_title")}
            subtitle={t("auth.login_subtitle")}
          />

          <div className="px-4 sm:px-6 pt-4 pb-2">
            <button
              type="button"
              onClick={handleGoogle}
              data-testid="google-signin-btn"
              className="w-full h-14 rounded-full bg-white hover:bg-white/90 text-neutral-900 font-semibold flex items-center justify-center gap-3 shadow-lg transition-all"
            >
              <GoogleGlyph />
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 mt-6" aria-hidden="true">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">
                or continue with phone
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>

          <form onSubmit={handleSend} className="px-4 sm:px-6 pt-4 pb-10 space-y-5">
            <label className="block">
              <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
                {t("auth.phone_label")}
              </span>
              <div className="mt-2 flex items-stretch gap-2">
                <div className="h-14 min-w-[64px] px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/80 font-medium">
                  <Phone className="h-4 w-4 text-white/50" />
                  <span>+91</span>
                </div>
                <Input
                  data-testid="phone-input"
                  inputMode="numeric"
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder={t("auth.phone_placeholder")}
                  className="h-14 rounded-xl bg-white/5 border-white/10 text-base tracking-wide placeholder:text-white/30 focus-visible:ring-pink-500 focus-visible:border-pink-500"
                />
              </div>
              {phone && !isValid && (
                <p className="mt-2 text-xs text-red-400">Must start with 6-9 and be 10 digits.</p>
              )}
            </label>

            <Button
              type="submit"
              data-testid="send-otp-btn"
              disabled={!isValid || loading}
              className="w-full h-14 rounded-full btn-brand text-base font-semibold border-0 disabled:opacity-50"
            >
              {loading ? t("auth.sending_otp") : t("auth.send_otp")}
            </Button>

            <p className="text-[11px] text-white/40 leading-relaxed">
              By continuing you agree to BizReels's Terms & Privacy. We'll only use your info to secure your account and connect you with vendors.
            </p>

            <div className="text-center pt-2">
              <Link to="/admin/login" className="text-[11px] text-white/40 hover:text-white/70" data-testid="admin-login-link">
                🔑 Admin? <span className="underline underline-offset-2">Login here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
