import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiStar, FiHeart, FiBookmark, FiShare2, FiPhone,
  FiMessageSquare, FiShoppingCart, FiClock, FiCheckCircle,
  FiX, FiTruck, FiShield, FiCreditCard, FiDollarSign
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { FaWhatsapp } from 'react-icons/fa';
import OptimizedImage from '../../../../components/common/OptimizedImage';
import { resolveMediaUrl } from '../../../../lib/api';

function OfferCountdown({ validTill }) {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(validTill) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' ') + ' left');
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [validTill]);

  if (timeLeft === 'Expired') {
    return (
      <span className="text-red-500 font-bold text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded border border-red-200">
        Expired
      </span>
    );
  }

  return (
    <span className="text-[#d99a3d] font-bold text-[10px] bg-[#d99a3d]/10 border border-[#d99a3d]/30 px-2 py-0.5 rounded flex items-center gap-1 w-fit animate-pulse">
      <FiClock size={11} /> {timeLeft}
    </span>
  );
}

export default function ListingDetailModal({
  selectedItem,
  onClose,
  detailDistStr,
  savedItems,
  likedItems,
  toggleSave,
  toggleLike,
  handleShare,
  handleWhatsApp,
  handleCallRequest,
  handleInquire,
  handleOrderRequest,
  reviewsList,
  reviewRating,
  setReviewRating,
  reviewText,
  setReviewText,
  handleAddReview,
  onOpenBookService,
}) {
  const isService = selectedItem?.type === 'service';

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderAddress, setOrderAddress] = useState('');
  const [orderQty, setOrderQty] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM - 12:00 PM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vendor_upi'); // 'vendor_upi', 'vendor_qr', 'cod', 'bank_transfer'
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  if (!selectedItem) return null;

  const itemId = selectedItem._id || selectedItem.id;
  const isSaved = !!savedItems[itemId];
  const isLiked = !!likedItems[itemId];

  const vendorObj = selectedItem.vendor || selectedItem.vendorId || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || selectedItem.vendorName || 'Verified Vendor';
  const vendorAvatar = vendorObj.avatarUrl || vendorObj.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
  const city = selectedItem.city || vendorObj.city || selectedItem.location?.city || 'Local Shop';

  const images = (selectedItem.images && selectedItem.images.length > 0)
    ? selectedItem.images
    : [selectedItem.image || selectedItem.mediaUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f'];

  const priceVal = Number(selectedItem.sellingPrice || selectedItem.salePrice || selectedItem.price || 0);
  const originalPrice = Number(selectedItem.actualPrice || selectedItem.regularPrice || 0);

  // Realtime Cancellation Policies from service document
  const policies = selectedItem?.serviceDetails?.policies || {};
  const freeHours = policies.freeCancellationHours ?? 24;
  const windowHours = policies.withinWindowHours ?? 24;
  const windowRefund = policies.withinWindowRefundPercent ?? 50;
  const afterRefund = policies.afterVisitRefundPercent ?? 0;

  // Vendor payment details (UPI / QR / Bank)
  const vendorUpi = vendorObj.vendorProfile?.upiId || vendorObj.upiId || vendorObj.vendorProfile?.upi_id || 'vendor@upi';
  const vendorPhone = vendorObj.phone || vendorObj.vendorProfile?.whatsapp || vendorObj.vendorProfile?.whatsappNumber || '';
  const vendorQr = vendorObj.vendorProfile?.qrCode || vendorObj.qrCode || vendorObj.vendorProfile?.qrCodeUrl || null;
  const vendorBank = vendorObj.vendorProfile?.bankDetails || vendorObj.bankDetails || null;

  const onConfirmOrder = async (e) => {
    e.preventDefault();
    if (!orderAddress.trim()) {
      return;
    }
    setOrderSubmitting(true);
    try {
      await handleOrderRequest(selectedItem, {
        address: orderAddress.trim(),
        quantity: isService ? 1 : (Number(orderQty) || 1),
        bookingDate: isService ? bookingDate : '',
        bookingTime: isService ? bookingTime : '',
        bookingNotes: isService ? bookingNotes : '',
        paymentMethod,
        paymentDetails: {
          method: paymentMethod,
          upiId: vendorUpi,
        }
      });
      setShowOrderForm(false);
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans animate-fade-in">
      <div className="bg-white border border-[#e3dccb] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-scale-in">

        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between border-b border-[#e3dccb] pb-4">
          <div className="flex items-center gap-3">
            <img
              src={resolveMediaUrl(vendorAvatar)}
              alt={vendorName}
              className="w-11 h-11 rounded-full object-cover border border-[#e3dccb] shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#d99a3d]/15 text-[#1a1a1a] rounded text-[10px] font-extrabold uppercase">
                  {selectedItem.type || 'Product'} • {selectedItem.category || 'General'}
                </span>
                {detailDistStr && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    📍 {detailDistStr}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] mt-0.5">{selectedItem.title}</h2>
              <p
                onClick={() => {
                  const vendorId = vendorObj._id || vendorObj.id || selectedItem.vendor;
                  if (vendorId) {
                    onClose();
                    navigate(`/customer/vendor/${vendorId}`);
                  }
                }}
                className="text-xs text-slate-500 hover:text-[#7c3aed] cursor-pointer transition flex items-center gap-1 mt-0.5 font-semibold"
              >
                <FiMapPin className="text-[#d99a3d]" size={12} />
                <span>{vendorName} ({city})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#f8f4ec] text-slate-500 hover:text-[#1a1a1a] hover:bg-[#e3dccb] flex items-center justify-center font-bold transition cursor-pointer shrink-0"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Media & Product Overview ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Media Preview & Thumbnails */}
          <div className="space-y-2.5">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#f8f4ec] border border-[#e3dccb]">
              <OptimizedImage
                src={resolveMediaUrl(images[selectedImgIdx] || images[0])}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
                width={600}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition cursor-pointer shrink-0 ${selectedImgIdx === idx ? 'border-[#d99a3d]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                  >
                    <OptimizedImage src={resolveMediaUrl(img)} alt="" className="w-full h-full object-cover" width={100} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing, Description & Action Buttons */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              {/* Price & Stock Badge */}
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-black text-[#1a1a1a]">
                  ₹{priceVal.toLocaleString('en-IN')}
                </span>
                {originalPrice > priceVal && (
                  <span className="text-xs text-slate-400 line-through">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                  In Stock
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                {selectedItem.description || selectedItem.shortDescription || 'High quality product/service available directly from verified local shop vendor.'}
              </p>

              {/* Labels / Specs */}
              {selectedItem.labels?.length > 0 && (
                <div className="pt-3 border-t border-[#e3dccb] mt-3 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Product Specifications:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.labels.map((l, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#f8f4ec] text-[#1a1a1a] rounded-md text-[11px] font-semibold border border-[#e3dccb]">
                        <strong className="text-slate-500">{l.key}:</strong> {l.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Customer Actions Menu (Like, Save, Share, WhatsApp) ── */}
            <div className="space-y-2.5 pt-3 border-t border-[#e3dccb]">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Quick Actions:
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => toggleLike(itemId)}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${isLiked ? 'bg-red-50 border-red-300 text-red-600' : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:text-red-500'
                    }`}
                >
                  <FiHeart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSave(itemId)}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${isSaved ? 'bg-amber-50 border-amber-300 text-[#d99a3d]' : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-600 hover:text-[#d99a3d]'
                    }`}
                >
                  <FiBookmark size={16} className={isSaved ? 'fill-[#d99a3d] text-[#d99a3d]' : ''} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(selectedItem)}
                  className="p-2 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] text-xs font-bold text-slate-600 hover:text-[#1a1a1a] flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  <FiShare2 size={16} />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsApp(selectedItem)}
                  className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-700 hover:bg-emerald-100 flex flex-col items-center gap-1 transition cursor-pointer"
                >
                  <FaWhatsapp size={16} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Inquiry & Order Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCallRequest(selectedItem)}
                  className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FiPhone size={13} />
                  <span className="truncate">Call Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInquire(selectedItem)}
                  className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#7c3aed] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FiMessageSquare size={13} />
                  <span className="truncate">Chat / Inquiry</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isService) {
                      if (onOpenBookService) onOpenBookService(selectedItem);
                    } else {
                      setShowOrderForm(!showOrderForm);
                    }
                  }}
                  className="py-2.5 px-2 rounded-xl bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  {isService ? <FiClock size={13} /> : <FiShoppingCart size={13} />}
                  <span className="truncate">
                    {isService
                      ? 'Book Service'
                      : showOrderForm ? 'Hide Order' : 'Order Now'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── DIRECT VENDOR PAYMENT & ORDER/BOOKING REQUEST FORM ── */}
        {showOrderForm && (
          <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-2.5">
              <div>
                <h3 className="text-sm font-black text-[#1a1a1a] flex items-center gap-1.5">
                  {isService ? <FiClock className="text-[#d99a3d]" /> : <FiShoppingCart className="text-[#d99a3d]" />}
                  <span>{isService ? 'Direct Service Booking Request' : 'Direct Vendor Order Request'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isService
                    ? 'Schedule your service visit. Payment is made directly to the service provider via UPI, QR code, or Cash.'
                    : 'Payment is made directly to the vendor via UPI, QR code, or Cash on Delivery.'}
                </p>
              </div>
              <span className="text-xs font-black text-[#1a1a1a] bg-white px-2.5 py-1 rounded-md border border-[#e3dccb]">
                {isService
                  ? `Charge: ₹${priceVal.toLocaleString('en-IN')}`
                  : `Total: ₹${(priceVal * (Number(orderQty) || 1)).toLocaleString('en-IN')}`}
              </span>
            </div>

            {/* Vendor Payment Methods Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div
                onClick={() => setPaymentMethod('vendor_upi')}
                className={`p-3 rounded-xl border transition cursor-pointer ${paymentMethod === 'vendor_upi'
                    ? 'bg-white border-[#d99a3d] shadow-xs'
                    : 'bg-white/60 border-[#e3dccb] hover:border-slate-400'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <FiCreditCard className="text-[#d99a3d]" />
                  <span>Vendor UPI</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
                  {vendorUpi}
                </p>
              </div>

              <div
                onClick={() => setPaymentMethod('vendor_qr')}
                className={`p-3 rounded-xl border transition cursor-pointer ${paymentMethod === 'vendor_qr'
                    ? 'bg-white border-[#d99a3d] shadow-xs'
                    : 'bg-white/60 border-[#e3dccb] hover:border-slate-400'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <BsQrCode className="text-[#d99a3d]" />
                  <span>Vendor QR Code</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Scan & pay at visit / delivery
                </p>
              </div>

              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border transition cursor-pointer ${paymentMethod === 'cod'
                    ? 'bg-white border-[#d99a3d] shadow-xs'
                    : 'bg-white/60 border-[#e3dccb] hover:border-slate-400'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <FiDollarSign className="text-emerald-600" />
                  <span>{isService ? 'Cash after Service' : 'Cash on Delivery'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pay cash to vendor directly
                </p>
              </div>
            </div>

            <form onSubmit={onConfirmOrder} className="space-y-3">
              {isService ? (
                /* Service Specific Booking Inputs */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">
                        Preferred Booking Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">
                        Preferred Time Slot *
                      </label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                      >
                        <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                        <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                        <option value="03:00 PM - 06:00 PM">Evening (03:00 PM - 06:00 PM)</option>
                        <option value="06:00 PM - 09:00 PM">Night (06:00 PM - 09:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">
                      Service Visit Address / Location Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter complete address for service visit..."
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">
                      Special Requirements / Service Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please bring extra spare parts or specific tools..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                </div>
              ) : (
                /* Product Specific Order Inputs */
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block">
                      Delivery Address / Location Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter complete delivery address or shop pickup note..."
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                </div>
              )}

              {/* REALTIME SERVICE CANCELLATION & REFUND POLICY DISPLAY */}
              {isService && (
                <div className="p-3 bg-white border border-[#d99a3d]/30 rounded-xl space-y-1.5 shadow-xs">
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
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#e3dccb] text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting || !orderAddress.trim() || (isService && !bookingDate)}
                  className="px-5 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-black transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {orderSubmitting
                    ? isService ? 'Submitting Booking...' : 'Submitting Order...'
                    : isService ? 'Confirm Service Booking' : 'Confirm Order Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Active Offers Section ── */}
        {((selectedItem.offers && selectedItem.offers.length > 0) || (vendorObj.offers && vendorObj.offers.length > 0)) && (
          <div className="bg-gradient-to-r from-amber-500/10 via-[#d99a3d]/10 to-transparent p-4 rounded-xl border border-[#d99a3d]/30 space-y-2.5">
            <span className="text-[10.5px] font-black text-[#d99a3d] uppercase tracking-wider block">
              🔥 Active Deals & Limited-Time Offers:
            </span>
            <div className="space-y-2">
              {[...(selectedItem.offers || []), ...(vendorObj.offers || [])]
                .filter((off) => off.is_active !== false)
                .map((off, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-white p-3 rounded-lg border border-[#e3dccb] shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black uppercase">
                          {off.discountPct}% OFF
                        </span>
                        <span className="text-xs font-bold text-[#1a1a1a]">{off.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{off.description}</p>
                      <div className="text-[10px] text-slate-500">
                        Use Code: <strong className="text-[#7c3aed] font-mono uppercase bg-[#7c3aed]/10 px-1.5 py-0.5 rounded">{off.couponCode}</strong>
                      </div>
                    </div>
                    {off.validTill && (
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400">Expires: {new Date(off.validTill).toLocaleDateString()}</span>
                        <OfferCountdown validTill={off.validTill} />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Customer Reviews & Ratings Section ── */}
        <div className="pt-3 border-t border-[#e3dccb] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
              <FiStar className="text-[#d99a3d]" />
              <span>Customer Reviews & Ratings ({reviewsList.length})</span>
            </h4>
          </div>

          <form onSubmit={handleAddReview} className="flex flex-col sm:flex-row gap-2">
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-2 text-xs font-bold text-[#d99a3d] focus:outline-none shrink-0 cursor-pointer"
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
              <option value={3}>⭐⭐⭐ (3 Stars)</option>
              <option value={2}>⭐⭐ (2 Stars)</option>
              <option value={1}>⭐ (1 Star)</option>
            </select>

            <input
              type="text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your genuine feedback / review for this vendor..."
              className="flex-1 bg-[#f8f4ec] border border-[#e3dccb] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d]"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white text-xs font-black transition cursor-pointer shrink-0"
            >
              Post Review
            </button>
          </form>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {reviewsList.length === 0 ? (
              <p className="text-slate-400 text-center py-4 text-xs">
                No customer reviews yet. Be the first to leave feedback!
              </p>
            ) : (
              reviewsList.map((r) => (
                <div
                  key={r._id || r.id}
                  className="p-3 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1a1a1a]">{r.author?.name || r.user || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400">
                        • {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">{r.comment}</p>
                  </div>
                  <span className="text-[#d99a3d] font-black text-xs shrink-0 bg-white px-2 py-0.5 rounded border border-[#e3dccb]">
                    {r.rating} ★
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
