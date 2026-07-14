import { useEffect, useState } from "react";
import { ShoppingCart, X, Loader2, Trash2, MessageCircle, Minus, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Simple module-level bus so any component can nudge the cart to refresh
let _refreshFns = new Set();
export function subscribeCart(fn) { _refreshFns.add(fn); return () => _refreshFns.delete(fn); }
export function notifyCartChanged() { _refreshFns.forEach((f) => f()); }

export default function CartDrawer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const refresh = async () => {
    if (!user) { setCart(null); return; }
    try {
      const { data } = await cartApi.mine();
      setCart(data);
    } catch { setCart(null); }
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeCart(refresh);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || user.current_role !== "customer") return null;
  const total = cart?.total_amount || 0;
  const count = cart?.total_items || 0;

  const setQty = async (listing_id, qty) => {
    if (qty < 1) return removeItem(listing_id);
    setLoading(true);
    try { const { data } = await cartApi.update(listing_id, qty); setCart(data); }
    catch (e) { toast.error("Update failed"); } finally { setLoading(false); }
  };
  const removeItem = async (listing_id) => {
    setLoading(true);
    try { const { data } = await cartApi.remove(listing_id); setCart(data); }
    catch (e) { toast.error("Remove failed"); } finally { setLoading(false); }
  };
  const checkout = async () => {
    setCheckingOut(true);
    try {
      const { data } = await cartApi.checkout();
      toast.success(`Order request sent to ${data.deals.length} vendor(s)`);
      setOpen(false);
      await refresh();
      navigate("/chat");
    } catch (e) { toast.error(e?.response?.data?.detail || "Checkout failed"); }
    finally { setCheckingOut(false); }
  };

  return (
    <>
      {count > 0 && (
        <button
          onClick={() => setOpen(true)}
          data-testid="cart-fab"
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-gradient-brand shadow-lg flex items-center justify-center"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-black text-[11px] font-bold flex items-center justify-center border-2 border-black">
            {count > 99 ? "99+" : count}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="cart-drawer">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-black border-l border-white/10 flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="font-heading font-bold text-lg">Order Cart</h2>
              <button onClick={() => setOpen(false)} data-testid="cart-close" className="p-2"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!cart || cart.groups.length === 0 ? (
                <div className="py-16 text-center text-white/50" data-testid="cart-empty">Cart is empty</div>
              ) : (
                cart.groups.map((g) => (
                  <div key={g.vendor_id} className="glass rounded-2xl p-3 space-y-2" data-testid={`cart-group-${g.vendor_id}`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <div className="h-7 w-7 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold">
                        {(g.vendor?.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{g.vendor?.name || "Vendor"}</div>
                        <div className="text-[11px] text-white/50">{g.items.length} item(s) · ₹{g.subtotal.toLocaleString()}</div>
                      </div>
                    </div>
                    {g.items.map((it) => (
                      <div key={it.listing_id} className="flex items-center gap-2" data-testid={`cart-item-${it.listing_id}`}>
                        <div className="h-12 w-12 rounded-lg bg-white/10 overflow-hidden shrink-0">
                          {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/listing/${it.slug}`} className="text-xs font-medium line-clamp-1 hover:underline">{it.title}</Link>
                          <div className="text-[11px] text-white/50">₹{it.price} × {it.quantity} = ₹{it.line_total}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQty(it.listing_id, it.quantity - 1)} className="h-6 w-6 rounded bg-white/10" data-testid={`qty-dec-${it.listing_id}`}><Minus className="h-3 w-3 mx-auto" /></button>
                          <span className="text-xs w-6 text-center">{it.quantity}</span>
                          <button onClick={() => setQty(it.listing_id, it.quantity + 1)} className="h-6 w-6 rounded bg-white/10" data-testid={`qty-inc-${it.listing_id}`}><Plus className="h-3 w-3 mx-auto" /></button>
                          <button onClick={() => removeItem(it.listing_id)} className="h-6 w-6 rounded bg-red-500/20 text-red-400 ml-1" data-testid={`cart-remove-${it.listing_id}`}><Trash2 className="h-3 w-3 mx-auto" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {cart && cart.groups.length > 0 && (
              <div className="p-4 border-t border-white/10 space-y-2" data-testid="cart-footer">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Total ({count} items)</span>
                  <span className="text-lg font-heading font-bold">₹{total.toLocaleString()}</span>
                </div>
                <button
                  onClick={checkout}
                  disabled={checkingOut || loading}
                  data-testid="cart-checkout"
                  className="w-full h-12 rounded-full btn-brand text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Send Order Request to {cart.groups.length} vendor(s)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
