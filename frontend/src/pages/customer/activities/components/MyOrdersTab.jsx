import React from 'react';
import { FiClock, FiXCircle, FiStar, FiPackage, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { resolveMediaUrl } from '../../../../lib/api';

export default function MyOrdersTab({
  orders = [],
  onOpenTracker,
  onOpenCancelModal,
  onOpenReview,
  onPrintInvoice,
  onReorder,
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((o) => {
        const itemTitle = o.listing?.title || o.item || 'Order Request Item';
        const isService = o.listing?.type === 'service' || !!o.scheduledVisitTime || (o.address || '').includes('[Scheduled:');
        const isCancelAllowed = o.status === 'pending';
        const canReview = o.status === 'delivered' || o.status === 'completed';

        return (
          <div
            key={o._id || o.id}
            className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start mb-2 border-b border-border/50 pb-2">
                <div>
                  <span className="text-[8px] text-text-tertiary font-bold tracking-wider uppercase block">Order ID</span>
                  <span className="text-[10px] font-mono text-text-secondary font-bold flex items-center gap-1">
                    {(o._id || o.id).substring(12)}...
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(o._id || o.id);
                        toast.success('ID copied!');
                      }}
                      className="text-[8px] px-1 bg-surface rounded hover:text-brand-purple"
                    >
                      Copy
                    </button>
                  </span>
                </div>
                <AdminStatusBadge status={o.status} />
              </div>

              <div className="flex gap-3 my-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0">
                  <img
                    src={resolveMediaUrl(o.listing?.images?.[0] || 'https://via.placeholder.com/150')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-text-primary truncate">{itemTitle}</h4>
                  <p className="text-[10px] text-text-tertiary">
                    From: {o.vendor?.vendorProfile?.shopName || o.vendor?.name || 'Seller'}
                  </p>
                  <p className="text-[10px] font-semibold text-text-secondary mt-1">
                    Quantity: {o.quantity || 1} • Total: <span className="text-emerald-600 font-bold">₹{(o.price || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-surface-secondary/40 rounded-xl border border-border/60 text-[10px] text-text-secondary space-y-1 mt-2">
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="font-bold uppercase text-[9px] text-emerald-600">{o.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-bold capitalize">{isService ? 'Service Booking' : 'Product Purchase'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Placed On:</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                {o.bookingDate && (
                  <div className="flex justify-between text-brand-purple font-semibold">
                    <span>Scheduled Visit:</span>
                    <span>{o.bookingDate} {o.bookingTime ? `at ${o.bookingTime}` : ''}</span>
                  </div>
                )}
                {o.expectedDeliveryDate && (
                  <div className="flex justify-between">
                    <span>Expected Delivery:</span>
                    <span>{new Date(o.expectedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
                {o.status === 'cancelled' && (
                  <div className="pt-1.5 border-t border-border/40 text-red-600 flex justify-between font-bold">
                    <span>Refunded:</span>
                    <span>₹{(o.refundAmount ?? o.price).toLocaleString()} ({o.refundPercentage ?? 100}%)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-border/50 pt-3">
              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenTracker(o)}
                  className="py-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                >
                  <FiClock size={11} /> Track Order
                </button>

                {isCancelAllowed ? (
                  <button
                    onClick={() => onOpenCancelModal(o)}
                    className="py-2 border border-error/20 bg-error-light/5 hover:bg-error-light/10 text-error rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <FiXCircle size={11} /> Cancel Request
                  </button>
                ) : canReview ? (
                  <button
                    onClick={() => onOpenReview(o.listing?._id || o.listing?.id || '', o.vendor?._id || o.vendor?.id)}
                    className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <FiStar size={11} /> Leave Review
                  </button>
                ) : (
                  <button
                    onClick={() => onPrintInvoice(o)}
                    className="py-2 border border-border text-text-secondary hover:bg-surface-secondary rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <FiPackage size={11} /> Print Receipt
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-[9px] text-text-tertiary">
                <button
                  onClick={() => navigate(`/customer/chat?vendorId=${o.vendor?._id || o.vendor?.id}`)}
                  className="hover:text-brand-purple font-semibold flex items-center gap-1"
                >
                  <FiMessageSquare size={10} /> Chat with Seller
                </button>
                <button
                  onClick={() => onReorder(o.listing?._id || o.listing?.id, o.quantity, o.address)}
                  className="hover:text-brand-purple font-semibold flex items-center gap-1"
                >
                  <FiRefreshCw size={10} /> Reorder Item
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
