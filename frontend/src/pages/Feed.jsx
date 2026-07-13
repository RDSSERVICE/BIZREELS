import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { feedApi } from "@/lib/api";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import LocationChip, { useUserLocation } from "@/components/app/LocationChip";
import ReelItem from "@/components/app/ReelItem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

export default function Feed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, request: requestLoc } = useUserLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [locPromptOpen, setLocPromptOpen] = useState(false);

  useEffect(() => {
    // First-time prompt
    if (!location && !localStorage.getItem("emergent_geo_asked")) {
      setLocPromptOpen(true);
      localStorage.setItem("emergent_geo_asked", "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [location?.lat]);

  async function load(reset = true) {
    if (reset) { setLoading(true); setItems([]); setCursor(null); }
    try {
      const params = { limit: 15, radius: location ? "10" : "any" };
      if (location) { params.lat = location.lat; params.lng = location.lng; }
      if (!reset && cursor) params.cursor = cursor;
      const { data } = await feedApi.main(params);
      setItems((prev) => reset ? data.items : [...prev, ...data.items]);
      setCursor(data.next_cursor);
      setHasMore(!!data.has_more);
    } finally {
      setLoading(false);
    }
  }

  const grantLoc = async () => {
    setLocPromptOpen(false);
    await requestLoc();
  };

  // Reels-only vertical stream (Instagram Reels behaviour). Non-reel listings
  // (image-only) still render full-viewport via ReelItem's image fallback.
  const stream = items;

  return (
    <PhoneScreen className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-black/85 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2">
          <h1 className="font-heading text-xl font-bold">{t("feed.title")}</h1>
          <div className="flex items-center gap-2">
            <LocationChip />
            <button
              onClick={() => navigate("/search")}
              data-testid="feed-search-btn"
              className="h-10 w-10 rounded-full glass flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feed body */}
      <div
        className="flex-1 overflow-y-auto snap-y snap-mandatory h-[calc(100vh-56px-64px)] scrollbar-none"
        style={{ scrollbarWidth: "none" }}
        data-testid="feed-scroll"
      >
        {loading && items.length === 0 ? (
          <div className="p-6 space-y-3" data-testid="feed-loading">
            {[1, 2].map((i) => <div key={i} className="aspect-[9/16] rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-white/60" data-testid="feed-empty">{t("feed.feed_empty")}</div>
        ) : (
          <>
            {stream.map((listing, i) => (
              <ReelItem
                key={listing.id}
                listing={listing}
                index={i}
                onOpenLogin={() => navigate("/login")}
              />
            ))}
            {hasMore && (
              <div className="snap-start px-4 py-6 bg-black flex justify-center h-24">
                <Button
                  data-testid="feed-load-more"
                  variant="outline"
                  onClick={() => load(false)}
                  className="rounded-full bg-white/5 border-white/10 hover:bg-white/10"
                >Load more</Button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Location prompt */}
      <Dialog open={locPromptOpen} onOpenChange={setLocPromptOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{t("feed.location_prompt_title")}</DialogTitle>
            <DialogDescription className="text-white/70">{t("feed.location_prompt_body")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button data-testid="allow-location-btn" onClick={grantLoc} className="w-full h-12 rounded-full btn-brand border-0 font-semibold">
              {t("feed.allow")}
            </Button>
            <Button data-testid="later-location-btn" variant="ghost" onClick={() => setLocPromptOpen(false)} className="w-full h-12 rounded-full text-white/70 hover:bg-white/5">
              {t("feed.later")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneScreen>
  );
}
