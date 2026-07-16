/**
 * Admin phone-OTP login (CHANGE 1 — Phase 7e).
 *
 * This is now the CANONICAL admin entry point at `/admin`. Uses the exact same
 * MSG91 OTP flow as the user login (`POST /v1/auth/otp/send` + `/otp/verify`),
 * with a post-verify guard: the returned user MUST have "admin" in roles[].
 * If not, we discard tokens and show a 403-style message.
 *
 * The regular `/login` page has no admin option; admins land on their default
 * (customer) panel there and must visit `/admin` for the admin dashboard.
 *
 * The legacy dev-token magic-link route `/admin/login` (SEC-001-gated, env
 * ALLOW_DEV_ADMIN_LOGIN) is kept as an internal fallback for demos.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Phone, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminOtpLogin() {
  const navigate = useNavigate();
  const { applyAuthResponse, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("phone"); // phone | otp
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // If already an admin, jump straight to the dashboard.
  useEffect(() => {
    if (user && (user.roles || []).includes("admin")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Cooldown ticker for Resend OTP.
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const sendOtp = async (e) => {
    e?.preventDefault?.();
    const p = (phone || "").replace(/\D/g, "");
    if (p.length !== 10) return toast.error("Enter a valid 10-digit mobile");
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/otp/send", { phone: p });
      setDevOtp(data?.dev_otp || "");
      setStage("otp");
      setCooldown(30);
      toast.success("OTP sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    const p = (phone || "").replace(/\D/g, "");
    const code = (otp || "").replace(/\D/g, "");
    if (code.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/otp/verify", { phone: p, otp: code });
      const roles = data?.user?.roles || [];
      if (!roles.includes("admin")) {
        toast.error("This mobile is not an admin account.");
        setLoading(false);
        return;
      }
      // Prefer admin as current_role so the panel loads with admin scope.
      try { await api.post("/v1/users/me/switch-role", { role: "admin" }); } catch (_e) { /* ignore */ }
      applyAuthResponse({ ...data, user: { ...data.user, current_role: "admin" } });
      toast.success("Signed in as Admin");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "OTP verify failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          data-testid="admin-back"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Emerald/gold themed admin header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="glass rounded-2xl p-5 border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="font-heading text-lg font-bold text-emerald-200">Admin Portal</div>
              <div className="text-[11px] text-white/50">Platform operations · restricted access</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        {stage === "phone" && (
          <form onSubmit={sendOtp} className="space-y-4" data-testid="admin-phone-form">
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Admin mobile number</label>
              <div className="mt-2 flex items-stretch gap-2">
                <div className="h-14 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-white/60">+91</div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                  <Input
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="10-digit admin mobile"
                    className="h-14 rounded-xl bg-white/5 border-white/10 pl-9"
                    data-testid="admin-phone-input"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-white/40">Only accounts with the admin role can proceed after OTP.</p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="admin-send-otp"
              className="w-full h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:opacity-90 text-white text-base font-semibold border-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              Send OTP
            </Button>
          </form>
        )}

        {stage === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4" data-testid="admin-otp-form">
            {devOtp && (
              <div
                className="glass rounded-xl px-3 py-2 border border-blue-400/30 bg-blue-500/10 text-blue-200 text-xs"
                data-testid="admin-dev-otp-banner"
              >
                <span className="font-heading font-semibold">DEV MODE OTP:</span> {devOtp}
              </div>
            )}
            <div>
              <label className="text-xs text-white/60 uppercase tracking-wider font-semibold">Enter 6-digit OTP</label>
              <Input
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="6-digit code"
                maxLength={6}
                className="mt-2 h-14 rounded-xl bg-white/5 border-white/10 text-lg tracking-widest text-center"
                data-testid="admin-otp-input"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                <span>Code sent to +91 {phone}</span>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={sendOtp}
                  className="disabled:opacity-40 underline"
                  data-testid="admin-resend-otp"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              data-testid="admin-verify-otp"
              className="w-full h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:opacity-90 text-white text-base font-semibold border-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              Verify & Enter Admin
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
