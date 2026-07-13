import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PhoneScreen } from "@/components/app/PhoneScreen";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// This component is landed after auth.emergentagent.com redirects the user back
// with `#session_id=<one-shot-id>`. We POST it to our backend, which upserts
// the user and issues our own JWT + refresh (matching the OTP flow).
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyAuthResponse } = useAuth();
  // useRef (not useState) → set synchronously to survive React StrictMode double-mount.
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const raw = (location.hash || window.location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(raw);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setError("Missing session id in callback URL");
      return;
    }

    (async () => {
      try {
        const { data } = await authApi.googleSessionExchange(sessionId);
        // Clean the URL fragment so refreshes don't re-trigger
        window.history.replaceState(null, "", window.location.pathname);
        // Persist tokens exactly like the OTP flow
        applyAuthResponse(data);
        toast.success(data.is_new_user ? "Welcome to Emergent!" : "Signed in");
        // New Google users → onboarding (role picker); existing → feed
        navigate(data.is_new_user ? "/onboarding" : "/feed", { replace: true });
      } catch (e) {
        const detail = e?.response?.data?.detail || "Sign-in failed. Please try again.";
        setError(typeof detail === "string" ? detail : "Sign-in failed");
        toast.error(typeof detail === "string" ? detail : "Sign-in failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PhoneScreen>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        {error ? (
          <div className="space-y-4" data-testid="auth-callback-error">
            <div className="text-lg font-heading font-semibold text-red-400">Sign-in failed</div>
            <p className="text-sm text-white/70 max-w-sm">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-pink-400 underline underline-offset-4"
              data-testid="auth-callback-retry"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="auth-callback-loading">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-400" />
            <div className="text-lg font-heading font-semibold">Signing you in…</div>
            <p className="text-xs text-white/60">Verifying your Google session</p>
          </div>
        )}
      </div>
    </PhoneScreen>
  );
}
