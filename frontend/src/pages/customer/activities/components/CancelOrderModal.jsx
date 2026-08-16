import React from 'react';
import { FiXCircle } from 'react-icons/fi';

export default function CancelOrderModal({
  isOpen,
  order,
  reason,
  setReason,
  submitting,
  onClose,
  onSubmit,
}) {
  if (!isOpen || !order) return null;

  const isService = order.listing?.type === 'service' || !!order.scheduledVisitTime || !!order.bookingDate;
  const policy = order.cancellationPolicySnapshot || order.listing?.serviceDetails?.policies || {
    freeCancellationHours: 24,
    withinWindowHours: 24,
    withinWindowRefundPercent: 50,
    afterVisitRefundPercent: 0,
  };
  const freeHours = policy.freeCancellationHours ?? 24;
  const windowHours = policy.withinWindowHours ?? 24;
  const windowRefund = policy.withinWindowRefundPercent ?? 50;
  const afterRefund = policy.afterVisitRefundPercent ?? 0;

  let visitTime = order.scheduledVisitTime;
  if (!visitTime && order.bookingDate) {
    try {
      visitTime = new Date(`${order.bookingDate} ${order.bookingTime || '10:00 AM'}`);
    } catch (e) {}
  }

  let refundPercent = 100;
  let diffHours = null;
  let tierText = 'Free cancellation (100% full refund)';

  if (isService && visitTime && !isNaN(new Date(visitTime).getTime())) {
    const now = new Date();
    diffHours = (new Date(visitTime).getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours >= freeHours) {
      refundPercent = 100;
      tierText = `Free cancellation (${diffHours.toFixed(1)}h before visit ≥ ${freeHours}h free limit)`;
    } else if (diffHours > 0) {
      refundPercent = windowRefund;
      tierText = `Within ${windowHours}h window before visit (${diffHours.toFixed(1)}h remaining): ${windowRefund}% refund`;
    } else {
      refundPercent = afterRefund;
      tierText = `After scheduled visit time has passed: ${afterRefund}% refund`;
    }
  }

  const estimatedRefundAmount = Math.round((order.price * refundPercent) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <form onSubmit={onSubmit} className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiXCircle className="text-red-500" /> Cancel Order & Refund Request
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-surface rounded-xl border border-border space-y-1">
            <h4 className="font-bold text-xs text-text-primary">{order.listing?.title || 'Order Item'}</h4>
            <p className="text-[11px] text-text-secondary">
              Total Paid: <span className="font-bold text-emerald-600">₹{(order.price || 0).toLocaleString()}</span>
            </p>
            {visitTime && (
              <p className="text-[10px] text-text-tertiary">
                Scheduled Visit: <strong>{new Date(visitTime).toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* Calculated Refund Card */}
          <div className="p-3.5 bg-gradient-to-br from-brand-purple/10 to-brand-pink/10 rounded-xl border border-brand-purple/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-brand-purple">Applicable Refund Rule</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                refundPercent === 100
                  ? 'bg-emerald-500/20 text-emerald-700'
                  : refundPercent > 0
                  ? 'bg-amber-500/20 text-amber-700'
                  : 'bg-red-500/20 text-red-700'
              }`}>
                {refundPercent}% Refund
              </span>
            </div>
            <p className="text-xs text-text-primary font-medium">{tierText}</p>
            <div className="pt-2 border-t border-brand-purple/20 flex justify-between items-center">
              <span className="text-xs font-bold text-text-secondary">Amount Credited to Wallet:</span>
              <span className="text-sm font-black text-emerald-600">₹{estimatedRefundAmount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Rescheduled work, bought elsewhere..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-premium transition disabled:opacity-50"
          >
            {submitting ? 'Cancelling...' : `Confirm Cancellation (Refund ₹${estimatedRefundAmount.toLocaleString()})`}
          </button>
        </div>
      </form>
    </div>
  );
}
