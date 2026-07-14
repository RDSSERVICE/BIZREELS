import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pause, Play, Check, Pencil, Trash2 } from "lucide-react";
import { PhoneScreen, ScreenHeader } from "@/components/app/PhoneScreen";
import BottomNav from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { listingApi, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import BecomeVendorModal from "@/components/app/BecomeVendorModal";

export default function VendorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needVendor, setNeedVendor] = useState(false);

  useEffect(() => {
    if (!user?.roles?.includes("vendor")) {
      setNeedVendor(true);
      setLoading(false);
      return;
    }
    setNeedVendor(false);
    fetchListings();
  }, [user?.id, user?.roles]);

  async function fetchListings() {
    setLoading(true);
    try {
      const { data } = await listingApi.mine();
      setItems(data.items || []);
    } catch (e) {
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  }

  const setStatus = async (id, status) => {
    try {
      await listingApi.setStatus(id, status);
      toast.success(`Marked as ${status}`);
      fetchListings();
    } catch {
      toast.error("Failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("vendor.confirm_delete"))) return;
    try {
      await listingApi.remove(id);
      toast.success("Deleted");
      fetchListings();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <PhoneScreen>
      <div className="px-6 pt-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm" data-testid="vendor-back-link">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
      </div>
      <ScreenHeader
        title={t("vendor.dashboard_title")}
        subtitle={t("vendor.dashboard_subtitle")}
        right={
          <Link
            to="/vendor/listing/new"
            data-testid="new-listing-btn"
            className="btn-brand rounded-full h-10 px-4 flex items-center gap-1 text-sm font-semibold border-0"
          >
            <Plus className="h-4 w-4" /> {t("vendor.new_listing")}
          </Link>
        }
      />

      <div className="px-6 pb-24">
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">
          {t("vendor.my_listings")}
        </div>

        {loading ? (
          <div className="space-y-3" data-testid="vendor-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center" data-testid="vendor-empty">
            <div className="text-3xl mb-2">🌱</div>
            <div className="text-sm text-white/70 mb-4">{t("vendor.empty")}</div>
            <Link to="/vendor/listing/new">
              <Button className="rounded-full btn-brand border-0" data-testid="empty-create-btn">
                <Plus className="h-4 w-4 mr-1" /> {t("vendor.new_listing")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3" data-testid="vendor-listings">
            {items.map((l) => (
              <div key={l.id} className="glass rounded-2xl p-3 flex gap-3" data-testid={`vendor-listing-${l.slug}`}>
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  {l.images?.[0]?.url ? (
                    <img src={resolveMediaUrl(l.images[0].url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-white/20">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-heading font-semibold truncate">{l.title}</div>
                  <div className="text-xs text-white/60 mt-0.5">
                    ₹{new Intl.NumberFormat("en-IN").format(l.offer_price || l.price)}
                    {" · "}
                    <span className="capitalize">{l.status}</span>
                    {" · "}
                    {l.views_count || 0} views
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Link to={`/vendor/listing/${l.id}/edit`}>
                      <button className="text-[10px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/15" data-testid={`edit-btn-${l.slug}`}>
                        <Pencil className="h-3 w-3 inline mr-1" />Edit
                      </button>
                    </Link>
                    {l.status !== "sold" && (
                      l.status === "paused" ? (
                        <button onClick={() => setStatus(l.id, "active")} className="text-[10px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/15" data-testid={`resume-btn-${l.slug}`}>
                          <Play className="h-3 w-3 inline mr-1" />{t("vendor.resume")}
                        </button>
                      ) : (
                        <button onClick={() => setStatus(l.id, "paused")} className="text-[10px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/15" data-testid={`pause-btn-${l.slug}`}>
                          <Pause className="h-3 w-3 inline mr-1" />{t("vendor.pause")}
                        </button>
                      )
                    )}
                    {l.status !== "sold" && (
                      <button onClick={() => setStatus(l.id, "sold")} className="text-[10px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/15" data-testid={`sold-btn-${l.slug}`}>
                        <Check className="h-3 w-3 inline mr-1" />{t("vendor.mark_sold")}
                      </button>
                    )}
                    <button onClick={() => remove(l.id)} className="text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25" data-testid={`delete-btn-${l.slug}`}>
                      <Trash2 className="h-3 w-3 inline mr-1" />{t("vendor.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BecomeVendorModal
        open={needVendor}
        onOpenChange={(v) => {
          setNeedVendor(v);
          if (!v && !user?.roles?.includes("vendor")) navigate("/dashboard");
        }}
        onDone={() => fetchListings()}
      />
      <BottomNav />
    </PhoneScreen>
  );
}
