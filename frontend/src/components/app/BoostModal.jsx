import { useState } from "react";
import { toast } from "sonner";
import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { boostApi, paymentApi } from "@/lib/api";

const PLANS = [
  { days: 3,  credits: 300,  paise: 9900,  label: "3 days",  hint: "Try it out" },
  { days: 7,  credits: 600,  paise: 19900, label: "7 days",  hint: "Most popular", featured: true },
  { days: 14, credits: 1000, paise: 34900, label: "14 days", hint: "Best value" },
];

export function BoostButton({ listing, onBoosted, size = "default" }) {
  const [open, setOpen] = useState(false);
  const boosted = listing?.boost_expires_at && new Date(listing.boost_expires_at) > new Date();
  return (
    <>
      <Button
        size={size}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="rounded-full btn-brand border-0 font-semibold"
        data-testid={`boost-btn-${listing.id}`}
      >
        <Rocket className="h-4 w-4 mr-2" />
        {boosted ? "Extend boost" : "Boost"}
      </Button>
      <BoostModal open={open} onOpenChange={setOpen} listing={listing} onBoosted={onBoosted} />
    </>
  );
}

export function BoostModal({ open, onOpenChange, listing, onBoosted }) {
  const [selected, setSelected] = useState(7);
  const [method, setMethod] = useState("credits");
  const [saving, setSaving] = useState(false);
  const plan = PLANS.find((p) => p.days === selected);

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await boostApi.boost(listing.id, selected, method);
      if (method === "inr") {
        // Payment path: simulate dev-mode success immediately
        const paymentId = data?.payment?.payment_id;
        const isDev = data?.payment?.dev_mode;
        if (paymentId && isDev) {
          await paymentApi.simulate(paymentId);
          toast.success(`Listing boosted for ${selected} days (dev pay)`);
        } else if (paymentId) {
          toast.info("Complete payment on Razorpay to activate boost");
        }
      } else {
        toast.success(`Listing boosted for ${selected} days`);
      }
      onOpenChange?.(false);
      onBoosted?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to boost");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" /> Boost this listing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-white/60">
            Boosted listings appear at the top of Feed & Search with a "Sponsored" badge.
          </p>

          <div className="space-y-2" data-testid="boost-plans">
            {PLANS.map((p) => (
              <button
                key={p.days}
                onClick={() => setSelected(p.days)}
                data-testid={`boost-plan-${p.days}`}
                className={`w-full rounded-2xl p-4 text-left border transition-colors ${
                  selected === p.days
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-heading font-semibold text-lg">{p.label}</div>
                  {p.featured && (
                    <div className="text-[10px] uppercase tracking-widest bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">
                      {p.hint}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-sm text-white/70">
                  {p.credits.toLocaleString()} credits · or ₹{(p.paise / 100).toFixed(0)}
                </div>
              </button>
            ))}
          </div>

          <div>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Pay with</div>
            <div className="flex gap-2">
              {["credits", "inr"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  data-testid={`boost-method-${m}`}
                  className={`flex-1 rounded-full h-11 text-sm font-semibold border transition-colors ${
                    method === m
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {m === "credits" ? `${plan.credits} credits` : `₹${(plan.paise / 100).toFixed(0)}`}
                </button>
              ))}
            </div>
          </div>

          <Button
            data-testid="boost-submit"
            onClick={submit}
            disabled={saving}
            className="w-full h-12 rounded-full btn-brand border-0 font-semibold"
          >
            {saving ? "…" : `Boost for ${selected} days`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
