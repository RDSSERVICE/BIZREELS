import React, { useState } from 'react';
import {
  FiCalendar, FiClock, FiMapPin, FiX, FiCheckCircle,
  FiCreditCard, FiDollarSign, FiShield
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import toast from 'react-hot-toast';
import api from '../../../../lib/api';

export default function BookServiceModal({
  isOpen,
  service,
  onClose,
  onSuccess,
}) {
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vendor_upi');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !service) return null;

  const serviceId = service._id || service.id;
  const vendorObj = service.vendor || service.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || 'Verified Professional';
  const priceVal = Number(service.sellingPrice || service.salePrice || service.price || 0);
  const vendorUpi = vendorObj.vendorProfile?.upiId || vendorObj.upiId || vendorObj.vendorProfile?.upi_id || 'vendor@upi';

  // Realtime Cancellation Policies from service document
  const policies = service.serviceDetails?.policies || {};
  const freeHours = policies.freeCancellationHours ?? 24;
  const windowHours = policies.withinWindowHours ?? 24;
  const windowRefund = policies.withinWindowRefundPercent ?? 50;
  const afterRefund = policies.afterVisitRefundPercent ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      return toast.error('Please select a booking date');
    }
    if (!bookingAddress.trim()) {
      return toast.error('Please enter the full service address');
    }

    setLoading(true);
    try {
      await api.post('/v1/orders', {
        listingId: serviceId,
        quantity: 1,
        address: `${bookingAddress.trim()} [Date: ${bookingDate}, Slot: ${bookingTime}] ${bookingNotes ? `| Notes: ${bookingNotes.trim()}` : ''}`,
        paymentMethod,
        paymentDetails: {
          method: paymentMethod,
          upiId: vendorUpi,
          bookingDate,
          bookingTime,
          bookingNotes: bookingNotes.trim(),
        },
      });

      toast.success('Service appointment booked successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to request service booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-3 sm:p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-2xl border border-[#e3dccb] shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e3dccb] bg-[#f8f4ec]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-bold shadow-xs">
              <FiCalendar size={16} />
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#1a1a1a]">
              Book Service Appointment
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-[#1a1a1a] bg-white rounded-lg border border-[#e3dccb] transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          
          {/* Service Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Service Title
            </label>
            <input
              type="text"
              disabled
              value={service.title || 'Professional Service'}
              className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] font-bold cursor-not-allowed"
            />
          </div>

          {/* Booking Date & Preferred Time */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Booking Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Preferred Time
              </label>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
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

          {/* Full Service Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Full Service Address
            </label>
            <input
              type="text"
              required
              value={bookingAddress}
              onChange={(e) => setBookingAddress(e.target.value)}
              placeholder="Street, Building, Flat details, City, Pin code..."
              className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
            />
          </div>

          {/* Booking Remarks / Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Booking Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="e.g. Bring spare filters, AC gas check..."
              className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d] resize-none"
            />
          </div>

          {/* Direct Vendor Payment Method */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[10.5px] font-extrabold text-slate-600 uppercase">
              Payment Method (Pay Directly to Vendor)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div
                onClick={() => setPaymentMethod('vendor_upi')}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  paymentMethod === 'vendor_upi'
                    ? 'bg-amber-50/70 border-[#d99a3d] text-[#1a1a1a]'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600'
                }`}
              >
                <FiCreditCard size={14} className="mx-auto text-[#d99a3d] mb-0.5" />
                <span className="text-[10px] font-bold block">Vendor UPI</span>
              </div>

              <div
                onClick={() => setPaymentMethod('vendor_qr')}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  paymentMethod === 'vendor_qr'
                    ? 'bg-amber-50/70 border-[#d99a3d] text-[#1a1a1a]'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600'
                }`}
              >
                <BsQrCode size={14} className="mx-auto text-[#d99a3d] mb-0.5" />
                <span className="text-[10px] font-bold block">Vendor QR</span>
              </div>

              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-2 rounded-xl border transition cursor-pointer text-center ${
                  paymentMethod === 'cod'
                    ? 'bg-amber-50/70 border-[#d99a3d] text-[#1a1a1a]'
                    : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600'
                }`}
              >
                <FiDollarSign size={14} className="mx-auto text-emerald-600 mb-0.5" />
                <span className="text-[10px] font-bold block">Cash on Visit</span>
              </div>
            </div>
          </div>

          {/* REALTIME SERVICE CANCELLATION & REFUND POLICY DISPLAY */}
          <div className="p-3 bg-[#f8f4ec] border border-[#d99a3d]/30 rounded-xl space-y-1.5">
            <span className="text-[10.5px] font-black text-[#d99a3d] uppercase tracking-wider block flex items-center gap-1">
              🛡️ Cancellation & Refund Policy
            </span>
            <div className="space-y-1 text-[10.5px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong>Free Cancellation:</strong> Up to {freeHours}h before scheduled visit (100% Refund).
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong>Within {windowHours}h:</strong> {windowRefund}% Refund back to wallet/account.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>
                  <strong>After Visit Time:</strong> {afterRefund}% Refund.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !bookingDate || !bookingAddress.trim()}
            className="w-full py-2.5 mt-2 bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white rounded-xl text-xs font-black transition-all duration-200 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Confirming Reservation...' : 'Confirm Booking Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
