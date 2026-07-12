import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { authApi } from "@/lib/api";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[6-9]\d{9}$/.test(phone);

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
    <PhoneScreen>
      <div className="relative">
        <div className="glow-brand absolute inset-0 opacity-60" />
        <div className="relative">
          <div className="px-6 pt-8">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="login-back-link">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Link>
          </div>
          <ScreenHeader
            title={t("auth.login_title")}
            subtitle={t("auth.login_subtitle")}
          />

          <form onSubmit={handleSend} className="px-6 pt-4 pb-10 space-y-5">
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
              By continuing you agree to Emergent's Terms & Privacy. We'll only use your number to secure your account and connect you with vendors.
            </p>
          </form>
        </div>
      </div>
    </PhoneScreen>
  );
}
