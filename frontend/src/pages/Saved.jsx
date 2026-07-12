import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import ListingCard from "@/components/app/ListingCard";
import BottomNav from "@/components/app/BottomNav";
import { interactionApi } from "@/lib/api";

export default function Saved() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interactionApi.mySaved().then(({ data }) => { setItems(data.items || []); }).finally(() => setLoading(false));
  }, []);

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title={t("saved_page.title")} subtitle={t("saved_page.subtitle")} />
      <div className="px-6 pb-24 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="saved-empty">
            <div className="text-3xl mb-2">🔖</div>
            <div className="text-sm text-white/70">{t("saved_page.empty")}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" data-testid="saved-listings">
            {items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}
