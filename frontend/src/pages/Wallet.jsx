import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { walletApi, paymentApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("500");

  useEffect(() => {
    load();
    const s = getSocket();
    if (s) {
      const handler = (updatedWallet) => {
        setWallet(updatedWallet);
        walletApi.me().then(({ data }) => setTxns(data.transactions || [])).catch(() => {});
      };
      s.on("wallet:updated", handler);
      return () => {
        s.off("wallet:updated", handler);
      };
    }
  }, []);
  async function load() {
    setLoading(true);
    try {
      const { data } = await walletApi.me();
      setWallet(data.wallet); setTxns(data.transactions || []);
    } finally { setLoading(false); }
  }

  const topup = async () => {
    const paise = Number(amount) * 100;
    if (!paise || paise < 100) return toast.error("Min ₹1");
    try {
      const { data } = await walletApi.topup(paise);
      if (data.dev_mode) {
        await paymentApi.simulate(data.payment_id);
        toast.success(`₹${amount} added (dev mode)`);
      } else {
        toast.info("Redirect to Razorpay checkout (real mode not configured)");
      }
      setOpen(false); load();
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Wallet" subtitle="Credits + INR balance." />
      <div className="px-6 pb-24 flex-1 space-y-4">
        {loading ? (
          <div className="h-32 rounded-2xl bg-white/5 animate-pulse" data-testid="wallet-loading" />
        ) : (
          <>
            <div className="glass rounded-3xl p-5 relative overflow-hidden" data-testid="wallet-summary">
              <div className="glow-brand absolute inset-0 opacity-40" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs text-white/70"><WalletIcon className="h-3.5 w-3.5" /> Balance</div>
                <div className="mt-1 font-heading text-3xl font-bold" data-testid="wallet-inr">₹{(wallet.balance_inr_paise / 100).toLocaleString("en-IN")}</div>
                <div className="mt-2 text-xs text-white/70" data-testid="wallet-credits">{wallet.credits} credits</div>
                <Button data-testid="topup-btn" onClick={() => setOpen(true)} className="mt-4 rounded-full btn-brand border-0"><Plus className="h-4 w-4 mr-1" />Add Money</Button>
              </div>
            </div>

            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Recent activity</div>
              {txns.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-white/60 text-sm" data-testid="txns-empty">Nothing yet.</div>
              ) : (
                <div className="space-y-2" data-testid="txns-list">
                  {txns.map((t) => (
                    <div key={t.id} className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${t.type.includes("earn") || t.type === "deposit" ? "bg-green-500/20 text-green-300" : "bg-pink-500/20 text-pink-300"}`}>
                        {t.type.includes("earn") || t.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{t.reason || t.type}</div>
                        <div className="text-[10px] text-white/50">{t.bucket === "credits" ? `${t.amount} credits` : `₹${(t.amount / 100).toFixed(2)}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Add money</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input data-testid="topup-amount-input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="Amount in ₹" className="h-12 rounded-xl bg-white/5 border-white/10" />
            <Button data-testid="topup-submit" onClick={topup} className="w-full h-12 rounded-full btn-brand border-0 font-semibold">Add ₹{amount}</Button>
            <p className="text-[10px] text-white/50 text-center">Dev mode: payment auto-simulated. Real Razorpay checkout on live keys.</p>
          </div>
        </DialogContent>
      </Dialog>
    </PhoneScreen>
  );
}
