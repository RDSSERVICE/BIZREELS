import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Sparkles } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { subApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const PLANS = [
  { key: "verified_monthly", title: "Monthly", price: 99, per: "/mo", desc: "Cancel anytime." },
  { key: "verified_yearly", title: "Yearly", price: 499, per: "/yr", desc: "Best value · save ₹689." },
];

export default function Subscriptions() {
  const { user, refreshMe } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); try { const { data } = await subApi.mine(); setSubs(data.items || []); } finally { setLoading(false); } }

  const subscribe = async (plan) => {
    setBusy(plan);
    try {
      const { data } = await subApi.subscribe(plan);
      if (data.dev_mode) {
        await paymentApi.simulate(data.payment_id);
        toast.success("Subscription active");
      } else {
        toast.info("Real Razorpay checkout not configured");
      }
      await load(); await refreshMe();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
    finally { setBusy(""); }
  };

  const active = subs.find((s) => s.status === "active");

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Verified Badge" subtitle="Stand out with a blue tick." />
      <div className="px-6 pb-24 flex-1 space-y-4">
        {active && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3 border-blue-400/30" data-testid="active-sub">
            <BadgeCheck className="h-6 w-6 text-blue-400" />
            <div className="flex-1"><div className="font-semibold">{active.plan.replace("_", " ")} active</div><div className="text-xs text-white/60">Until {new Date(active.expires_at).toLocaleDateString()}</div></div>
          </div>
        )}
        {user?.kyc_status !== "approved" && (
          <div className="glass rounded-2xl p-4 text-sm text-yellow-200 border-yellow-500/30" data-testid="kyc-note">
            Badge shows only after KYC is approved. Complete KYC → then subscribe.
          </div>
        )}
        {loading ? <div className="h-40 rounded-2xl bg-white/5 animate-pulse" /> : (
          <div className="space-y-3" data-testid="plans">
            {PLANS.map((p) => (
              <div key={p.key} className="glass rounded-2xl p-5" data-testid={`plan-${p.key}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-heading text-lg font-bold">{p.title} · ₹{p.price}<span className="text-xs text-white/60">{p.per}</span></div>
                    <div className="text-xs text-white/60 mt-1">{p.desc}</div>
                  </div>
                  <Sparkles className="h-4 w-4 text-pink-300" />
                </div>
                <Button data-testid={`subscribe-${p.key}`} disabled={busy === p.key} onClick={() => subscribe(p.key)} className="mt-4 w-full h-12 rounded-full btn-brand border-0 font-semibold disabled:opacity-50">
                  {busy === p.key ? "…" : `Subscribe ₹${p.price}`}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
