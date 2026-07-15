import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, MapPin, Package, ShoppingBag, Wrench, Sparkles, Loader2 } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import MediaUploader from "@/components/app/MediaUploader";
import { categoryApi, listingApi, aiApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import BecomeVendorModal from "@/components/app/BecomeVendorModal";

const DRAFT_KEY = "emergent_listing_draft";
const STEPS = ["type", "category", "details", "media", "location", "review"];
const TYPE_META = [
  { key: "new_product", icon: Package },
  { key: "old_product", icon: ShoppingBag },
  { key: "service", icon: Wrench },
];
const CONDITION_OPTS = ["new", "like_new", "good", "fair"];
const CHARGES_OPTS = ["fixed", "hourly", "per_visit"];

const emptyForm = {
  type: "new_product",
  title: "",
  description: "",
  category_id: "",
  sub_category_id: "",
  price: "",
  offer_price: "",
  is_negotiable: false,
  bulk_price: "",
  stock: "",
  condition: "",
  warranty: "",
  service_charges_type: "",
  experience_years: "",
  service_area_km: "",
  images: [],
  reel: null,
  location: { area: "", city: "", state: "", pincode: "", address: "", lat: null, lng: null },
  tags: "",
};

export default function ListingForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams(); // if present, edit mode
  const isEdit = Boolean(id);
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [topCats, setTopCats] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [showBecomeVendor, setShowBecomeVendor] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const [aiPriceHint, setAiPriceHint] = useState(null);
  // Phase 7d — Gemini smart features
  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiTitleOptions, setAiTitleOptions] = useState([]);
  const [aiCatLoading, setAiCatLoading] = useState(false);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState(null);
  const draftTimer = useRef(null);

  // Load categories
  useEffect(() => {
    categoryApi.list({ tree: true }).then(({ data }) => setTopCats(data.items || []));
  }, []);

  // If editing, hydrate; else restore draft
  useEffect(() => {
    if (isEdit) {
      listingApi.list({ vendor_id: user?.id, limit: 50 }).then(({ data }) => {
        const found = (data.items || []).find((x) => x.id === id);
        if (found) {
          setForm({
            ...emptyForm,
            ...found,
            price: String(found.price ?? ""),
            offer_price: found.offer_price != null ? String(found.offer_price) : "",
            bulk_price: found.bulk_price != null ? String(found.bulk_price) : "",
            stock: found.stock != null ? String(found.stock) : "",
            experience_years: found.experience_years != null ? String(found.experience_years) : "",
            service_area_km: found.service_area_km != null ? String(found.service_area_km) : "",
            tags: (found.tags || []).join(", "),
            location: { ...emptyForm.location, ...(found.location || {}) },
          });
        }
      });
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setForm(JSON.parse(raw));
      } catch {}
    }
  }, [id, isEdit, user?.id]);

  // Sub-cats when category picked
  useEffect(() => {
    const parent = topCats.find((c) => c.id === form.category_id);
    setSubCats(parent?.children || []);
  }, [form.category_id, topCats]);

  // Draft auto-save (debounced) — new listings only
  useEffect(() => {
    if (isEdit) return;
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
    }, 500);
    return () => clearTimeout(draftTimer.current);
  }, [form, isEdit]);

  const patch = (u) => setForm((f) => ({ ...f, ...u }));
  const patchLoc = (u) => setForm((f) => ({ ...f, location: { ...f.location, ...u } }));

  const validateStep = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return !!form.category_id;
    if (step === 2) {
      if (!form.title || form.title.length < 3) return toast.error("Title too short") && false;
      if (!Number(form.price) || Number(form.price) <= 0) return toast.error("Enter a valid price") && false;
      if (form.offer_price && Number(form.offer_price) >= Number(form.price)) return toast.error("Offer price must be less than price") && false;
      if (form.type === "new_product" && (form.stock === "" || Number(form.stock) < 0)) return toast.error("Stock required") && false;
      if (form.type === "old_product" && !form.condition) return toast.error("Condition required") && false;
      if (form.type === "service" && !form.service_charges_type) return toast.error("Charges type required") && false;
      return true;
    }
    if (step === 4) {
      if (!form.location.area || !form.location.city || !form.location.pincode) {
        toast.error("Area, city and pincode are required");
        return false;
      }
      return true;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patchLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Could not get location. Please enter manually."),
      { timeout: 8000 }
    );
  };

  // ---- AI autofill ----
  const runAiAutofill = async () => {
    if (!form.title || form.title.trim().length < 3) {
      toast.error("Enter a title first (≥3 chars)");
      return;
    }
    if (!form.category_id) {
      toast.error("Pick a category first");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await aiApi.generate({
        title: form.title.trim(),
        type: form.type,
        category_id: form.category_id,
        sub_category_id: form.sub_category_id || undefined,
        hints: form.description?.trim() || undefined,
      });
      const g = data?.generated || {};
      const overwriteDesc = !form.description || form.description.length < 40;
      patch({
        description: overwriteDesc ? (g.description || form.description) : form.description,
        short_description: g.short_description || form.short_description,
        tags: (g.tags && g.tags.length) ? g.tags.join(", ") : form.tags,
        features: (g.features && g.features.length) ? g.features : form.features,
        variants: (g.variants && g.variants.length) ? g.variants : form.variants,
        warranty: form.type === "new_product" && !form.warranty ? (g.warranty_suggestion || "") : form.warranty,
      });
      setAiPriceHint(g.suggested_price_range_inr || null);
      if (data?.ok === false) {
        toast.error(`AI unavailable: ${data.error?.slice(0, 80) || "unknown error"}`);
      } else {
        toast.success(`AI filled ${[
          overwriteDesc && g.description ? "description" : null,
          g.short_description ? "short desc" : null,
          g.tags?.length ? "tags" : null,
          g.features?.length ? "features" : null,
          g.variants?.length ? "variants" : null,
        ].filter(Boolean).length} fields`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const runAiImprove = async (tone = "friendly") => {
    if (!form.description || form.description.trim().length < 20) {
      toast.error("Write something to improve first");
      return;
    }
    setAiImproving(true);
    try {
      const { data } = await aiApi.improve({
        title: form.title || "Listing",
        current_description: form.description,
        tone,
      });
      if (data?.ok && data.description) {
        patch({ description: data.description });
        toast.success(`Rewritten in ${tone} tone`);
      } else {
        toast.error(`Improve failed: ${data?.error?.slice(0, 80) || "unknown"}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI improve failed");
    } finally {
      setAiImproving(false);
    }
  };

  // ---- Phase 7d: Gemini smart features ----
  const runAiTitle = async () => {
    if (!form.description && (form.images?.length || 0) === 0) {
      toast.error("Add some description or images first");
      return;
    }
    setAiTitleLoading(true);
    try {
      const { data } = await aiApi.title({
        listing_type: form.type,
        description: form.description || undefined,
        category_hint: (topCats.find((c) => c.id === form.category_id)?.name) || undefined,
        image_urls: (form.images || []).map((i) => i.url).slice(0, 6),
      });
      if (data?.ok && data.titles?.length) {
        setAiTitleOptions(data.titles);
        patch({ title: data.titles[data.recommended_index ?? 0] });
        toast.success(`AI suggested ${data.titles.length} titles`);
      } else {
        toast.error(`Title AI failed: ${data?.error?.slice(0, 80) || "unknown"}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI title failed");
    } finally {
      setAiTitleLoading(false);
    }
  };

  const runAiDetectCategory = async () => {
    if (!form.title && !form.description) {
      toast.error("Enter a title or description first");
      return;
    }
    setAiCatLoading(true);
    try {
      const { data } = await aiApi.detectCategory({
        title: form.title || undefined,
        description: form.description || undefined,
        image_urls: (form.images || []).map((i) => i.url).slice(0, 6),
      });
      if (data?.ok && data.category_id) {
        patch({ category_id: data.category_id, sub_category_id: data.sub_category_id || "" });
        toast.success(`AI picked ${data.category_name}${data.sub_category_name ? ` › ${data.sub_category_name}` : ""}`);
      } else {
        toast.error(`Category AI failed: ${data?.error?.slice(0, 80) || "unknown"}`);
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI category failed");
    } finally {
      setAiCatLoading(false);
    }
  };

  const runAiSuggestPrice = async () => {
    if (!form.title || !form.category_id) {
      toast.error("Enter a title and pick a category first");
      return;
    }
    setAiPriceLoading(true);
    try {
      const { data } = await aiApi.suggestPrice({
        title: form.title.trim(),
        description: form.description || "",
        category_id: form.category_id,
        sub_category_id: form.sub_category_id || undefined,
        condition: form.condition || undefined,
        city: form.location?.city || undefined,
        listing_type: form.type,
      });
      if (data?.suggested_price_inr) {
        setAiPriceSuggestion(data);
        // Pre-fill only if empty
        patch({
          price: form.price || String(data.suggested_price_inr),
          offer_price: form.offer_price || (data.suggested_offer_price_inr ? String(data.suggested_offer_price_inr) : ""),
        });
        toast.success(`Suggested ₹${data.suggested_price_inr.toLocaleString("en-IN")}${data.similar_listings_count ? ` (based on ${data.similar_listings_count} similar)` : ""}`);
      } else {
        toast.error("Price AI could not suggest — try adding more details");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI price failed");
    } finally {
      setAiPriceLoading(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const body = {
        type: form.type,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        category_id: form.category_id,
        sub_category_id: form.sub_category_id || undefined,
        price: Number(form.price),
        offer_price: form.offer_price ? Number(form.offer_price) : undefined,
        is_negotiable: !!form.is_negotiable,
        bulk_price: form.bulk_price ? Number(form.bulk_price) : undefined,
        stock: form.type === "new_product" ? Number(form.stock) : undefined,
        condition: form.type === "old_product" ? form.condition : undefined,
        warranty: form.type === "new_product" && form.warranty ? form.warranty : undefined,
        service_charges_type: form.type === "service" ? form.service_charges_type : undefined,
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
        service_area_km: form.service_area_km ? Number(form.service_area_km) : undefined,
        images: form.images,
        reel: form.reel || undefined,
        location: { ...form.location },
        tags: (typeof form.tags === "string" ? form.tags.split(",") : form.tags).map((t) => t.trim()).filter(Boolean),
        short_description: (form.short_description || "").trim() || undefined,
        features: (form.features || []).filter(Boolean),
        variants: (form.variants || []).filter((v) => v && v.name),
      };

      let res;
      if (isEdit) {
        res = await listingApi.update(id, body);
      } else {
        try {
          res = await listingApi.create(body, false);
        } catch (err) {
          if (err?.response?.status === 403) {
            setShowBecomeVendor(true);
            return;
          }
          throw err;
        }
      }
      const created = res.data;
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);
      toast.success(isEdit ? "Listing updated" : "Listing published");
      navigate(`/listing/${created.slug}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to publish";
      toast.error(typeof msg === "string" ? msg : "Failed");
    } finally {
      setPublishing(false);
    }
  };

  const publishAfterVendorRole = async () => {
    setShowBecomeVendor(false);
    // Retry create with become_vendor flag (or the modal already added the role)
    try {
      setPublishing(true);
      const body = buildBody(form);
      const res = await listingApi.create(body, true);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Listing published");
      navigate(`/listing/${res.data.slug}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to publish";
      toast.error(typeof msg === "string" ? msg : "Failed");
    } finally {
      setPublishing(false);
    }
  };

  const buildBody = (f) => ({
    type: f.type,
    title: f.title.trim(),
    description: f.description?.trim() || undefined,
    category_id: f.category_id,
    sub_category_id: f.sub_category_id || undefined,
    price: Number(f.price),
    offer_price: f.offer_price ? Number(f.offer_price) : undefined,
    is_negotiable: !!f.is_negotiable,
    bulk_price: f.bulk_price ? Number(f.bulk_price) : undefined,
    stock: f.type === "new_product" ? Number(f.stock) : undefined,
    condition: f.type === "old_product" ? f.condition : undefined,
    warranty: f.type === "new_product" && f.warranty ? f.warranty : undefined,
    service_charges_type: f.type === "service" ? f.service_charges_type : undefined,
    experience_years: f.experience_years ? Number(f.experience_years) : undefined,
    service_area_km: f.service_area_km ? Number(f.service_area_km) : undefined,
    images: f.images,
    reel: f.reel || undefined,
    location: { ...f.location },
    tags: (typeof f.tags === "string" ? f.tags.split(",") : f.tags).map((t) => t.trim()).filter(Boolean),
  });

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  return (
    <PhoneScreen>
      <div className="px-6 pt-8">
        <Link to="/vendor/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="form-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
      </div>
      <ScreenHeader
        title={isEdit ? t("listing_form.edit_title") : t("listing_form.title")}
        subtitle={t(`listing_form.step_${STEPS[step]}`)}
      />

      {/* Progress bar */}
      <div className="px-6 mb-6">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-brand transition-all" style={{ width: `${progress}%` }} data-testid="form-progress" />
        </div>
        <div className="mt-1 text-[10px] text-white/50 tracking-wider">
          STEP {step + 1} / {STEPS.length}
        </div>
      </div>

      <div className="px-6 pb-32">
        {/* STEP 0: Type */}
        {step === 0 && (
          <div className="space-y-2" data-testid="step-type">
            {TYPE_META.map(({ key, icon: Icon }) => {
              const active = form.type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => patch({ type: key })}
                  data-testid={`type-${key}`}
                  className={`w-full rounded-2xl border p-4 flex items-center gap-4 text-left transition-colors ${
                    active ? "border-pink-500/60 bg-pink-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${active ? "bg-gradient-brand text-white" : "bg-white/5 text-white/70"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-heading font-semibold">{t(`listing_form.type_${key}`)}</div>
                    <div className="text-xs text-white/60 mt-0.5">{t(`listing_form.type_${key}_desc`)}</div>
                  </div>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}

        {/* STEP 1: Category */}
        {step === 1 && (
          <div className="space-y-4" data-testid="step-category">
            <button
              type="button"
              onClick={runAiDetectCategory}
              disabled={aiCatLoading || (!form.title && !form.description)}
              data-testid="ai-detect-category-btn"
              className="w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiCatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-pink-400" />}
              {aiCatLoading ? "AI is detecting…" : "🎯 Auto-detect category with AI"}
            </button>
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Category</div>
              <Select value={form.category_id} onValueChange={(v) => patch({ category_id: v, sub_category_id: "" })}>
                <SelectTrigger data-testid="category-select" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-72">
                  {topCats.map((c) => (
                    <SelectItem key={c.id} value={c.id} data-testid={`category-opt-${c.slug}`}>
                      {c.icon_url} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subCats.length > 0 && (
              <div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Sub-category</div>
                <Select value={form.sub_category_id} onValueChange={(v) => patch({ sub_category_id: v })}>
                  <SelectTrigger data-testid="sub-category-select" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Pick a sub-category (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white max-h-72">
                    {subCats.map((s) => (
                      <SelectItem key={s.id} value={s.id} data-testid={`sub-cat-opt-${s.slug}`}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <div className="space-y-4" data-testid="step-details">
            <Field label="Title">
              <div className="relative">
                <Input data-testid="title-input" value={form.title} onChange={(e) => patch({ title: e.target.value })} maxLength={120} className="h-12 rounded-xl bg-white/5 border-white/10 pr-24" placeholder="e.g. OnePlus 12, 128GB, Green" />
                <button
                  type="button"
                  onClick={runAiTitle}
                  disabled={aiTitleLoading}
                  data-testid="ai-title-btn"
                  className="absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 disabled:opacity-40"
                >
                  {aiTitleLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-pink-400" />}
                  Suggest
                </button>
              </div>
            </Field>
            {aiTitleOptions.length > 0 && (
              <div className="glass rounded-xl p-3 space-y-1.5" data-testid="ai-title-options">
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">AI title options — tap to use</div>
                {aiTitleOptions.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { patch({ title: t }); toast.success("Title applied"); }}
                    data-testid={`ai-title-option-${i}`}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border ${form.title === t ? "bg-pink-500/20 border-pink-500/50" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* AI Autofill CTA */}
            <button
              type="button"
              onClick={runAiAutofill}
              disabled={aiLoading || !form.title || !form.category_id}
              data-testid="ai-autofill-btn"
              className="w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "AI is writing your listing…" : "Auto-fill with AI"}
            </button>
            {aiPriceHint && (
              <div className="text-xs text-emerald-300/90 -mt-2 pl-1" data-testid="ai-price-hint">
                💡 AI suggests a price range of ₹{aiPriceHint.min?.toLocaleString()} – ₹{aiPriceHint.max?.toLocaleString()}
              </div>
            )}

            <Field label="Description">
              <div className="relative">
                <Textarea data-testid="description-input" value={form.description} onChange={(e) => patch({ description: e.target.value })} className="min-h-24 rounded-xl bg-white/5 border-white/10 pr-24" placeholder="Tell buyers about condition, features, why you're selling…" />
                <button
                  type="button"
                  onClick={() => runAiImprove("friendly")}
                  disabled={aiImproving || !form.description}
                  data-testid="ai-improve-btn"
                  className="absolute bottom-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 disabled:opacity-40"
                >
                  {aiImproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Improve
                </button>
              </div>
            </Field>

            {form.short_description && (
              <Field label="Short tagline">
                <Input data-testid="short-description-input" value={form.short_description} onChange={(e) => patch({ short_description: e.target.value })} maxLength={140} className="h-11 rounded-xl bg-white/5 border-white/10" />
              </Field>
            )}

            {form.features?.length > 0 && (
              <Field label="Key features">
                <div className="space-y-2" data-testid="features-list">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={f}
                        onChange={(e) => {
                          const next = [...form.features];
                          next[i] = e.target.value;
                          patch({ features: next });
                        }}
                        className="h-10 rounded-lg bg-white/5 border-white/10 text-sm"
                        data-testid={`feature-input-${i}`}
                      />
                      <button
                        type="button"
                        onClick={() => patch({ features: form.features.filter((_, j) => j !== i) })}
                        className="text-white/50 hover:text-red-400 text-xs px-2"
                        data-testid={`feature-remove-${i}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </Field>
            )}

            {form.variants?.length > 0 && (
              <Field label={`Variants (${form.variants.length})`}>
                <div className="space-y-2" data-testid="variants-list">
                  {form.variants.map((v, i) => (
                    <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3" data-testid={`variant-${i}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold">{v.name}</div>
                        <button
                          type="button"
                          onClick={() => patch({ variants: form.variants.filter((_, j) => j !== i) })}
                          className="text-xs text-white/50 hover:text-red-400"
                          data-testid={`variant-remove-${i}`}
                        >
                          Remove
                        </button>
                      </div>
                      {v.options?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {v.options.map((o, k) => (
                            <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80">{o}</span>
                          ))}
                        </div>
                      )}
                      {v.features?.length > 0 && (
                        <ul className="text-xs text-white/60 mt-1.5 list-disc list-inside space-y-0.5">
                          {v.features.map((f, k) => <li key={k}>{f}</li>)}
                        </ul>
                      )}
                      {v.price_hint_inr ? (
                        <div className="text-xs text-emerald-300/80 mt-1">~₹{v.price_hint_inr.toLocaleString()}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <div className="relative">
                  <Input data-testid="price-input" type="number" min="0" value={form.price} onChange={(e) => patch({ price: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10 pr-24" />
                  <button
                    type="button"
                    onClick={runAiSuggestPrice}
                    disabled={aiPriceLoading || !form.title || !form.category_id}
                    data-testid="ai-suggest-price-btn"
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1 disabled:opacity-40"
                  >
                    {aiPriceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-emerald-400" />}
                    Suggest
                  </button>
                </div>
              </Field>
              <Field label="Offer price (₹, optional)">
                <Input data-testid="offer-price-input" type="number" min="0" value={form.offer_price} onChange={(e) => patch({ offer_price: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
              </Field>
            </div>
            {aiPriceSuggestion && (
              <div className="glass rounded-xl px-3 py-2 text-xs text-emerald-300/90" data-testid="ai-price-suggestion">
                <div className="font-semibold mb-0.5">💡 AI price analysis · {aiPriceSuggestion.confidence} confidence</div>
                <div className="text-white/70 leading-snug">{aiPriceSuggestion.reasoning}</div>
                {aiPriceSuggestion.similar_listings_count > 0 && (
                  <div className="text-[10px] text-white/40 mt-1">Based on {aiPriceSuggestion.similar_listings_count} similar listings · range ₹{aiPriceSuggestion.min_inr?.toLocaleString("en-IN")}–₹{aiPriceSuggestion.max_inr?.toLocaleString("en-IN")}</div>
                )}
              </div>
            )}
            <div className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Negotiable</div>
                <div className="text-xs text-white/50">Let buyers propose a price</div>
              </div>
              <Switch data-testid="negotiable-switch" checked={form.is_negotiable} onCheckedChange={(v) => patch({ is_negotiable: v })} />
            </div>

            {/* Type-specific */}
            {form.type === "new_product" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock">
                  <Input data-testid="stock-input" type="number" min="0" value={form.stock} onChange={(e) => patch({ stock: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
                </Field>
                <Field label="Warranty (optional)">
                  <Input data-testid="warranty-input" value={form.warranty} onChange={(e) => patch({ warranty: e.target.value })} placeholder="e.g. 1 year" className="h-12 rounded-xl bg-white/5 border-white/10" />
                </Field>
                <Field label="Bulk price (optional)">
                  <Input data-testid="bulk-price-input" type="number" min="0" value={form.bulk_price} onChange={(e) => patch({ bulk_price: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
                </Field>
              </div>
            )}

            {form.type === "old_product" && (
              <Field label="Condition">
                <Select value={form.condition} onValueChange={(v) => patch({ condition: v })}>
                  <SelectTrigger data-testid="condition-select" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    {CONDITION_OPTS.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize" data-testid={`cond-${c}`}>{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {form.type === "service" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Charges type">
                  <Select value={form.service_charges_type} onValueChange={(v) => patch({ service_charges_type: v })}>
                    <SelectTrigger data-testid="charges-select" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                      {CHARGES_OPTS.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize" data-testid={`charges-${c}`}>{c.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Experience (years)">
                  <Input data-testid="exp-input" type="number" min="0" value={form.experience_years} onChange={(e) => patch({ experience_years: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
                </Field>
                <Field label="Service area (km)">
                  <Input data-testid="area-input" type="number" min="0" value={form.service_area_km} onChange={(e) => patch({ service_area_km: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
                </Field>
              </div>
            )}

            <Field label="Tags (comma-separated)">
              <Input data-testid="tags-input" value={form.tags} onChange={(e) => patch({ tags: e.target.value })} placeholder="e.g. mobile, 5g, unboxed" className="h-12 rounded-xl bg-white/5 border-white/10" />
            </Field>
          </div>
        )}

        {/* STEP 3: Media */}
        {step === 3 && (
          <div data-testid="step-media">
            <MediaUploader
              images={form.images}
              reel={form.reel}
              onChange={({ images, reel }) => patch({ images, reel })}
              folder={`listings/${user?.id || "misc"}`}
            />
          </div>
        )}

        {/* STEP 4: Location */}
        {step === 4 && (
          <div className="space-y-4" data-testid="step-location">
            <Button
              type="button"
              onClick={useMyLocation}
              data-testid="use-location-btn"
              variant="outline"
              className="w-full h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <MapPin className="h-4 w-4 mr-1" />
              {t("listing_form.use_my_location")}
            </Button>
            {form.location.lat ? (
              <div className="text-xs text-white/60">
                Captured: {form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)}
              </div>
            ) : null}
            <Field label="Area / Locality">
              <Input data-testid="area-locality-input" value={form.location.area} onChange={(e) => patchLoc({ area: e.target.value })} placeholder="e.g. Koramangala" className="h-12 rounded-xl bg-white/5 border-white/10" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input data-testid="city-input" value={form.location.city} onChange={(e) => patchLoc({ city: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
              </Field>
              <Field label="Pincode">
                <Input data-testid="pincode-input" value={form.location.pincode} onChange={(e) => patchLoc({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" className="h-12 rounded-xl bg-white/5 border-white/10" />
              </Field>
            </div>
            <Field label="State (optional)">
              <Input data-testid="state-input" value={form.location.state} onChange={(e) => patchLoc({ state: e.target.value })} className="h-12 rounded-xl bg-white/5 border-white/10" />
            </Field>
            <Field label="Address (optional)">
              <Textarea data-testid="address-input" value={form.location.address} onChange={(e) => patchLoc({ address: e.target.value })} className="rounded-xl bg-white/5 border-white/10 min-h-16" />
            </Field>
          </div>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <div className="space-y-4" data-testid="step-review">
            <div className="glass rounded-2xl p-4">
              <div className="text-sm font-heading font-semibold">{form.title || "(no title)"}</div>
              <div className="mt-1 text-xs text-white/60 capitalize">{form.type.replace("_", " ")}</div>
              <div className="mt-2 text-lg font-bold">
                ₹{Number(form.offer_price || form.price || 0).toLocaleString("en-IN")}
                {form.offer_price && (
                  <span className="text-sm text-white/40 line-through ml-2">₹{Number(form.price).toLocaleString("en-IN")}</span>
                )}
              </div>
              {form.description && (
                <div className="mt-2 text-sm text-white/70 whitespace-pre-wrap">{form.description}</div>
              )}
              <div className="mt-3 text-xs text-white/60">
                {form.location.area}, {form.location.city} · {form.location.pincode}
              </div>
              {form.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {form.images.slice(0, 4).map((im, i) => (
                    <div key={i} className="aspect-square rounded-md overflow-hidden bg-white/5">
                      <img src={/^https?:/i.test(im.url) ? im.url : `${import.meta.env.VITE_BACKEND_URL || ''}${im.url}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-white/50">Everything looks good? Publish to make it visible to buyers immediately.</p>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 left-0 right-0 px-6 py-4 bg-black/80 backdrop-blur-lg border-t border-white/10 flex gap-3">
        {step > 0 && (
          <Button type="button" onClick={back} variant="outline" className="flex-1 h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10" data-testid="form-back-btn">
            {t("listing_form.back")}
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} className="flex-1 h-12 rounded-full btn-brand border-0 font-semibold" data-testid="form-next-btn">
            {t("listing_form.next")} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={publish} disabled={publishing} className="flex-1 h-12 rounded-full btn-brand border-0 font-semibold disabled:opacity-50" data-testid="form-publish-btn">
            {publishing ? t("listing_form.publishing") : t("listing_form.publish")}
          </Button>
        )}
      </div>

      <BecomeVendorModal
        open={showBecomeVendor}
        onOpenChange={setShowBecomeVendor}
        onDone={publishAfterVendorRole}
      />
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
