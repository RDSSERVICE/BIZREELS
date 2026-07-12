import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, X, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import ListingCard from "@/components/app/ListingCard";
import BottomNav from "@/components/app/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchApi, resolveMediaUrl } from "@/lib/api";

// tiny debounce hook
function useDebouncedValue(v, delay = 250) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), delay); return () => clearTimeout(t); }, [v, delay]);
  return d;
}

const SORT_LABELS = { recent: "Newest", price_asc: "Price ↑", price_desc: "Price ↓" };

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const debouncedQ = useDebouncedValue(q, 300);
  const [suggestions, setSuggestions] = useState({ listings: [], categories: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    sort: "recent", is_negotiable: null, has_offer: null,
    price_min: "", price_max: "", radius: "",
    condition: "",
  });

  useEffect(() => {
    if (debouncedQ.trim().length >= 2) {
      searchApi.suggest(debouncedQ).then(({ data }) => setSuggestions(data));
    } else {
      setSuggestions({ listings: [], categories: [] });
    }
  }, [debouncedQ]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const payload = { q: debouncedQ || undefined, limit: 24, sort: filters.sort };
      if (filters.is_negotiable) payload.is_negotiable = true;
      if (filters.has_offer) payload.has_offer = true;
      if (filters.price_min) payload.price_min = Number(filters.price_min);
      if (filters.price_max) payload.price_max = Number(filters.price_max);
      if (filters.radius) payload.radius = Number(filters.radius);
      if (filters.condition) payload.condition = filters.condition;
      const { data } = await searchApi.search(payload);
      setResults(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filters]);

  useEffect(() => { runSearch(); }, [runSearch]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q); else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const clearFilters = () => setFilters({ sort: "recent", is_negotiable: null, has_offer: null, price_min: "", price_max: "", radius: "", condition: "" });
  const activeFilterCount = ["is_negotiable","has_offer","price_min","price_max","radius","condition"].filter((k) => filters[k]).length;

  return (
    <PhoneScreen className="flex flex-col">
      <div className="px-4 pt-6 pb-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} data-testid="search-back-btn" className="h-10 w-10 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
              <X className="h-3 w-3" />
            </button>
          )}
          <Input
            data-testid="search-input"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            className="h-11 pl-9 pr-10 rounded-full bg-white/5 border-white/10 text-sm"
          />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <button data-testid="search-filters-btn" className="h-10 w-10 rounded-full glass flex items-center justify-center relative">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-pink-500 text-white h-4 w-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-neutral-900 border-white/10 text-white rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="text-white font-heading">{t("search.filters")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 pb-6">
              <FilterRow label="Sort">
                <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({...f, sort: v}))}>
                  <SelectTrigger data-testid="sort-trigger" className="h-11 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    {Object.entries(SORT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterRow>
              <div className="grid grid-cols-2 gap-3">
                <FilterRow label={t("search.price_min")}>
                  <Input data-testid="price-min-input" inputMode="numeric" value={filters.price_min} onChange={(e) => setFilters((f) => ({...f, price_min: e.target.value.replace(/\D/g, "")}))} className="h-11 rounded-xl bg-white/5 border-white/10" />
                </FilterRow>
                <FilterRow label={t("search.price_max")}>
                  <Input data-testid="price-max-input" inputMode="numeric" value={filters.price_max} onChange={(e) => setFilters((f) => ({...f, price_max: e.target.value.replace(/\D/g, "")}))} className="h-11 rounded-xl bg-white/5 border-white/10" />
                </FilterRow>
              </div>
              <FilterRow label={t("search.radius")}>
                <Select value={filters.radius || ""} onValueChange={(v) => setFilters((f) => ({...f, radius: v}))}>
                  <SelectTrigger data-testid="radius-trigger" className="h-11 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Anywhere" /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                    <SelectItem value="25">Within 25 km</SelectItem>
                    <SelectItem value="50">Within 50 km</SelectItem>
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Condition (old items)">
                <Select value={filters.condition} onValueChange={(v) => setFilters((f) => ({...f, condition: v}))}>
                  <SelectTrigger data-testid="condition-filter-trigger" className="h-11 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like new</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </FilterRow>
              <ToggleRow label={t("search.only_negotiable")} checked={!!filters.is_negotiable} onChange={(v) => setFilters((f) => ({...f, is_negotiable: v}))} testId="only-negotiable" />
              <ToggleRow label={t("search.only_with_offer")} checked={!!filters.has_offer} onChange={(v) => setFilters((f) => ({...f, has_offer: v}))} testId="only-with-offer" />
              <div className="flex gap-3 pt-3">
                <Button data-testid="filters-clear-btn" onClick={clearFilters} variant="outline" className="flex-1 h-12 rounded-full bg-white/5 border-white/10 hover:bg-white/10">{t("search.clear")}</Button>
                <Button data-testid="filters-apply-btn" onClick={() => setFilterOpen(false)} className="flex-1 h-12 rounded-full btn-brand border-0 font-semibold">{t("search.apply")}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Suggestions */}
      {debouncedQ.trim().length >= 2 && (suggestions.listings.length > 0 || suggestions.categories.length > 0) && (
        <div className="px-4 mb-2" data-testid="search-suggestions">
          <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">{t("search.suggestions")}</div>
          <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
            {suggestions.listings.map((s) => (
              <button key={s.slug} onClick={() => navigate(`/listing/${s.slug}`)} data-testid={`suggest-listing-${s.slug}`} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left">
                <div className="h-10 w-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                  {s.image ? <img src={resolveMediaUrl(s.image)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{s.title}</div>
                  <div className="text-xs text-white/50">₹{new Intl.NumberFormat("en-IN").format(s.price || 0)}</div>
                </div>
              </button>
            ))}
            {suggestions.categories.map((c) => (
              <button key={c.slug} onClick={() => navigate(`/browse/${c.slug}`)} data-testid={`suggest-category-${c.slug}`} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">{c.icon_url || "🗂️"}</div>
                <div className="text-sm">Category · {c.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className="px-4 pb-24 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm mt-2" data-testid="search-empty">
            {debouncedQ ? t("search.no_results") : "Start typing to search…"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" data-testid="search-results">
            {results.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </PhoneScreen>
  );
}

function FilterRow({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function ToggleRow({ label, checked, onChange, testId }) {
  return (
    <div className="glass rounded-xl p-3 flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch data-testid={testId} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
