import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { kycApi, mediaApi, resolveMediaUrl } from "@/lib/api";

export default function Kyc() {
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ doc_type: "aadhaar", doc_number: "", doc_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { kycApi.me().then(({ data }) => setCurrent(data)); }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await mediaApi.upload(file, "users/kyc", "image");
      setForm((f) => ({ ...f, doc_url: data.url }));
      toast.success("Uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.doc_number || !form.doc_url) return toast.error("Doc number + upload required");
    setSaving(true);
    try {
      await kycApi.submit(form);
      const { data } = await kycApi.me();
      setCurrent(data);
      toast.success("Submitted — pending admin review");
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="KYC Verification" subtitle="One-time identity check for the verified badge." />
      <div className="px-4 sm:px-6 lg:px-8 pb-24 flex-1 space-y-4">
        {current?.status && current.status !== "unverified" && (
          <div className={`glass rounded-2xl p-4 ${current.status === "approved" ? "border-green-500/30" : current.status === "rejected" ? "border-red-500/30" : "border-yellow-500/30"}`} data-testid="kyc-status">
            <div className="flex items-center gap-2 font-semibold capitalize">
              {current.status === "approved" && <BadgeCheck className="h-4 w-4 text-blue-400" />}
              KYC: {current.status}
            </div>
            {current.rejection_reason && <div className="text-xs text-white/70 mt-1">Reason: {current.rejection_reason}</div>}
            {current.doc_type && <div className="text-xs text-white/60 mt-1">Doc: {current.doc_type} · {current.doc_number}</div>}
          </div>
        )}

        {(!current?.status || current.status === "unverified" || current.status === "rejected") && (
          <div className="space-y-4">
            <Field label="Document type">
              <Select value={form.doc_type} onValueChange={(v) => setForm((f) => ({ ...f, doc_type: v }))}>
                <SelectTrigger data-testid="doc-type" className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                  <SelectItem value="aadhaar">Aadhaar</SelectItem>
                  <SelectItem value="pan">PAN</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Document number">
              <Input data-testid="doc-number" value={form.doc_number} onChange={(e) => setForm((f) => ({ ...f, doc_number: e.target.value.toUpperCase() }))} className="h-12 rounded-xl bg-white/5 border-white/10" />
            </Field>
            <Field label="Upload doc image">
              <input type="file" accept="image/*" data-testid="doc-upload" onChange={(e) => upload(e.target.files?.[0])} className="text-xs text-white/70" />
              {uploading && <div className="text-xs text-white/60 mt-1">Uploading…</div>}
              {form.doc_url && <img src={resolveMediaUrl(form.doc_url)} alt="" className="mt-2 max-h-32 rounded-lg" />}
            </Field>
            <Button data-testid="kyc-submit" onClick={submit} disabled={saving || !form.doc_number || !form.doc_url} className="w-full h-12 rounded-full btn-brand border-0 font-semibold disabled:opacity-50">
              {saving ? "…" : "Submit for review"}
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
function Field({ label, children }) {
  return <label className="block"><span className="text-xs text-white/60 uppercase tracking-wider font-semibold">{label}</span><div className="mt-1.5">{children}</div></label>;
}
