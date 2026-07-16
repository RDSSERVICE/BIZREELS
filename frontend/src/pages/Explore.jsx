import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import CategoryGrid from "@/components/app/CategoryGrid";
import ListingCard from "@/components/app/ListingCard";
import BottomNav from "@/components/app/BottomNav";
import { categoryApi, listingApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Explore() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    categoryApi.list({ top_level: true }).then(({ data }) => setCats(data.items || []));
    listingApi.list({ limit: 30 }).then(({ data }) => { setItems(data.items || []); setLoading(false); });
  }, []);

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader
        title="Explore"
        subtitle="Browse everything, filtered your way."
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <button
          type="button"
          onClick={() => navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`)}
          data-testid="explore-search-btn"
          className="w-full text-left"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              readOnly
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-12 pl-9 rounded-full bg-white/5 border-white/10 text-sm cursor-pointer"
              data-testid="explore-search-input"
            />
          </div>
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Categories</div>
        <CategoryGrid categories={cats} />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">Trending now</div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm">Nothing here yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4" data-testid="explore-listings">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </PhoneScreen>
  );
}
