import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Dev-mode token as a helpful placeholder so the user can 1-click login on demo.
// ⚠️ REMOVE FOR PRODUCTION — dev-only convenience.
const DEV_TOKEN_HINT =
  "bpb7GbNwdH924677L_QfV0nzAxXfNxpQYscX453c35sXhUvgV_Zr8hchw-Mm-nQ8";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { applyAuthResponse } = useAuth();
  const [token, setToken] = useState(params.get("token") || "");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e?.preventDefault?.();
    const t = (token || DEV_TOKEN_HINT).trim();
    if (!t) return toast.error("Enter admin token");
    setLoading(true);
    try {
      const { data } = await api.post("/v1/auth/dev/admin-login", { token: t });
      applyAuthResponse(data);
      toast.success("Signed in as Admin");
      navigate("/admin", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invalid admin token");
    } finally {
      setLoading(false);
    }
  };

  // Magic-link: if ?token=... is present, auto-submit once on mount.
  useEffect(() => {
    const urlToken = params.get("token");
    if (urlToken && urlToken.trim()) {
      // Fire and forget — errors surface via toast in login()
      (async () => {
        setLoading(true);
        try {
          const { data } = await api.post("/v1/auth/dev/admin-login", { token: urlToken.trim() });
          applyAuthResponse(data);
          toast.success("Signed in as Admin");
          navigate("/admin", { replace: true });
        } catch (err) {
          toast.error(err?.response?.data?.detail || "Invalid admin token");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    const el = document.getElementById("admin-token-input");
    if (el) el.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PhoneScreen>
      <ScreenHeader title="Admin Login" subtitle="Dev-mode override" />
      <form onSubmit={login} className="px-6 pt-4 pb-10 space-y-5" data-testid="admin-login-form">
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-amber-400/20 bg-amber-400/5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-white/80">
            <div className="font-heading font-semibold text-sm text-amber-200">Dev mode only</div>
            This one-click admin login MUST be disabled before production. Token is stored in{" "}
            <code className="text-[10px] bg-white/10 px-1 py-0.5 rounded">/app/memory/admin_phone.txt</code>.
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">Admin token</span>
          <div className="mt-2 flex items-stretch gap-2">
            <div className="h-14 min-w-[52px] px-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-white/50" />
            </div>
            <input
              id="admin-token-input"
              data-testid="admin-token-input"
              type="text"
              spellCheck={false}
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={DEV_TOKEN_HINT}
              className="flex-1 h-14 rounded-xl bg-white/5 border border-white/10 px-3 text-sm font-mono text-white outline-none focus:border-emerald-500"
            />
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Leave blank to use the placeholder (dev-mode only).
          </p>
        </label>

        <Button
          type="submit"
          disabled={loading}
          data-testid="admin-login-submit"
          className="w-full h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:opacity-90 text-white text-base font-semibold border-0 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Login as Admin
        </Button>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-white/50 hover:text-white/80" data-testid="admin-login-back">
            ← Back to normal login
          </Link>
        </div>
      </form>
    </PhoneScreen>
  );
}
