import { useEffect, useState } from "react";
import { Palette, Briefcase, Star, TrendingUp } from "lucide-react";
import ScreenHeader from "@/components/app/ScreenHeader";
import BottomNav from "@/components/app/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { userApi, listingApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function CreatorDashboard() {
  const { user, updateLocalUser } = useAuth();
  const [available, setAvailable] = useState(user?.availability === "available");
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listingApi.list({ vendor_id: user.id, type: "service", limit: 24 })
      .then(({ data }) => setPortfolio(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleAvailable = async (v) => {
    setAvailable(v);
    try {
      const { data } = await userApi.update({ availability: v ? "available" : "booked" });
      updateLocalUser(data);
      toast.success(v ? "You're now available for hire" : "Marked as booked");
    } catch (e) { setAvailable(!v); toast.error("Update failed"); }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col">
      <ScreenHeader title="Creator Hub" subtitle="Portfolio · hire requests" />
      <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-24">
        <div className="glass rounded-2xl p-4 flex items-center justify-between" data-testid="creator-availability">
          <div>
            <div className="font-heading font-semibold text-sm">Available for hire</div>
            <div className="text-xs text-white/50">Toggle off when booked out</div>
          </div>
          <Switch checked={available} onCheckedChange={toggleAvailable} data-testid="availability-toggle" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Briefcase, label: "Requests", value: user?.pending_deals_count || 0 },
            { icon: Star, label: "Rating", value: (user?.rating_avg || 0).toFixed(1) },
            { icon: TrendingUp, label: "Trust", value: user?.trust_score || 0 },
          ].map(({ icon: I, label, value }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <I className="h-4 w-4 mx-auto text-white/60 mb-1" />
              <div className="text-lg font-heading font-bold">{value}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-semibold text-sm">Portfolio</h2>
            <Link to="/vendor/listing/new" className="text-xs text-pink-400" data-testid="creator-add-work">+ Add work</Link>
          </div>
          {loading ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : portfolio.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center" data-testid="creator-portfolio-empty">
              <Palette className="h-8 w-8 mx-auto text-white/40 mb-2" />
              <div className="text-sm text-white/70 mb-3">No work uploaded yet</div>
              <Link to="/vendor/listing/new">
                <Button size="sm" className="btn-brand">Add first work</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" data-testid="creator-portfolio-grid">
              {portfolio.map((l) => (
                <Link to={`/listing/${l.slug}`} key={l.id} className="glass rounded-xl overflow-hidden">
                  <div className="aspect-square bg-white/5">
                    {(l.images || [])[0]?.url && <img src={(l.images || [])[0].url} alt={l.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold truncate">{l.title}</div>
                    <div className="text-[11px] text-white/50">₹{new Intl.NumberFormat("en-IN").format(l.offer_price || l.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
