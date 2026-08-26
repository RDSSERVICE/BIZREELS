import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart, FiX, FiTrash2, FiMinus, FiPlus,
  FiMessageSquare, FiPackage, FiChevronRight
} from "react-icons/fi";
import toast from "react-hot-toast";
import { cartApi } from "../../lib/api";

// Simple module-level bus so any component can nudge the cart to refresh or open/close drawer
let _refreshFns = new Set();
let _openFns = new Set();
let _closeFns = new Set();
let _countFns = new Set();
let _currentCount = 0;

export function getCartItemCount() { return _currentCount; }
export function subscribeCart(fn) { _refreshFns.add(fn); return () => _refreshFns.delete(fn); }
export function notifyCartChanged() { _refreshFns.forEach((f) => f()); }
export function subscribeOpenCart(fn) { _openFns.add(fn); return () => _openFns.delete(fn); }
export function openCartDrawer() { _openFns.forEach((f) => f()); }
export function subscribeCloseCart(fn) { _closeFns.add(fn); return () => _closeFns.delete(fn); }
export function closeCartDrawer() { _closeFns.forEach((f) => f()); }
export function subscribeCartCount(fn) { _countFns.add(fn); return () => _countFns.delete(fn); }

export default function CartDrawer() {
  const user = useSelector((state) => state.auth?.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const refresh = async () => {
    if (!user) { setCart(null); _currentCount = 0; _countFns.forEach(fn => fn(0)); return; }
    try {
      const res = await cartApi.mine();
      const cartData = res.data;
      setCart(cartData);
      _currentCount = cartData?.total_items || 0;
      _countFns.forEach(fn => fn(_currentCount));
    } catch { 
      setCart(null);
      _currentCount = 0;
      _countFns.forEach(fn => fn(0));
    }
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeCart(refresh);
    const unsubOpen = subscribeOpenCart(() => setOpen(true));
    const unsubClose = subscribeCloseCart(() => setOpen(false));
    return () => {
      unsub();
      unsubOpen();
      unsubClose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id || user?.id]);

  const currentRole = user?.current_role || user?.activeRole || user?.role;
  if (!user || (currentRole && currentRole !== "customer" && currentRole !== "user")) return null;

  const total = cart?.total_amount || 0;
  const count = cart?.total_items || 0;

  const setQty = async (listing_id, qty) => {
    if (qty < 1) return removeItem(listing_id);
    setUpdatingId(listing_id);
    setLoading(true);
    try {
      const { data } = await cartApi.update(listing_id, qty);
      setCart(data);
    } catch (e) {
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
      setUpdatingId(null);
    }
  };

  const removeItem = async (listing_id) => {
    setUpdatingId(listing_id);
    setLoading(true);
    try {
      const { data } = await cartApi.remove(listing_id);
      setCart(data);
      toast.success("Item removed from cart");
    } catch (e) {
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
      setUpdatingId(null);
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const { data } = await cartApi.checkout();
      toast.success(`Order request sent to ${data.deals?.length || 1} vendor(s)!`);
      setOpen(false);
      await refresh();
      navigate("/customer/chat");
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.response?.data?.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      {/* ── Floating Cart FAB Button ── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 300 }}
            onClick={() => setOpen(true)}
            data-testid="cart-fab"
            className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-[#d99a3d] hover:bg-[#c8872b] shadow-lg shadow-[#d99a3d]/30 flex items-center justify-center transition-colors cursor-pointer border-2 border-[#241b15]/20"
            title="View Cart"
          >
            <FiShoppingCart className="h-5 w-5 text-[#241b15]" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-[#241b15] text-[#d99a3d] text-[10px] font-black flex items-center justify-center border-2 border-[#d99a3d]">
              {count > 99 ? "99+" : count}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart Drawer Panel ── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex justify-end" data-testid="cart-drawer">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="relative z-10 w-full max-w-md h-full bg-[#f8f4ec] shadow-2xl border-l border-[#e3dccb] flex flex-col font-sans"
            >
              {/* ── HEADER ── */}
              <div className="px-4 sm:px-5 py-3.5 bg-[#241b15] text-white border-b border-[#3a2c22] flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#d99a3d]/20 border-2 border-[#d99a3d] flex items-center justify-center">
                    <FiShoppingCart className="w-5 h-5 text-[#d99a3d]" />
                  </div>
                  <div className="min-w-0">
                    <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-white uppercase tracking-tight">
                      Your Cart
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-extrabold text-[#d99a3d] bg-[#3a2c22] px-2 py-0.5 rounded-full border border-[#d99a3d]/30 uppercase tracking-wide">
                        {count} {count === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#3a2c22] hover:bg-[#d99a3d] text-white hover:text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer shrink-0 border-none"
                  title="Close Cart"
                  data-testid="cart-close"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* ── ITEMS LIST ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f2ede4]">
                {!cart || !cart.groups || cart.groups.length === 0 ? (
                  /* ── EMPTY STATE ── */
                  <div className="py-12 space-y-4">
                    <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-8 shadow-xs text-center max-w-sm mx-auto space-y-4">
                      <div className="w-16 h-16 bg-[#241b15] text-[#d99a3d] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <FiPackage className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base font-black text-[#241b15] uppercase tracking-wide">
                          Cart is Empty
                        </h3>
                        <p className="text-[12px] font-medium text-[#6a6256] mt-2 leading-relaxed">
                          Browse reels and listings to discover products from local vendors. Tap <span className="font-extrabold text-[#241b15]">"Add to Cart"</span> to start building your order.
                        </p>
                      </div>
                      <button
                        onClick={() => { setOpen(false); navigate('/customer/search'); }}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-none mx-auto"
                      >
                        <FiShoppingCart size={14} />
                        Browse Products
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── VENDOR GROUPS ── */
                  cart.groups.map((group) => (
                    <div
                      key={group.vendor_id}
                      className="bg-white border border-[#e3dccb] rounded-xl overflow-hidden shadow-xs"
                      data-testid={`cart-group-${group.vendor_id}`}
                    >
                      {/* Vendor Header */}
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#faf7f0] border-b border-[#e3dccb]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d99a3d] to-[#241b15] p-0.5 shrink-0">
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-black text-[#241b15]">
                            {(group.vendor?.name || "V").charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-[#241b15] truncate">{group.vendor?.name || "Vendor"}</p>
                          <p className="text-[10px] font-bold text-[#8a8072]">
                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'} · <span className="text-[#d99a3d] font-extrabold">₹{group.subtotal?.toLocaleString()}</span>
                          </p>
                        </div>
                        <FiChevronRight size={14} className="text-[#d99a3d] shrink-0" />
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-[#f0ebe0]">
                        {group.items.map((item) => {
                          const isUpdating = updatingId === item.listing_id;
                          return (
                            <div
                              key={item.listing_id}
                              className={`flex items-center gap-3 px-3.5 py-3 transition ${isUpdating ? 'opacity-50' : ''}`}
                              data-testid={`cart-item-${item.listing_id}`}
                            >
                              {/* Product Image */}
                              <div className="h-14 w-14 rounded-lg bg-[#f2ede4] border border-[#e3dccb] overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.title || ''} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FiPackage size={18} className="text-[#d99a3d]" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-extrabold text-[#241b15] line-clamp-1 leading-tight">
                                  {item.title || 'Product'}
                                </p>
                                <p className="text-[10px] font-bold text-[#8a8072] mt-0.5">
                                  ₹{item.price?.toLocaleString()} × {item.quantity}
                                </p>
                                <p className="text-[11px] font-black text-[#d99a3d] mt-0.5">
                                  ₹{item.line_total?.toLocaleString()}
                                </p>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setQty(item.listing_id, item.quantity - 1)}
                                  disabled={isUpdating}
                                  className="w-7 h-7 rounded-lg bg-[#f2ede4] hover:bg-[#e3dccb] border border-[#e3dccb] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                                  data-testid={`qty-dec-${item.listing_id}`}
                                >
                                  <FiMinus size={12} className="text-[#241b15]" />
                                </button>
                                <span className="text-[11px] font-black text-[#241b15] w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => setQty(item.listing_id, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="w-7 h-7 rounded-lg bg-[#f2ede4] hover:bg-[#e3dccb] border border-[#e3dccb] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                                  data-testid={`qty-inc-${item.listing_id}`}
                                >
                                  <FiPlus size={12} className="text-[#241b15]" />
                                </button>
                                <button
                                  onClick={() => removeItem(item.listing_id)}
                                  disabled={isUpdating}
                                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition cursor-pointer ml-1 disabled:opacity-40"
                                  data-testid={`cart-remove-${item.listing_id}`}
                                >
                                  <FiTrash2 size={12} className="text-red-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── FOOTER ── */}
              {cart && cart.groups && cart.groups.length > 0 && (
                <div className="px-4 sm:px-5 py-4 bg-[#241b15] border-t border-[#3a2c22] space-y-3 shrink-0 shadow-inner" data-testid="cart-footer">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      Total ({count} {count === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-lg font-black text-[#d99a3d]">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={checkout}
                    disabled={checkingOut || loading}
                    data-testid="cart-checkout"
                    className="w-full h-12 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] text-[#241b15] text-sm font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 border-none shadow-md"
                  >
                    {checkingOut ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#241b15] border-t-transparent animate-spin" />
                    ) : (
                      <FiMessageSquare className="h-4 w-4" />
                    )}
                    Send Order to {cart.groups.length} Vendor{cart.groups.length > 1 ? 's' : ''}
                  </button>

                  <p className="text-[9px] text-white/40 text-center font-medium">
                    Vendors will confirm availability & pricing via chat
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
