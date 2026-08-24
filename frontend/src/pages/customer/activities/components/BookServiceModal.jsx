import React, { useState } from 'react';
import {
  FiCalendar, FiClock, FiMapPin, FiX, FiCheckCircle,
  FiCreditCard, FiDollarSign, FiShield, FiCopy, FiAlertTriangle, FiLock, FiCheck
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import toast from 'react-hot-toast';
import api, { resolveMediaUrl } from '../../../../lib/api';

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

  const [copiedKey, setCopiedKey] = useState('');
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  if (!isOpen || !service) return null;

  const serviceId = service._id || service.id;
  const vendorObj = service.vendor || service.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || 'Professional Vendor';
  const priceVal = Number(service.sellingPrice || service.salePrice || service.price || 0);

  const isVendorVerified = (vendor) => {
    if (!vendor) return false;
    if (typeof vendor !== 'object') return false;
    if (vendor.kyc_status === 'approved') return true;
    if (vendor.is_subscribed_verified === true) return true;
    if (vendor.isVerified === true || vendor.is_verified === true) return true;
    if (vendor.vendorProfile?.isVerified === true || vendor.vendorProfile?.is_verified === true) return true;
    if (vendor.verified_badge === true) return true;
    const status = vendor.vendorProfile?.verificationStatus || vendor.verificationStatus || vendor.vendorProfile?.tier || vendor.tier;
    if (['verified_vendor', 'premium_verified', 'trusted_vendor', 'premium_vendor', 'verified'].includes(status)) {
      return true;
    }
    if (vendor.vendorProfile?.contactVerified?.whatsapp || vendor.vendorProfile?.contactVerified?.mobile || vendor.isPhoneVerified) {
      return true;
    }
    const docs = vendor.vendorProfile?.documents || {};
    if (docs.pan?.status === 'approved' || docs.pan?.verified || docs.aadhaar?.status === 'approved' || docs.aadhaar?.verified || docs.gst?.status === 'approved' || docs.gst?.verified || docs.shopLicense?.status === 'approved') {
      return true;
    }
    const payment = vendor.vendorProfile?.paymentDetails || vendor.vendorProfile?.payoutDetails || vendor.paymentDetails || {};
    if (payment.upiVerified || payment.verified || payment.status === 'approved') {
      return true;
    }
    // If vendor set up payment details during onboarding or in profile
    if (payment.upiId || payment.bankAccount || vendor.vendorProfile?.upiId || vendor.vendorProfile?.bankDetails?.accountNumber || vendor.vendorProfile?.bankAccount) {
      return true;
    }
    return false;
  };

  const isVerified = isVendorVerified(vendorObj);
  const vp = vendorObj.vendorProfile || {};
  const vendorPayment = vp.paymentDetails || vp.payoutDetails || vendorObj.paymentDetails || vp.bankDetails || vendorObj.bankDetails || {};
  const vendorUpi = vendorPayment.upiId || vendorPayment.upi_id || vendorPayment.maskedUpi || vp.upiId || vp.upi_id || vp.upi || vendorObj.upiId || vendorObj.upi || '';
  const vendorQr = vendorPayment.qrCodeUrl || vendorPayment.qrCode || vendorPayment.qr_code || vp.qrCodeUrl || vp.qrCode || vp.qr_code || vendorObj.qrCode || vendorObj.qrCodeUrl || '';
  const vendorBank = {
    bankName: vendorPayment.bankName || vendorPayment.bank_name || vp.bankDetails?.bankName || vp.bankName || vendorObj.bankDetails?.bankName || 'Commercial Bank',
    accountHolderName: vendorPayment.verifiedAccountName || vendorPayment.accountHolderName || vendorPayment.account_holder_name || vp.bankDetails?.accountHolderName || vendorName || '',
    accountNumber: vendorPayment.bankAccount || vendorPayment.accountNumber || vendorPayment.account_number || vendorPayment.maskedAccount || vp.bankDetails?.accountNumber || vendorObj.bankDetails?.accountNumber || '',
    ifscCode: vendorPayment.ifscCode || vendorPayment.ifsc_code || vendorPayment.ifsc || vp.bankDetails?.ifscCode || vendorObj.bankDetails?.ifscCode || '',
    branchName: vendorPayment.branchName || vendorPayment.branch_name || vp.bankDetails?.branchName || vendorPayment.city || '',
  };

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
          <div className="space-y-2.5 pt-1">
            <label className="block text-[10.5px] font-extrabold text-slate-600 uppercase">
              Payment Method (Pay Directly to Vendor)
            </label>

            {/* Safety & Fraud Protection Advisory */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/80 space-y-1">
              <div className="flex items-start gap-2">
                <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={15} />
                <div className="space-y-0.5 text-left">
                  <p className="text-[11px] text-amber-950 font-bold leading-tight">
                    साथ में यह मेसेज की payment भुगतान वेंडर और यूजर संतुष्ट होने पर ही करे, bizreel platform किसी भी प्रकार की वाद विवाद या फ्रॉड के लिए जिम्मेदार नही होगा।
                  </p>
                  <p className="text-[9.5px] text-amber-800 font-medium">
                    (Pay only upon mutual satisfaction after service verification. BizReels is not liable for disputes.)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'vendor_upi', label: 'UPI / GPay', icon: FiCreditCard, color: 'text-[#d99a3d]' },
                { id: 'vendor_qr', label: 'Vendor QR', icon: BsQrCode, color: 'text-[#d99a3d]' },
                { id: 'bank_transfer', label: 'Bank', icon: FiShield, color: 'text-[#d99a3d]' },
                { id: 'cod', label: 'On Visit', icon: FiDollarSign, color: 'text-emerald-600' },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2 rounded-xl border transition cursor-pointer text-center flex flex-col items-center justify-center ${
                      paymentMethod === method.id
                        ? 'bg-amber-50/70 border-[#d99a3d] text-[#1a1a1a] font-extrabold shadow-2xs'
                        : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600'
                    }`}
                  >
                    <Icon size={14} className={`${method.color} mb-0.5`} />
                    <span className="text-[9.5px] font-bold leading-tight">{method.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Details / Unverified Security Panel */}
            <div className="p-3 rounded-xl border bg-white border-[#e3dccb] transition-all">
              {paymentMethod === 'vendor_upi' && (
                isVerified ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FiCreditCard size={13} className="text-emerald-600" />
                        <span className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1">
                          Verified Professional UPI
                          <FiCheckCircle className="text-emerald-600" size={11} />
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    {vendorUpi ? (
                      <div className="p-2 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase block">UPI ID</span>
                          <span className="text-xs font-black text-[#1a1a1a] font-mono select-all truncate block">{vendorUpi}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(vendorUpi, 'upi')}
                          className="px-2 py-1 rounded bg-white border border-[#e3dccb] text-[10px] font-bold text-[#1a1a1a] flex items-center gap-1 shrink-0"
                        >
                          {copiedKey === 'upi' ? <><FiCheck size={10} className="text-emerald-600" /> Copied</> : <><FiCopy size={10} /> Copy</>}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500">ℹ️ Vendor UPI not set. You can pay after service visit.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                      <FiLock size={12} className="text-amber-700" />
                      <span>UPI Advance Details Hidden (Unverified)</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-snug">
                      Advance UPI details are restricted for unverified accounts. Please select <strong>Pay on Visit</strong>.
                    </p>
                  </div>
                )
              )}

              {paymentMethod === 'vendor_qr' && (
                isVerified ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BsQrCode size={13} className="text-emerald-600" />
                        <span className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1">
                          Verified Payment QR Code
                          <FiCheckCircle className="text-emerald-600" size={11} />
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#f8f4ec] border border-[#e3dccb]">
                      {vendorQr ? (
                        <img
                          src={resolveMediaUrl(vendorQr)}
                          alt="Vendor QR"
                          className="w-20 h-20 object-contain rounded bg-white p-1 border border-[#e3dccb]"
                        />
                      ) : vendorUpi ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${vendorUpi}&pn=${encodeURIComponent(vendorName)}&cu=INR`)}`}
                          alt="Dynamic QR"
                          className="w-20 h-20 object-contain rounded bg-white p-1 border border-[#e3dccb]"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[9px] text-center p-1">
                          <BsQrCode size={16} className="mb-0.5" />
                          <span>No QR</span>
                        </div>
                      )}
                      <div className="text-[10.5px] min-w-0 space-y-0.5">
                        <p className="font-bold text-[#1a1a1a]">Scan via GPay / PhonePe / Paytm</p>
                        {vendorUpi && <p className="text-slate-500 font-mono text-[10px] truncate">UPI: {vendorUpi}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                      <FiLock size={12} className="text-amber-700" />
                      <span>QR Code Hidden (Unverified)</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-snug">
                      QR advance payment is restricted for unverified vendors. Please choose <strong>Pay on Visit</strong>.
                    </p>
                  </div>
                )
              )}

              {paymentMethod === 'bank_transfer' && (
                isVerified ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FiShield size={13} className="text-emerald-600" />
                        <span className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1">
                          Verified Bank Details
                          <FiCheckCircle className="text-emerald-600" size={11} />
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </div>

                    {(vendorBank.accountNumber || vendorBank.ifscCode) ? (
                      <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-[10.5px]">
                        <div>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Holder</span>
                          <p className="font-bold text-[#1a1a1a] truncate">{vendorBank.accountHolderName || vendorName}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Bank</span>
                          <p className="font-bold text-[#1a1a1a] truncate">{vendorBank.bankName || 'Bank'}</p>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase block">A/C No</span>
                          <div className="flex items-center gap-1">
                            <p className="font-mono font-bold text-[#1a1a1a] truncate">{vendorBank.accountNumber}</p>
                            <button type="button" onClick={() => handleCopy(vendorBank.accountNumber, 'acc')} className="text-slate-500">
                              {copiedKey === 'acc' ? <FiCheck size={9} className="text-emerald-600" /> : <FiCopy size={9} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase block">IFSC</span>
                          <div className="flex items-center gap-1">
                            <p className="font-mono font-bold text-[#1a1a1a] truncate">{vendorBank.ifscCode}</p>
                            <button type="button" onClick={() => handleCopy(vendorBank.ifscCode, 'ifsc')} className="text-slate-500">
                              {copiedKey === 'ifsc' ? <FiCheck size={9} className="text-emerald-600" /> : <FiCopy size={9} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500">ℹ️ Bank details not provided by vendor.</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                      <FiLock size={12} className="text-amber-700" />
                      <span>Bank Details Hidden (Unverified)</span>
                    </div>
                    <p className="text-[10px] text-amber-800 leading-snug">
                      Bank details are hidden for unverified accounts. Please select <strong>Pay on Visit</strong>.
                    </p>
                  </div>
                )
              )}

              {paymentMethod === 'cod' && (
                <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-0.5">
                  <div className="flex items-center gap-1 text-emerald-900 font-bold text-[11px]">
                    <FiDollarSign size={13} className="text-emerald-600" />
                    <span>Pay in Person After Service Completion</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-tight">
                    No advance payment required. Inspect the service upon completion and pay directly in cash or UPI.
                  </p>
                </div>
              )}
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
