import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import DevOtpBanner from "@/components/app/DevOtpBanner";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VerifyOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { applyAuthResponse } = useAuth();

  const phone = location.state?.phone || "";
  const initialDevOtp = location.state?.dev_otp || "";

  const [otp, setOtp] = useState(initialDevOtp || "");
  const [devOtp, setDevOtp] = useState(initialDevOtp || "");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (!phone) navigate("/login", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ phone, otp });
      applyAuthResponse(data);
      toast.success("Signed in");
      // Route based on whether user has a name (onboarded)
      if (!data.user?.name) navigate("/onboarding", { replace: true });
      else navigate("/feed", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Invalid or expired OTP";
      toast.error(typeof msg === "string" ? msg : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      const { data } = await authApi.sendOtp(phone);
      setResendIn(30);
      setDevOtp(data.dev_otp || "");
      if (data.dev_otp) setOtp(data.dev_otp);
      toast.success("New OTP sent");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to resend";
      toast.error(typeof msg === "string" ? msg : "Failed to resend");
    }
  };

  return (
    <PhoneScreen>
      <div className="px-6 pt-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="verify-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("auth.change_number")}
        </Link>
      </div>
      <ScreenHeader
        title={t("auth.verify_title")}
        subtitle={t("auth.verify_subtitle", { phone })}
      />

      <DevOtpBanner otp={devOtp} />

      <form onSubmit={handleVerify} className="px-6 pt-2 pb-10 space-y-6">
        <div className="flex justify-center">
          <InputOTP
            data-testid="otp-input"
            maxLength={6}
            value={otp}
            onChange={setOtp}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-14 w-11 first:rounded-l-xl last:rounded-r-xl rounded-none border-white/10 bg-white/5 text-lg font-heading font-semibold text-white data-[active=true]:ring-pink-500"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          data-testid="verify-otp-btn"
          disabled={loading || otp.length !== 6}
          className="w-full h-14 rounded-full btn-brand text-base font-semibold border-0 disabled:opacity-50"
        >
          {loading ? t("auth.verifying") : t("auth.verify_cta")}
        </Button>

        <div className="text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-white/50" data-testid="resend-timer">
              {t("auth.resend_in", { seconds: resendIn })}
            </span>
          ) : (
            <button
              type="button"
              data-testid="resend-otp-btn"
              onClick={handleResend}
              className="text-pink-400 hover:text-pink-300 font-semibold"
            >
              {t("auth.resend")}
            </button>
          )}
        </div>
      </form>
    </PhoneScreen>
  );
}
