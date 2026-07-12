import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requirementApi, categoryApi } from "@/lib/api";

export default function RequirementNew() {
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", category_id: "",
    budget_min: "", budget_max: "", urgency: "flexible",
    area: "", city: "", state: "", pincode: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { categoryApi.list({ top_level: true }).then(({ data }) => setCats(data.items || [])); }, []);
  const patch = (u) => setForm((f) => ({ ...f, ...u }));

  const submit = async () => {
    if (!form.title || form.title.length < 3) return toast.error("Title too short");
    if (!form.category_id) return toast.error("Pick a category");
    if (!form.area || !form.city || !form.pincode) return toast.error("Area, city and pincode are required");
    setSaving(true);
    try {
      const { data } = await requirementApi.create({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        category_id: form.category_id,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        urgency: form.urgency,
        location: { area: form.area, city: form.city, state: form.state || undefined, pincode: form.pincode },
      });
      toast.success("Requirement posted");
      navigate(`/requirements/${data.id}`, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <PhoneScreen>
      <div className="px-6 pt-8">
        <button onClick={() => navigate(-1)} data-testid="req-form-back" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
      <ScreenHeader title="Post a Requirement" subtitle="Tell vendors what you need — proposals come to you." />

      <div className="px-6 pb-24 space-y-4">
        <Field label="What do you need?">
          <Input data-testid="req-title-input" value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Need a plumber for kitchen tap" maxLength={120} className="h-12 rounded-xl bg-white/5 border-white/10" />
        </Field>
        <Field label="Details (optional)">
          <Textarea data-testid="req-desc-input" value={form.description} onChange={(e) => patch({ description: e.target.value })} className="rounded-xl bg-white/5 border-white/10 min-h-20" />
        </Field>
        <Field label="Category">
          <Select value={form.category_id} onValueChange={(v) => patch({ category_id: v })}>
            <SelectTrigger data-testid="req-cat-trigger" className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Pick a category" /></SelectTrigger>
            <SelectContent className="bg-neutral-900 border-white/10 text-white">
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon_url} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget min ₹"><Input data-testid="req-min-input" inputMode="numeric" value={form.budget_min} onChange={(e) => patch({ budget_min: e.target.value.replace(/\D/g, "") })} className="h-12 rounded-xl bg-white/5 border-white/10" /></Field>
          <Field label="Budget max ₹"><Input data-testid="req-max-input" inputMode="numeric" value={form.budget_max} onChange={(e) => patch({ budget_max: e.target.value.replace(/\D/g, "") })} className="h-12 rounded-xl bg-white/5 border-white/10" /></Field>
        </div>
        <Field label="Urgency">
          <Select value={form.urgency} onValueChange={(v) => patch({ urgency: v })}>
            <SelectTrigger data-testid="req-urgency-trigger" className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-neutral-900 border-white/10 text-white">
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Area / Locality"><Input data-testid="req-area-input" value={form.area} onChange={(e) => patch({ area: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City"><Input data-testid="req-city-input" value={form.city} onChange={(e) => patch({ city: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" /></Field>
          <Field label="Pincode"><Input data-testid="req-pin-input" inputMode="numeric" value={form.pincode} onChange={(e) => patch({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="h-12 rounded-xl bg-white/5 border-white/10" /></Field>
        </div>

        <Button data-testid="req-submit-btn" onClick={submit} disabled={saving} className="w-full h-14 rounded-full btn-brand border-0 font-semibold disabled:opacity-50">
          {saving ? "…" : "Post requirement"}
        </Button>
      </div>
    </PhoneScreen>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
