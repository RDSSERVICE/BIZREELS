import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { watchApi } from "@/lib/api";

export default function WatchListingModal({ open, onOpenChange, listingId }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = /^[6-9]\d{9}$/.test(phone);

  const submit = async () => {
    if (!valid) return toast.error("Enter a valid 10-digit mobile");
    setLoading(true);
    try {
      await watchApi.watch(listingId, phone);
      toast.success(t("watch_modal.success"));
      onOpenChange?.(false);
      setPhone("");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed";
      toast.error(typeof msg === "string" ? msg : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{t("watch_modal.title")}</DialogTitle>
          <DialogDescription className="text-white/70">{t("watch_modal.body")}</DialogDescription>
        </DialogHeader>
        <div className="mt-3 space-y-4">
          <label className="block">
            <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
              {t("watch_modal.phone_label")}
            </span>
            <div className="mt-2 flex gap-2">
              <div className="h-12 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center text-white/80">+91</div>
              <Input
                data-testid="watch-phone-input"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile"
                className="h-12 rounded-xl bg-white/5 border-white/10"
                autoFocus
              />
            </div>
          </label>
          <Button
            data-testid="watch-submit-btn"
            onClick={submit}
            disabled={!valid || loading}
            className="w-full h-12 rounded-full btn-brand border-0 font-semibold disabled:opacity-50"
          >
            {loading ? "…" : t("watch_modal.cta")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
