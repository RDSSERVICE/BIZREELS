import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Search, User as UserIcon } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import CategoryGrid from "@/components/app/CategoryGrid";
import ListingCard from "@/components/app/ListingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categoryApi, listingApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Browse() {
  const { t } = useTranslation();
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topCats, setTopCats] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [activeCat, setActiveCat] = useState(null); // category detail when slug present
  const [activeSubId, setActiveSubId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [q, setQ] = useState("");

  // Load top-level categories once
  useEffect(() => {
    categoryApi.list({ top_level: true }).then(({ data }) => setTopCats(data.items || []));
  }, []);

  // Load category context if slug is present
  useEffect(() => {
    let alive = true;
    if (categorySlug) {
      categoryApi.bySlug(categorySlug).then(({ data }) => {
        if (!alive) return;
        setActiveCat(data);
        setSubCats(data.children || []);
        setActiveSubId(null);
      }).catch(() => setActiveCat(null));
    } else {
      setActiveCat(null);
      setSubCats([]);
      setActiveSubId(null);
    }
    return () => { alive = false; };
  }, [categorySlug]);

  // Fetch listings whenever filters change
  const fetchListings = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setCursor(null); setItems([]); }
    else setLoadingMore(true);
    try {
      const params = { limit: 12 };
      if (activeCat?.id) params.category_id = activeCat.id;
      if (activeSubId) params.sub_category_id = activeSubId;
      if (q.trim()) params.q = q.trim();
      if (!reset && cursor) params.cursor = cursor;
      const { data } = await listingApi.list(params);
      setItems((prev) => reset ? data.items : [...prev, ...data.items]);
      setCursor(data.next_cursor);
      setHasMore(!!data.has_more);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCat, activeSubId, q, cursor]);

  useEffect(() => {
    // Reset + fetch when category / sub / q changes
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat?.id, activeSubId, q]);

  return (
    <PhoneScreen>
      <div className="px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-2"
            data-testid="browse-back-btn"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </button>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {activeCat ? activeCat.name : t("browse.title")}
          </h1>
          <p className="text-sm text-white/60 mt-1">{t("browse.subtitle")}</p>
        </div>
        <Link to={user ? "/profile" : "/login"} className="glass rounded-full h-11 w-11 flex items-center justify-center" data-testid="browse-profile-link">
          <UserIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            data-testid="browse-search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings…"
            className="h-12 pl-9 rounded-full bg-white/5 border-white/10 text-sm"
          />
        </div>
      </div>

      {/* Category grid or sub-cat chips */}
      <div className="px-6 pb-6">
        {activeCat ? (
          subCats.length > 0 && (
            <>
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
                {t("browse.sub_categories")}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6" data-testid="sub-category-chips">
                <button
                  onClick={() => setActiveSubId(null)}
                  data-testid="sub-chip-all"
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border shrink-0 ${
                    !activeSubId ? "bg-gradient-brand text-white border-transparent" : "bg-white/5 text-white/70 border-white/10"
                  }`}
                >
                  All
                </button>
                {subCats.map((s) => (
                  <button
                    key={s.id}
                    data-testid={`sub-chip-${s.slug}`}
                    onClick={() => setActiveSubId(s.id === activeSubId ? null : s.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border shrink-0 ${
                      s.id === activeSubId
                        ? "bg-gradient-brand text-white border-transparent"
                        : "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
              {t("browse.categories")}
            </div>
            <CategoryGrid categories={topCats} />
          </>
        )}
      </div>

      {/* Listings */}
      <div className="px-6 pb-24">
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">
          {t("browse.listings")}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3" data-testid="listings-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="listings-empty">
            <div className="text-3xl mb-2">🌱</div>
            <div className="text-sm text-white/70">{t("browse.empty")}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3" data-testid="listings-grid">
              {items.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  data-testid="load-more-btn"
                  onClick={() => fetchListings(false)}
                  disabled={loadingMore}
                  variant="outline"
                  className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
                >
                  {loadingMore ? t("common.loading") : t("browse.load_more")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating add-listing button for vendors */}
      {user?.roles?.includes("vendor") && (
        <Link
          to="/vendor/listing/new"
          data-testid="floating-add-listing"
          className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full btn-brand shadow-2xl flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </PhoneScreen>
  );
}
