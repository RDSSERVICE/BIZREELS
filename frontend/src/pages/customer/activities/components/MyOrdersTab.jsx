import React from 'react';
import { FiPackage, FiTruck, FiStar, FiX, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

const DEFAULT_ORDER_IMG = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80';

export default function MyOrdersTab({
  orders = [],
  onTrackOrder,
  onOpenCancelModal,
  onOpenReviewModal,
}) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-[#e3dccb] space-y-2 p-6 shadow-xs font-sans">
        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] text-[#d99a3d] flex items-center justify-center mx-auto mb-2 border border-[#e3dccb]">
          <FiPackage size={22} />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a]">No order requests placed yet</p>
        <p className="text-xs">Find products and services on BizReels and place orders directly to local vendors.</p>
        <button
          onClick={() => navigate('/customer/search')}
          className="mt-3 px-4 py-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {orders.map((o) => {
        const orderId = o._id || o.id;
        const listing = o.listing || {};
        const vendor = o.vendor || listing.vendor || {};
        const vendorName = vendor.shopName || vendor.name || 'Verified Vendor';
        const rawImg = listing.images?.[0] || listing.image || listing.mediaUrl || DEFAULT_ORDER_IMG;
        const imgUrl = resolveMediaUrl(rawImg);

        const status = (o.status || 'pending').toLowerCase();
        const paymentStatus = (o.paymentStatus || 'unpaid').toLowerCase();
        const method = o.paymentMethod || 'vendor_payment';

        return (
          <div
            key={orderId}
            className="bg-white rounded-xl border border-[#e3dccb] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            {/* Header: Order ID, Date & Status Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dccb] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">ORDER #{String(orderId).slice(-6).toUpperCase()}</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Payment Method Badge */}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb]">
                  {method === 'cod' ? '💵 COD' : method === 'wallet' ? '💳 Wallet' : '📲 Direct UPI/QR'}
                </span>

                {/* Status Pill */}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  status === 'shipped' || status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Middle: Item Image, Title, Vendor, Quantity & Price */}
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] overflow-hidden shrink-0">
                <OptimizedImage
                  src={imgUrl}
                  alt={listing.title || 'Ordered Item'}
                  className="w-full h-full object-cover"
                  width={160}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#1a1a1a] truncate">{listing.title || 'Product/Service Order'}</h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Vendor: <strong className="text-[#1a1a1a]">{vendorName}</strong>
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-slate-500">Qty: <strong>{o.quantity || 1}</strong></span>
                  <span className="text-sm font-black text-[#1a1a1a]">₹{Number(o.price || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Address & Booking Notes if any */}
            {o.address && (
              <div className="text-[11px] text-slate-500 bg-[#f8f4ec] p-2.5 rounded-lg border border-[#e3dccb] flex items-center gap-1.5">
                <FiMapPin size={12} className="text-[#d99a3d] shrink-0" />
                <span className="truncate">Delivery Address: {o.address}</span>
              </div>
            )}

            {/* Actions: Track, Cancel, Review */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#e3dccb]">
              {status !== 'cancelled' && status !== 'delivered' && (
                <button
                  type="button"
                  onClick={() => onOpenCancelModal(o)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold transition cursor-pointer"
                >
                  Cancel Order
                </button>
              )}

              <button
                type="button"
                onClick={() => onTrackOrder(o)}
                className="px-3.5 py-1.5 rounded-lg bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] border border-[#e3dccb] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FiTruck size={12} className="text-[#d99a3d]" />
                <span>Track Status</span>
              </button>

              {status === 'delivered' && (
                <button
                  type="button"
                  onClick={() => onOpenReviewModal(listing._id || listing.id, vendor._id || vendor.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <FiStar size={12} />
                  <span>Leave Review</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
