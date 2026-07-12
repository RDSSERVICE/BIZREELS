import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { referralApi } from "@/lib/api";

export default function ReferralCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    referralApi.mine().then(({ data }) => setData(data)).catch(() => {});
  }, []);

  if (!data) return null;
  const code = data.referral_code;
  const shareText = `Join Emergent using code ${code} and get ₹100 in credits! Discover trusted local vendors, chat & negotiate deals right in India. https://emergent.app`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch { toast.error("Copy failed"); }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join Emergent", text: shareText });
      } catch { /* user cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  return (
    <div className="glass rounded-3xl p-5" data-testid="referral-card">
      <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
        <Users className="h-3 w-3" /> Refer & Earn
      </div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] text-white/60 mb-0.5">Your code</div>
          <div className="font-heading text-2xl font-bold tracking-widest" data-testid="referral-code">{code}</div>
        </div>
        <div className="text-right text-xs text-white/70">
          <div><span className="font-heading font-bold text-white">{data.summary.credited}</span> credited</div>
          <div><span className="font-heading font-bold text-white">{data.summary.pending}</span> pending</div>
          <div className="text-yellow-300 mt-1">+{data.summary.credits_earned} credits earned</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={copy}
          variant="outline"
          className="rounded-full h-10 flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
          data-testid="referral-copy-btn"
        >
          <Copy className="h-4 w-4 mr-1.5" /> Copy
        </Button>
        <Button
          onClick={share}
          className="rounded-full h-10 flex-1 btn-brand border-0 font-semibold"
          data-testid="referral-share-btn"
        >
          <Share2 className="h-4 w-4 mr-1.5" /> Share
        </Button>
      </div>
      <div className="text-[10px] text-white/50 mt-2">
        You get +200 credits, they get +100, when they post their first listing or complete their first deal.
      </div>
    </div>
  );
}
