/**
 * Identity Verification page (CHANGE 3 — Phase 7e).
 * 4 cards: Aadhaar / PAN / GST / Bank. Each opens a modal with type-specific form.
 * Dev mode auto-approves on submit; production waits on admin manual review.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Upload, ArrowLeft, IndianRupee, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";

const DOC_META = {
  aadhaar: { label: "Aadhaar", subtitle: "12-digit UIDAI ID", format: "e.g. 1234 5678 9012" },
  pan:     { label: "PAN Card", subtitle: "Permanent Account Number", format: "e.g. ABCDE1234F" },
  gst:     { label: "GST", subtitle: "For registered vendors", format: "15-char GSTIN" },
  bank:    { label: "Bank Account", subtitle: "For payouts + penny-drop", format: "Account + IFSC + holder name" },
};

function StatusBadge({ status }) {
  if (status === "approved")
    return <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>;
  if (status === "pending")
    return <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
  if (status === "rejected")
    return <span className="text-[10px] font-semibold text-red-300 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
  return <span className="text-[10px] font-semibold text-white/40">Not submitted</span>;
}

export default function KycVerify() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [openType, setOpenType] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/v1/kyc/me/status");
      setSummary(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <button onClick={() => navigate(-1)} data-testid="kyc-back" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
      <ScreenHeader title="Identity Verification" subtitle="Verify at least one to unlock offers & orders" />

      {summary?.has_verified_identity && (
        <div className="mx-6 mb-4 glass rounded-2xl p-3 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2 text-xs text-emerald-200" data-testid="kyc-verified-banner">
          <ShieldCheck className="h-4 w-4" />
          <span>You're verified — order requests & offers unlocked.</span>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 pb-24 space-y-3" data-testid="kyc-cards">
        {loading && <div className="text-center text-white/50 text-sm py-6"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>}
        {Object.keys(DOC_META).map((t) => {
          const meta = DOC_META[t];
          const doc = summary?.docs?.[t];
          const status = doc?.status;
          return (
            <button
              key={t}
              onClick={() => setOpenType(t)}
              data-testid={`kyc-card-${t}`}
              className={`w-full glass rounded-2xl p-4 flex items-center gap-3 text-left transition-colors border ${
                status === "approved" ? "border-emerald-500/40 bg-emerald-500/5" :
                status === "pending" ? "border-amber-500/30 bg-amber-500/5" :
                status === "rejected" ? "border-red-500/30 bg-red-500/5" :
                "border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                {t === "bank" ? <IndianRupee className="h-5 w-5 text-emerald-300" /> : <ShieldCheck className="h-5 w-5 text-white/70" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-heading font-semibold">{meta.label}</div>
                  <StatusBadge status={status} />
                </div>
                <div className="text-[11px] text-white/50 truncate">{meta.subtitle}</div>
                {doc?.doc_number_masked && (
                  <div className="text-[10px] text-white/40 mt-0.5">Number: {doc.doc_number_masked}</div>
                )}
              </div>
              <div className="text-[10px] text-white/40">{status === "approved" ? "Update" : "Submit"}</div>
            </button>
          );
        })}
      </div>

      {openType && (
        <DocDialog
          type={openType}
          existing={summary?.docs?.[openType]}
          onClose={() => setOpenType(null)}
          onSaved={() => { setOpenType(null); load(); }}
        />
      )}
    </div>
  );
}

function DocDialog({ type, existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    number: "", ifsc: "", account: "", holder: "", bank_name: "", doc_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const label = DOC_META[type].label;

  const submit = async () => {
    if (!form.doc_url) return toast.error("Please attach a document URL");
    setSaving(true);
    try {
      let payload, url;
      if (type === "aadhaar") {
        if (!/^\d{12}$/.test(form.number)) return toast.error("Aadhaar must be 12 digits");
        url = "/v1/kyc/aadhaar/verify";
        payload = { aadhaar_number: form.number, doc_url: form.doc_url };
      } else if (type === "pan") {
        if (!/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(form.number)) return toast.error("Invalid PAN format");
        url = "/v1/kyc/pan/verify";
        payload = { pan_number: form.number.toUpperCase(), doc_url: form.doc_url };
      } else if (type === "gst") {
        if (form.number.length !== 15) return toast.error("GST must be 15 characters");
        url = "/v1/kyc/gst/verify";
        payload = { gst_number: form.number.toUpperCase(), doc_url: form.doc_url };
      } else if (type === "bank") {
        if (form.account.length < 6) return toast.error("Enter a valid account number");
        if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.ifsc)) return toast.error("Invalid IFSC");
        if (!form.holder) return toast.error("Holder name required");
        url = "/v1/kyc/bank/verify";
        payload = {
          account_number: form.account, ifsc: form.ifsc.toUpperCase(),
          holder_name: form.holder, bank_name: form.bank_name || undefined,
          doc_url: form.doc_url,
        };
      }
      const { data } = await api.post(url, payload);
      toast.success(`${label} ${data.status === "approved" ? "verified" : "submitted"}`);
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing?.id) return;
    setDeleting(true);
    try {
      await api.delete(`/v1/kyc/docs/${existing.id}`);
      toast.success("Removed");
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Verify {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {type === "bank" ? (
            <>
              <Input placeholder="Account number" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value.replace(/\D/g, "") })} className="h-12 rounded-xl bg-white/5 border-white/10" data-testid="bank-account-input" />
              <Input placeholder="IFSC (e.g. HDFC0000123)" value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} maxLength={11} className="h-12 rounded-xl bg-white/5 border-white/10 uppercase" data-testid="bank-ifsc-input" />
              <Input placeholder="Account holder name" value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" data-testid="bank-holder-input" />
              <Input placeholder="Bank name (optional)" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" data-testid="bank-name-input" />
            </>
          ) : (
            <Input
              placeholder={DOC_META[type].format}
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              maxLength={type === "aadhaar" ? 12 : type === "gst" ? 15 : 10}
              className="h-12 rounded-xl bg-white/5 border-white/10"
              data-testid={`${type}-number-input`}
            />
          )}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1 mb-1">
              <Upload className="h-3 w-3" /> Document URL
            </label>
            <Input
              placeholder="Paste image / PDF URL"
              value={form.doc_url}
              onChange={(e) => setForm({ ...form, doc_url: e.target.value })}
              className="h-12 rounded-xl bg-white/5 border-white/10"
              data-testid={`${type}-doc-url-input`}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {existing && existing.status !== "approved" && (
            <Button
              variant="outline"
              onClick={remove}
              disabled={deleting}
              className="bg-white/5 border-red-500/30 text-red-300 hover:bg-red-500/10"
              data-testid={`${type}-delete-btn`}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className="flex-1 bg-white/5 border-white/10">Cancel</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 btn-brand" data-testid={`${type}-submit-btn`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
