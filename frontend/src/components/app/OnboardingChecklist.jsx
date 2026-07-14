import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { onboardingApi } from "@/lib/api";

export default function OnboardingChecklist() {
  const [state, setState] = useState(null);

  useEffect(() => {
    onboardingApi.checklist().then(({ data }) => setState(data)).catch(() => {});
  }, []);

  if (!state) return null;
  if (state.all_done && state.reward_granted) return null;  // hide once done + credited

  const pct = Math.round((state.completed / state.total) * 100);
  const stepLink = (k) => ({
    // Deep-link into the profile-complete wizard on the correct step.
    // The wizard reads ?step=<key> and jumps to it. Falls back to /profile for
    // steps that require their own dedicated page.
    profile_pic: "/profile/complete?step=photo",
    city: "/profile/complete?step=city",
    kyc: "/profile/complete?step=kyc",
    listing: "/vendor/listing/new",
    review: "/dashboard",
  }[k] || "/profile/complete");

  return (
    <div className="glass rounded-3xl p-5" data-testid="onboarding-checklist">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-heading font-bold text-lg">Complete your profile</div>
          <div className="text-xs text-white/60">Earn +{state.reward_credits} credits when done</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-bold" data-testid="checklist-progress">
            {state.completed}/{state.total}
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-brand transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {state.steps.map((s) => (
          <Link
            key={s.key}
            to={s.done ? "#" : stepLink(s.key)}
            data-testid={`checklist-step-${s.key}`}
            className={`flex items-center gap-3 p-2 -mx-2 rounded-xl transition-colors ${s.done ? "" : "hover:bg-white/5"}`}
          >
            {s.done ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-white/40 shrink-0" />
            )}
            <span className={`text-sm ${s.done ? "text-white/60 line-through" : "text-white"}`}>{s.label}</span>
          </Link>
        ))}
      </div>

      {state.all_done && !state.reward_granted && (
        <div className="mt-3 flex items-center gap-2 text-xs text-yellow-300">
          <Sparkles className="h-3 w-3" /> Bonus credits will land in your wallet shortly.
        </div>
      )}
    </div>
  );
}
