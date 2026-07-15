import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { dealApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

export default function Deals() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealApi.mine().then(({ data }) => setItems(data.items || [])).finally(() => setLoading(false));

    const s = getSocket();
    if (s) {
      const handler = (updatedDeal) => {
        setItems((prev) => {
          const exists = prev.some((d) => d.id === updatedDeal.id);
          if (exists) {
            return prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d));
          } else {
            return [updatedDeal, ...prev];
          }
        });
      };
      s.on("deal:updated", handler);
      return () => {
        s.off("deal:updated", handler);
      };
    }
  }, []);
  const asBuyer = items.filter((d) => d.buyer_id === user?.id);
  const asSeller = items.filter((d) => d.seller_id === user?.id);

  return (
    <PhoneScreen className="flex flex-col">
      <ScreenHeader title="Deals" subtitle="Your negotiations." />
      <div className="px-6 pb-24 flex-1">
        <Tabs defaultValue="buyer">
          <TabsList className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-full h-11">
            <TabsTrigger data-testid="tab-buyer" value="buyer" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">As buyer ({asBuyer.length})</TabsTrigger>
            <TabsTrigger data-testid="tab-seller" value="seller" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">As seller ({asSeller.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="buyer" className="mt-4"><List items={asBuyer} loading={loading} /></TabsContent>
          <TabsContent value="seller" className="mt-4"><List items={asSeller} loading={loading} /></TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </PhoneScreen>
  );
}

function List({ items, loading }) {
  if (loading) return <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>;
  if (!items.length) return <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm" data-testid="deals-empty">No deals yet.</div>;
  return (
    <div className="space-y-3" data-testid="deals-list">
      {items.map((d) => (
        <Link key={d.id} to={`/chat/${d.thread_id}`} data-testid={`deal-${d.id}`} className="glass rounded-2xl p-4 flex items-center justify-between hover-card-premium">
          <div>
            <div className="text-sm font-semibold">₹{d.current_offer.toLocaleString("en-IN")}</div>
            <div className="text-xs text-white/60 capitalize">{d.status}</div>
          </div>
          <span className="text-xs text-white/60">Open chat →</span>
        </Link>
      ))}
    </div>
  );
}
