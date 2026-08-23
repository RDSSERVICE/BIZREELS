import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiShoppingCart, FiTrash2, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartApi } from '../../../lib/api';
import { notifyCartChanged, subscribeCart } from '../../../components/app/CartDrawer';
import CartVendorGroup from './components/CartVendorGroup';
import CartOrderSummary from './components/CartOrderSummary';
import CartEmptyState from './components/CartEmptyState';

export default function MyCartPage() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const res = await cartApi.mine();
      setCart(res.data);
    } catch (err) {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const unsub = subscribeCart(fetchCart);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id || user?.id]);

  const handleUpdateQty = async (listingId, quantity) => {
    if (quantity < 1) {
      return handleRemoveItem(listingId);
    }
    setUpdatingId(listingId);
    try {
      const { data } = await cartApi.update(listingId, quantity);
      setCart(data);
      notifyCartChanged();
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (listingId) => {
    setUpdatingId(listingId);
    try {
      const { data } = await cartApi.remove(listingId);
      setCart(data);
      notifyCartChanged();
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data } = await cartApi.checkout();
      toast.success(`Order request sent to ${data.deals?.length || 1} vendor(s)!`);
      notifyCartChanged();
      await fetchCart();
      navigate('/customer/chat');
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const groups = cart?.groups || [];
  const totalItems = cart?.total_items || 0;
  const totalAmount = cart?.total_amount || 0;

  return (
    <div className="min-h-screen bg-[#f2ede4] font-sans pb-24 lg:pb-16 text-[#1a1a1a]">
      {/* ── Top Bar / Header ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e3dccb] px-4 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-[#e3dccb]"
              title="Go Back"
            >
              <FiArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link to="/customer/home" className="hover:text-[#241b15] font-semibold">Home</Link>
              <FiChevronRight size={12} />
              <span className="font-extrabold text-[#1a1a1a]">My Cart</span>
            </div>
          </div>

          {/* Cart Header Badge */}
          <div className="flex items-center gap-2">
            <span className="bg-[#241b15] text-[#d99a3d] text-xs font-black px-3 py-1 rounded-full border border-[#d99a3d]/40 flex items-center gap-1.5">
              <FiShoppingCart size={13} />
              <span>{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
            </span>

            <button
              onClick={fetchCart}
              className="p-2 rounded-xl bg-white border border-[#e3dccb] hover:bg-[#f8f4ec] text-[#1a1a1a] transition cursor-pointer"
              title="Refresh Cart"
            >
              <FiRefreshCw size={14} className={loading ? 'animate-spin text-[#d99a3d]' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Main Body ── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#e3dccb] pb-4">
          <div>
            <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl sm:text-3xl font-black text-[#1a1a1a] uppercase tracking-tight flex items-center gap-2.5">
              <span>Shopping Cart</span>
              <span className="text-base font-extrabold text-[#d99a3d] bg-[#241b15] px-2.5 py-0.5 rounded-lg">
                {totalItems}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Review and manage items you've added from local sellers.
            </p>
          </div>

          {totalItems > 0 && (
            <Link
              to="/customer/search"
              className="text-xs font-black text-[#d99a3d] hover:underline self-start sm:self-auto"
            >
              + Add More Products
            </Link>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-[#241b15] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Loading your cart items...</p>
          </div>
        ) : totalItems === 0 || groups.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Vendor Groups (8 Columns) */}
            <div className="lg:col-span-8 space-y-5">
              <AnimatePresence>
                {groups.map((group) => (
                  <motion.div
                    key={group.vendor_id || group.vendor?._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CartVendorGroup
                      group={group}
                      onUpdateQty={handleUpdateQty}
                      onRemove={handleRemoveItem}
                      updatingId={updatingId}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Right: Order Summary Card (4 Columns) */}
            <div className="lg:col-span-4">
              <CartOrderSummary
                totalAmount={totalAmount}
                totalItems={totalItems}
                vendorCount={groups.length}
                onCheckout={handleCheckout}
                isCheckingOut={checkingOut}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
