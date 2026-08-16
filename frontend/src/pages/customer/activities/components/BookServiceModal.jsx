import React from 'react';
import { FiCalendar } from 'react-icons/fi';

export default function BookServiceModal({
  isOpen,
  service,
  onClose,
  onSubmit,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  bookingAddress,
  setBookingAddress,
  bookingNotes,
  setBookingNotes,
}) {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <form onSubmit={onSubmit} className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiCalendar className="text-brand-purple" /> Book Service Appointment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">Service Title</label>
            <input
              type="text"
              disabled
              value={service.title}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-tertiary font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">Booking Date</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">Preferred Time</label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">Full Service Address</label>
            <input
              type="text"
              required
              value={bookingAddress}
              onChange={(e) => setBookingAddress(e.target.value)}
              placeholder="Street, Building, Flat details, City, Pin code..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">Booking Remarks / Notes</label>
            <textarea
              rows={2}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="e.g. Bring spare filters, AC gas check..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* SERVICE CANCELLATION POLICY DISPLAY */}
          <div className="p-3 bg-surface border border-brand-purple/20 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider block flex items-center gap-1">
              🛡️ Cancellation & Refund Policy (Pre-Payment)
            </span>
            {(() => {
              const policies = service.serviceDetails?.policies || {};
              const freeHours = policies.freeCancellationHours ?? 24;
              const windowHours = policies.withinWindowHours ?? 24;
              const windowRefund = policies.withinWindowRefundPercent ?? 50;
              const afterRefund = policies.afterVisitRefundPercent ?? 0;
              return (
                <div className="space-y-1 text-[10px] text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>Free Cancellation:</strong> Up to {freeHours}h before scheduled visit (100% Refund).</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Within {windowHours}h:</strong> {windowRefund}% Refund back to wallet.</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span><strong>After Visit Time:</strong> {afterRefund}% Refund.</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
        >
          Confirm Booking Reservation
        </button>
      </form>
    </div>
  );
}
