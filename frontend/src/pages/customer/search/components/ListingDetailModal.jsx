import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiStar, FiHeart, FiBookmark, FiShare2, FiPhone,
  FiMessageSquare, FiShoppingCart, FiClock, FiCheckCircle,
  FiX, FiTruck, FiShield, FiCreditCard, FiDollarSign,
  FiCopy, FiAlertTriangle, FiLock, FiCheck
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
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

  // Vendor payment details & verification
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
  const vendorPhone = vendorObj.phone || vp.whatsapp || vp.whatsappNumber || vp.mobileNumber || '';
  const vendorQr = vendorPayment.qrCodeUrl || vendorPayment.qrCode || vendorPayment.qr_code || vp.qrCodeUrl || vp.qrCode || vp.qr_code || vendorObj.qrCode || vendorObj.qrCodeUrl || '';
  const vendorBank = {
    bankName: vendorPayment.bankName || vendorPayment.bank_name || vp.bankDetails?.bankName || vp.bankName || vendorObj.bankDetails?.bankName || 'Commercial Bank',
    accountHolderName: vendorPayment.verifiedAccountName || vendorPayment.accountHolderName || vendorPayment.account_holder_name || vp.bankDetails?.accountHolderName || vendorName || '',
    accountNumber: vendorPayment.bankAccount || vendorPayment.accountNumber || vendorPayment.account_number || vendorPayment.maskedAccount || vp.bankDetails?.accountNumber || vendorObj.bankDetails?.accountNumber || '',
    ifscCode: vendorPayment.ifscCode || vendorPayment.ifsc_code || vendorPayment.ifsc || vp.bankDetails?.ifscCode || vendorObj.bankDetails?.ifscCode || '',
    branchName: vendorPayment.branchName || vendorPayment.branch_name || vp.bankDetails?.branchName || vendorPayment.city || '',
  };

  const [copiedKey, setCopiedKey] = useState('');
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

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
                {selectedItem.unit && !isService && (
                  <span className="text-xs font-bold text-slate-500">
                    / {selectedItem.unit}
                  </span>
                )}
                {isService && (
                  <span className="text-xs font-bold text-slate-500">
                    / visit
                  </span>
                )}
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

              {/* Product Specifications, Unit, Warranty & Return Policy */}
              {!isService && (
                <div className="pt-3 border-t border-[#e3dccb] mt-3 space-y-2.5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedItem.unit && (
                      <span className="px-2.5 py-1 bg-[#f8f4ec] text-[#1a1a1a] rounded-lg font-bold border border-[#e3dccb]">
                        Unit: <strong>{selectedItem.unit}</strong>
                      </span>
                    )}
                    {selectedItem.minOrderQty > 1 && (
                      <span className="px-2.5 py-1 bg-[#f8f4ec] text-[#1a1a1a] rounded-lg font-bold border border-[#e3dccb]">
                        Min Order: <strong>{selectedItem.minOrderQty} {selectedItem.unit || 'pcs'}</strong>
                      </span>
                    )}
                    {selectedItem.warranty && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg font-bold border border-blue-200">
                        🛡️ {selectedItem.warranty}
                      </span>
                    )}
                  </div>

                  {/* Return / Replacement Policy Banner */}
                  {selectedItem.returnPolicy && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale')
                        ? 'bg-red-50/70 border-red-200 text-red-700'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    }`}>
                      <span className="shrink-0 mt-0.5 font-bold">
                        {selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale') ? '🚫' : '🔄'}
                      </span>
                      <div>
                        <span className="font-extrabold block">
                          {selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale')
                            ? 'Final Sale Notice'
                            : 'Return & Replacement Policy'}
                        </span>
                        <span className="text-[11px] leading-relaxed opacity-90">{selectedItem.returnPolicy}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Labels / Custom Specs */}
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
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'vendor_upi', label: 'Vendor UPI', icon: FiCreditCard, color: 'text-[#d99a3d]' },
                  { id: 'vendor_qr', label: 'Vendor QR', icon: BsQrCode, color: 'text-[#d99a3d]' },
                  { id: 'bank_transfer', label: 'Bank Transfer', icon: FiShield, color: 'text-[#d99a3d]' },
                  { id: 'cod', label: isService ? 'Pay on Visit' : 'Cash on Delivery', icon: FiDollarSign, color: 'text-emerald-600' },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        paymentMethod === method.id
                          ? 'bg-white border-[#d99a3d] shadow-2xs font-extrabold text-[#1a1a1a]'
                          : 'bg-white/60 border-[#e3dccb] hover:border-slate-400 text-slate-600'
                      }`}
                    >
                      <Icon className={method.color} size={15} />
                      <span className="text-[10.5px] font-bold leading-tight">{method.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Details / Security Gate Panel */}
              <div className="p-3.5 rounded-xl border transition-all duration-200 bg-white border-[#e3dccb]">
                {paymentMethod === 'vendor_upi' && (
                  isVerified ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <FiCreditCard size={14} />
                          </span>
                          <span className="text-xs font-black text-[#1a1a1a] flex items-center gap-1">
                            Verified Merchant UPI
                            <FiCheckCircle className="text-emerald-600" size={12} />
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          Verified
                        </span>
                      </div>

                      {vendorUpi ? (
                        <div className="p-2.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">UPI ID</span>
                            <span className="text-xs font-black text-[#1a1a1a] font-mono select-all truncate block">{vendorUpi}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(vendorUpi, 'upi')}
                            className="px-2.5 py-1 rounded bg-white border border-[#e3dccb] hover:border-[#d99a3d] text-[11px] font-bold text-[#1a1a1a] flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedKey === 'upi' ? <><FiCheck size={11} className="text-emerald-600" /> Copied</> : <><FiCopy size={11} /> Copy</>}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">ℹ️ Vendor UPI not configured. Pay on visit/delivery.</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                        <FiLock className="text-amber-700" size={13} />
                        <span>UPI Details Hidden (Unverified Merchant)</span>
                      </div>
                      <p className="text-[10.5px] text-amber-800 leading-snug">
                        Advance UPI details are hidden because this vendor is unverified. Please choose <strong>Cash on Delivery</strong> or chat with vendor.
                      </p>
                    </div>
                  )
                )}

                {paymentMethod === 'vendor_qr' && (
                  isVerified ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <BsQrCode size={14} />
                          </span>
                          <span className="text-xs font-black text-[#1a1a1a] flex items-center gap-1">
                            Verified Payment QR Code
                            <FiCheckCircle className="text-emerald-600" size={12} />
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          Verified
                        </span>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb]">
                        {vendorQr ? (
                          <img
                            src={resolveMediaUrl(vendorQr)}
                            alt="Vendor QR"
                            className="w-24 h-24 object-contain rounded bg-white p-1 border border-[#e3dccb]"
                          />
                        ) : vendorUpi ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=${vendorUpi}&pn=${encodeURIComponent(vendorName)}&cu=INR`)}`}
                            alt="Dynamic QR"
                            className="w-24 h-24 object-contain rounded bg-white p-1 border border-[#e3dccb]"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-1">
                            <BsQrCode size={18} className="mb-1" />
                            <span>No QR</span>
                          </div>
                        )}
                        <div className="space-y-1 text-xs min-w-0">
                          <p className="text-[11px] font-bold text-[#1a1a1a]">Scan using GPay / PhonePe / Paytm</p>
                          {vendorUpi && <p className="text-[10px] text-slate-500 font-mono truncate">UPI: {vendorUpi}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                        <FiLock className="text-amber-700" size={13} />
                        <span>QR Code Hidden (Unverified Merchant)</span>
                      </div>
                      <p className="text-[10.5px] text-amber-800 leading-snug">
                        QR payment is restricted for unverified vendors to prevent fraud. Please opt for <strong>Cash on Delivery</strong>.
                      </p>
                    </div>
                  )
                )}

                {paymentMethod === 'bank_transfer' && (
                  isVerified ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <FiShield size={14} />
                          </span>
                          <span className="text-xs font-black text-[#1a1a1a] flex items-center gap-1">
                            Verified Bank Account
                            <FiCheckCircle className="text-emerald-600" size={12} />
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          Verified
                        </span>
                      </div>

                      {(vendorBank.accountNumber || vendorBank.ifscCode) ? (
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Holder</span>
                            <p className="font-extrabold text-[#1a1a1a] truncate">{vendorBank.accountHolderName || vendorName}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Bank</span>
                            <p className="font-extrabold text-[#1a1a1a] truncate">{vendorBank.bankName || 'Bank'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">A/C No</span>
                            <div className="flex items-center gap-1">
                              <p className="font-mono font-extrabold text-[#1a1a1a] truncate">{vendorBank.accountNumber}</p>
                              <button type="button" onClick={() => handleCopy(vendorBank.accountNumber, 'acc')} className="p-0.5 text-slate-500">
                                {copiedKey === 'acc' ? <FiCheck size={10} className="text-emerald-600" /> : <FiCopy size={10} />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">IFSC</span>
                            <div className="flex items-center gap-1">
                              <p className="font-mono font-extrabold text-[#1a1a1a] truncate">{vendorBank.ifscCode}</p>
                              <button type="button" onClick={() => handleCopy(vendorBank.ifscCode, 'ifsc')} className="p-0.5 text-slate-500">
                                {copiedKey === 'ifsc' ? <FiCheck size={10} className="text-emerald-600" /> : <FiCopy size={10} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">ℹ️ Bank details not provided by vendor.</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                        <FiLock className="text-amber-700" size={13} />
                        <span>Bank Details Hidden (Unverified Merchant)</span>
                      </div>
                      <p className="text-[10.5px] text-amber-800 leading-snug">
                        Direct bank transfers are restricted for unverified vendors. Please choose <strong>Cash on Delivery</strong>.
                      </p>
                    </div>
                  )
                )}

                {paymentMethod === 'cod' && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                      <FiDollarSign className="text-emerald-600" size={14} />
                      <span>{isService ? 'Pay in Person After Service Visit' : 'Cash on Delivery'}</span>
                    </div>
                    <p className="text-[10.5px] text-emerald-800 leading-snug">
                      {isService
                        ? 'Pay directly in cash or UPI to the technician after the service is completed at your address.'
                        : 'Pay cash or scan vendor QR when the item is delivered to your address.'}
                    </p>
                  </div>
                )}
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
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[10.5px] font-extrabold text-slate-600 uppercase block truncate">
                        Qty ({selectedItem.unit || 'pcs'})
                      </label>
                      <input
                        type="number"
                        min={selectedItem.minOrderQty || 1}
                        max={500}
                        value={orderQty}
                        onChange={(e) => setOrderQty(Math.max(selectedItem.minOrderQty || 1, parseInt(e.target.value) || 1))}
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

                  {/* REALTIME PRODUCT RETURN POLICY DISPLAY */}
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    selectedItem.returnPolicy && (selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale'))
                      ? 'bg-red-50/80 border-red-200 text-red-700'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  }`}>
                    <span className="shrink-0 mt-0.5 text-base font-bold">
                      {selectedItem.returnPolicy && (selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale')) ? '🚫' : '🔄'}
                    </span>
                    <div>
                      <span className="font-extrabold block">
                        {selectedItem.returnPolicy && (selectedItem.returnPolicy.toLowerCase().includes('no return') || selectedItem.returnPolicy.toLowerCase().includes('final sale'))
                          ? 'Final Sale Notice — No Returns'
                          : 'Return & Replacement Guarantee'}
                      </span>
                      <span className="text-[11px] leading-relaxed opacity-90">
                        {selectedItem.returnPolicy || '7 Days Return / Replacement available for defective, damaged, or wrong items delivered.'}
                      </span>
                    </div>
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
