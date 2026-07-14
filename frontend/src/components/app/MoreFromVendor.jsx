import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { moreFromVendor, cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { notifyCartChanged } from "@/components/app/CartDrawer";

export default function MoreFromVendor({ listing }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listing?.vendor?.id) return;
    setLoading(true);
    moreFromVendor(listing.vendor.id, listing.id, 12)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listing?.id, listing?.vendor?.id]);

  const addToCart = async (id) => {
    try { await cartApi.add({ listing_id: id, quantity: 1 }); notifyCartChanged(); toast.success("Added"); }
    catch (e) { toast.error("Add failed"); }
  };

  if (loading || items.length === 0) return null;
  const canAdd = user && user.current_role === "customer" && listing?.vendor && user.id !== listing.vendor.id;

  return (
    <section data-testid="more-from-vendor">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold">
          More from {listing.vendor.name || "this vendor"}
        </h3>
        <Link to={`/vendor/${listing.vendor.id}`} className="text-xs text-pink-400 hover:underline">See all</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory scrollbar-none">
        {items.map((it) => (
          <div key={it.id} className="min-w-[140px] w-[140px] snap-start glass rounded-xl overflow-hidden" data-testid={`more-vendor-item-${it.slug}`}>
            <Link to={`/listing/${it.slug}`} className="block">
              <div className="aspect-[4/5] bg-white/5">
                {(it.images || [])[0]?.url ? (
                  <img src={(it.images || [])[0].url} alt={it.title} className="w-full h-full object-cover" />
                ) : it.reel?.thumbnail_url ? (
                  <img src={it.reel.thumbnail_url} alt={it.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="p-2">
                <div className="text-xs font-medium line-clamp-1">{it.title}</div>
                <div className="text-[11px] text-white/60 mt-0.5">₹{new Intl.NumberFormat("en-IN").format(it.offer_price || it.price)}</div>
              </div>
            </Link>
            {canAdd && (
              <button
                onClick={() => addToCart(it.id)}
                data-testid={`more-vendor-add-${it.slug}`}
                className="w-full py-1.5 text-[11px] font-semibold bg-white/5 hover:bg-white/10 border-t border-white/10"
              >
                + Add to order
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
