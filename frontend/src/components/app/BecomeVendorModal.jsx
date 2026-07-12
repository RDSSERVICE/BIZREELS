import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function BecomeVendorModal({ open, onOpenChange, onDone }) {
  const { t } = useTranslation();
  const { updateLocalUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      const { data } = await userApi.addRole("vendor");
      updateLocalUser(data.user);
      toast.success("Vendor role added");
      onOpenChange?.(false);
      onDone?.();
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
          <DialogTitle className="font-heading text-2xl">{t("vendor.become_vendor_title")}</DialogTitle>
          <DialogDescription className="text-white/70">
            {t("vendor.become_vendor_body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button
            data-testid="become-vendor-confirm"
            onClick={confirm}
            disabled={loading}
            className="w-full h-12 rounded-full btn-brand border-0 font-semibold disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("vendor.become_vendor_confirm")}
          </Button>
          <Button
            data-testid="become-vendor-cancel"
            variant="ghost"
            onClick={() => onOpenChange?.(false)}
            className="w-full h-12 rounded-full text-white/70 hover:bg-white/5"
          >
            {t("vendor.become_vendor_cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
