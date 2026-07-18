import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Premium Admin phone-OTP login page matching the brand's aesthetics
 */
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
    if (p.length !== 10) return toast.error("Enter a valid 10-digit mobile number");
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/otp/send", { phone: p });
      setDevOtp(data?.dev_otp || "");
      setStage("otp");
      setCooldown(30);
      toast.success("OTP sent successfully!");
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
    <div className="flex flex-col gap-6 w-full animate-scale-in">
      {/* Back button */}
      <div className="flex items-center -mb-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          data-testid="admin-back"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-brand-purple cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Site
        </button>
      </div>

      {/* Title Header */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-black tracking-tight text-brand-navy">
          Admin Portal
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Platform operations · restricted access
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {stage === "phone" && (
          <form onSubmit={sendOtp} className="flex flex-col gap-4" data-testid="admin-phone-form">
            <Input
              label="Admin Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="10-digit mobile number"
              data-testid="admin-phone-input"
            />
            <p className="text-xs text-text-tertiary">
              Only accounts with the admin role can proceed after OTP.
            </p>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              data-testid="admin-send-otp"
              className="mt-2"
            >
              Send OTP
            </Button>
          </form>
        )}

        {stage === "otp" && (
          <form onSubmit={verifyOtp} className="flex flex-col gap-4" data-testid="admin-otp-form">
            {devOtp && (
              <div
                className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-premium text-center text-xs font-semibold text-brand-navy animate-pulse"
                data-testid="admin-dev-otp-banner"
              >
                <span className="text-brand-purple font-bold">DEV MODE OTP:</span> {devOtp}
              </div>
            )}
            <Input
              label="Enter 6-Digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              data-testid="admin-otp-input"
            />
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Code sent to +91 {phone}</span>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={sendOtp}
                className="disabled:opacity-40 underline font-bold text-brand-purple hover:text-brand-orange cursor-pointer"
                data-testid="admin-resend-otp"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={otp.length !== 6}
              isLoading={loading}
              data-testid="admin-verify-otp"
              className="mt-2"
            >
              Verify & Enter Admin
            </Button>
          </form>
        )}
      </div>

      <div className="text-center pt-2">
        <Link to="/adminlogin" className="text-xs font-bold text-brand-purple hover:underline" data-testid="admin-token-login-link">
          🔑 Use Developer Token instead
        </Link>
      </div>
    </div>
  );
}
