import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiStar, FiHeart, FiBookmark, FiShare2,
  FiPhone, FiMessageSquare, FiShoppingCart, FiClock, FiCheckCircle,
  FiTruck, FiShield, FiCreditCard, FiPackage, FiTool, FiCheck, FiX,
  FiChevronRight, FiCopy, FiAlertTriangle, FiLock, FiDollarSign, FiExternalLink
} from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl, locationApi, cartApi } from '../../../lib/api';
import { notifyCartChanged, openCartDrawer } from '../../../components/app/CartDrawer';

/**
 * OfferCountdown component for active promo offers
 */
function OfferCountdown({ validTill }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
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
      <span className="text-red-600 font-bold text-xs uppercase bg-red-50 px-2.5 py-1 rounded border border-red-200">
        Expired
      </span>
    );
  }

  return (
    <span className="text-[#d99a3d] font-extrabold text-xs bg-[#d99a3d]/10 border border-[#d99a3d]/30 px-3 py-1 rounded-md flex items-center gap-1.5 w-fit animate-pulse">
      <FiClock size={13} /> {timeLeft}
    </span>
  );
}

/**
 * ListingDetailPage — Full Page Listing & Product Detail view (Warm Bento Theme)
 */
export default function ListingDetailPage() {
  const { id, productId, slug } = useParams();
  const targetId = id || productId || slug;
  const navigate = useNavigate();
  const location = useLocation();

  const passedListing = location.state?.listing;
  const [item, setItem] = useState(passedListing || null);
  const [loading, setLoading] = useState(!passedListing);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Interaction States
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [detailDistStr, setDetailDistStr] = useState('');

  // Order & Booking Form States
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [orderAddress, setOrderAddress] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM - 12:00 PM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('vendor_upi');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Reviews States
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch listing details if not provided or on mount
  useEffect(() => {
    const fetchListing = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        const res = await api.get(`/v1/listings/${targetId}`);
        const raw = res.data?.data?.listing || res.data?.listing || res.data?.data || res.data || {};
        const listingData = raw.listing || raw;
        if (listingData && (listingData._id || listingData.id || listingData.title)) {
          setItem(listingData);
        }
      } catch (err) {
        // Fallback search if direct ID fetch fails
        try {
          const searchRes = await api.get(`/v1/users/me/search-listings?query=${encodeURIComponent(targetId)}`);
          const items = searchRes.data?.data || searchRes.data || [];
          if (items.length > 0) {
            const first = items[0]?.listing || items[0];
            setItem(first);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [targetId]);

  // Calculate distance if coordinates available
  useEffect(() => {
    if (!item) return;

    if (item.vendorId?.location?.coordinates || item.location?.coordinates) {
      const loc = item.vendorId?.location || item.location;
      const coords = loc?.coordinates;
      if (coords && Array.isArray(coords) && coords.length === 2) {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            const dist = locationApi.calculateDistance(
              pos.coords.latitude,
              pos.coords.longitude,
              coords[1],
              coords[0]
            );
            if (dist !== null) {
              setDetailDistStr(`${dist.toFixed(1)} km away`);
            }
          },
          () => {}
        );
      }
    }

    // Fetch reviews for this listing
    const fetchReviews = async () => {
      const lid = item._id || item.id || targetId;
      try {
        const res = await api.get(`/v1/reviews?listingId=${lid}`);
        setReviewsList(res.data?.data || res.data || []);
      } catch {}
    };
    fetchReviews();
  }, [item, targetId]);

  if (loading && !item) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#241b15] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#1a1a1a]">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-[#e3dccb] rounded-2xl p-8 max-w-md text-center shadow-lg space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <FiX size={24} />
          </div>
          <h2 className="text-lg font-extrabold text-[#1a1a1a]">Listing Not Found</h2>
          <p className="text-xs text-slate-600">The product or service you are looking for may have been removed or is unavailable.</p>
          <button
            onClick={() => navigate('/customer/search')}
            className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] text-xs font-bold rounded-xl hover:bg-[#342820] transition"
          >
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  const isService = item.type === 'service';
  const itemId = item._id || item.id || targetId;

  // Media Gallery Setup
  let rawImagesList = [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    rawImagesList = item.images;
  } else if (Array.isArray(item.photos) && item.photos.length > 0) {
    rawImagesList = item.photos;
  } else if (Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0) {
    rawImagesList = item.mediaUrls;
  } else if (item.image || item.mediaUrl || item.imageUrl || item.thumbnailUrl) {
    rawImagesList = [item.image || item.mediaUrl || item.imageUrl || item.thumbnailUrl];
  }

  if (rawImagesList.length === 0) {
    rawImagesList = ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'];
  }

  const images = rawImagesList.map(img => {
    if (typeof img === 'object' && img !== null) {
      return img.url || img.src || img.secure_url || img.path || img.imageUrl;
    }
    return img;
  }).filter(Boolean);

  const rawPriceCandidates = [
    item.sellingPrice,
    item.salePrice,
    item.offer_price,
    item.price,
    item.rate,
    item.pricing?.amount,
    item.pricing?.price,
    item.actualPrice,
    item.regularPrice,
    item.originalPrice,
    item.cost,
  ];
  const validPrice = rawPriceCandidates.map(p => Number(p)).find(p => !isNaN(p) && p > 0);
  const priceVal = validPrice || 0;
  const originalPrice = Number(item.actualPrice || item.regularPrice || item.originalPrice || item.compareAtPrice || 0);
  const discountPercent = (originalPrice > priceVal && priceVal > 0) ? Math.round(((originalPrice - priceVal) / originalPrice) * 100) : 0;

  const vendorObj = item.vendor || item.vendorId || item.seller || {};
  const vendorName = vendorObj.shopName || vendorObj.businessName || vendorObj.name || item.vendorName || 'Vendor';
  const vendorAvatar = vendorObj.avatarUrl || vendorObj.logo || vendorObj.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
  const city = item.city || vendorObj.city || item.location?.city || 'Local Area';

  // Check vendor verification status & onboarding credentials
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

  const [copiedKey, setCopiedKey] = useState('');
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Toggle Save & Like Handlers
  const handleToggleSave = async () => {
    setIsSaved(!isSaved);
    try {
      if (!isSaved) {
        await api.post(`/v1/listings/${itemId}/save`);
        toast.success('Saved to your bookmarks!');
      } else {
        await api.post(`/v1/listings/${itemId}/unsave`);
        toast.success('Removed from saved items');
      }
    } catch {
      toast.error('Unable to update bookmark status');
    }
  };

  const handleToggleLike = async () => {
    setIsLiked(!isLiked);
    try {
      await api.post(`/v1/listings/${itemId}/like`);
      toast.success(isLiked ? 'Unliked' : 'Liked!');
    } catch {}
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.description, url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard?.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleWhatsApp = () => {
    // 1. Check if vendor is verified
    if (!isVerified) {
      toast.error(
        '⚠️ This vendor is not verified yet. Direct WhatsApp inquiry is only available for verified vendors.',
        { duration: 5000, id: 'unverified-vendor-whatsapp' }
      );
      return;
    }

    // 2. Extract vendor phone / WhatsApp number
    const rawPhone =
      vendorObj.vendorProfile?.whatsapp ||
      vendorObj.vendorProfile?.whatsappNumber ||
      vendorObj.phone ||
      vendorObj.vendorProfile?.mobileNumber ||
      vendorObj.vendorProfile?.phone ||
      vendorObj.whatsapp ||
      item.phone ||
      item.whatsapp ||
      '';

    if (!rawPhone) {
      toast.error('WhatsApp contact number is not available for this vendor.', {
        id: 'no-vendor-phone'
      });
      return;
    }

    let cleanPhone = String(rawPhone).replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = `91${cleanPhone.slice(1)}`;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Invalid vendor phone number format for WhatsApp.', {
        id: 'invalid-vendor-phone'
      });
      return;
    }

    // 3. Track interaction
    try {
      api.post('/v1/users/me/track-interaction', {
        type: 'whatsapp_contact',
        listingId: itemId,
        targetUserId: vendorObj._id || vendorObj.id,
      }).catch(() => {});
    } catch {}

    const text = encodeURIComponent(
      `Hello ${vendorName}!\nI found your listing "${item.title}" on BizReels (₹${priceVal.toLocaleString('en-IN')}).\nLink: ${window.location.href}\nI would like to inquire about details/availability.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Add to Shopping Cart
  const handleAddToCart = async () => {
    try {
      await cartApi.add({ listing_id: itemId, quantity: orderQty || 1 });
      notifyCartChanged();
      openCartDrawer();
      toast.success(`"${item.title}" added to your cart!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not add item to cart.');
    }
  };

  // Submit Direct Order / Booking
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (isService && !bookingDate) {
      toast.error('Please select a preferred date for the service booking.');
      return;
    }

    setOrderSubmitting(true);
    try {
      await api.post('/v1/orders', {
        listingId: itemId,
        vendorId: vendorObj._id || vendorObj.id,
        itemType: isService ? 'service' : 'product',
        quantity: orderQty,
        address: orderAddress,
        bookingDate: isService ? bookingDate : undefined,
        bookingTimeSlot: isService ? bookingTime : undefined,
        notes: bookingNotes,
        paymentMethod,
        totalAmount: priceVal * orderQty,
      });

      toast.success(isService ? 'Service booking request sent successfully!' : 'Order request submitted successfully!');
      setShowOrderForm(false);
      navigate('/customer/activities?tab=my-orders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit order request. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Submit Review
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error('Please write a review text.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post('/v1/reviews', {
        listingId: itemId,
        rating: reviewRating,
        comment: reviewText,
      });
      toast.success('Thank you! Your review has been published.');
      setReviewsList([res.data?.data || res.data, ...reviewsList]);
      setReviewText('');
    } catch (err) {
      toast.error('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ec] text-[#1a1a1a] font-sans pb-16">
      {/* ── Top Header / Breadcrumb Bar ──────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#e3dccb] px-4 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-[#f8f4ec] hover:bg-[#e3dccb] text-[#1a1a1a] transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <FiArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
              <Link to="/customer/home" className="hover:text-[#241b15] font-semibold">Home</Link>
              <FiChevronRight size={12} />
              <Link to="/customer/search" className="hover:text-[#241b15] font-semibold">Listings</Link>
              <FiChevronRight size={12} />
              <span className="font-bold text-[#1a1a1a] truncate max-w-[150px] sm:max-w-[250px]">{item.title}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLike}
              className={`p-2 rounded-xl border border-[#e3dccb] transition cursor-pointer ${isLiked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-slate-700 hover:bg-[#f8f4ec]'}`}
              title="Like"
            >
              <FiHeart size={16} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleToggleSave}
              className={`p-2 rounded-xl border border-[#e3dccb] transition cursor-pointer ${isSaved ? 'bg-amber-50 text-[#d99a3d] border-[#d99a3d]/40' : 'bg-white text-slate-700 hover:bg-[#f8f4ec]'}`}
              title="Save"
            >
              <FiBookmark size={16} className={isSaved ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white border border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec] transition cursor-pointer"
              title="Share"
            >
              <FiShare2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Detail Container ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl bg-white border border-[#e3dccb] overflow-hidden shadow-sm flex items-center justify-center">
              <img
                src={resolveMediaUrl(images[selectedImgIdx] || images[0])}
                alt={item.title || 'Product Image'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
                }}
                className="w-full h-full object-contain p-4 transition-all duration-300"
              />

              {/* Type Badge */}
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                isService ? 'bg-blue-600 text-white border-blue-700' : 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
              }`}>
                {isService ? '🛠️ Service' : '📦 Product'}
              </span>

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <span className="absolute bottom-4 left-4 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Selector */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 bg-white transition cursor-pointer ${
                      selectedImgIdx === idx ? 'border-[#d99a3d] ring-2 ring-[#d99a3d]/20' : 'border-[#e3dccb] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={resolveMediaUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Listing Info & CTAs (7 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-[#e3dccb] rounded-2xl p-6 shadow-sm space-y-5">
              {/* Category & Distance Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dccb] pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#f8f4ec] border border-[#e3dccb] text-[11px] font-extrabold text-[#1a1a1a] uppercase tracking-wider">
                    {item.category || item.categoryName || 'General'}
                  </span>
                  {item.subcategory && (
                    <span className="text-xs font-semibold text-slate-500">
                      • {item.subcategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <FiMapPin size={13} className="text-[#d99a3d]" />
                  <span>{detailDistStr || city}</span>
                </div>
              </div>

              {/* Title & Rating */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight leading-tight">
                  {item.title}
                </h1>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    <FiStar className="fill-current" size={13} />
                    <span>{item.rating || '4.8'}</span>
                    <span className="text-slate-400">({item.reviewsCount || reviewsList.length || '12'})</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  {isVerified ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[11px] font-bold">
                      <FiCheckCircle size={12} className="text-emerald-600" /> In Stock & Verified Business
                    </span>
                  ) : (
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 text-[11px] font-bold">
                      <FiShield size={12} className="text-amber-600" /> Unverified Vendor
                    </span>
                  )}
                </div>
              </div>

              {/* Price Block */}
              <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    Price
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black text-[#1a1a1a]">
                      ₹{priceVal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      /{item.unit || (isService ? 'service' : 'piece')}
                    </span>
                  </div>
                </div>

                {originalPrice > priceVal && (
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Original</div>
                    <div className="text-sm text-slate-400 line-through font-bold">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Offer Banner */}
              {item.activeOffer && item.activeOffer.validTill && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-[#d99a3d]/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-[#241b15]">Special Offer Active</div>
                    <div className="text-[11px] text-slate-600 font-medium">{item.activeOffer.title || 'Limited time discount'}</div>
                  </div>
                  <OfferCountdown validTill={item.activeOffer.validTill} />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Description</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {item.description || 'No detailed description available for this item.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#e3dccb] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="py-3.5 px-4 rounded-xl bg-[#d99a3d] hover:bg-[#c0862b] text-[#1a1a1a] text-sm font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FiShoppingCart size={18} />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOrderForm(!showOrderForm)}
                    className="py-3.5 px-4 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-sm font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#241b15]"
                  >
                    {isService ? <FiTool size={18} /> : <FiPackage size={18} />}
                    <span>{showOrderForm ? 'Close Form' : (isService ? 'Book Service' : 'Buy Now / Direct Order')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FaWhatsapp size={16} />
                    <span>WhatsApp Inquiry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/customer/chat?vendorId=${vendorObj._id || vendorObj.id}`)}
                    className="py-2.5 px-3 rounded-xl bg-white border border-[#e3dccb] hover:bg-[#f8f4ec] text-[#1a1a1a] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FiMessageSquare size={16} className="text-[#d99a3d]" />
                    <span>Chat with Vendor</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vendor Profile Card */}
            <div className="bg-white border border-[#e3dccb] rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={resolveMediaUrl(vendorAvatar)}
                  alt={vendorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#d99a3d]/40 flex-shrink-0"
                />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-[#1a1a1a] truncate">{vendorName}</h4>
                    {isVerified ? (
                      <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={14} title="Verified Vendor" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">Unverified</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{city} • Local Vendor</p>
                </div>
              </div>

              <Link
                to={`/customer/search?vendorId=${vendorObj._id || vendorObj.id}`}
                className="px-3 py-1.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-xs font-bold text-[#1a1a1a] hover:bg-[#241b15] hover:text-[#d99a3d] transition flex-shrink-0"
              >
                View Store
              </Link>
            </div>
          </div>
        </div>

        {/* ── Order / Booking Form Section (Shown when toggled) ───────── */}
        {showOrderForm && (
          <div className="bg-white border-2 border-[#d99a3d] rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 space-y-6">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#241b15] text-[#d99a3d]">
                  {isService ? <FiTool size={20} /> : <FiPackage size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1a1a1a]">
                    {isService ? 'Service Booking Form' : 'Direct Product Order'}
                  </h3>
                  <p className="text-xs text-slate-500">Fill in details below to submit request directly to {vendorName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowOrderForm(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Quantity or Date/Time */}
                {!isService ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                        className="w-10 h-10 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] text-lg font-bold flex items-center justify-center cursor-pointer hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="text-base font-extrabold px-4">{orderQty}</span>
                      <button
                        type="button"
                        onClick={() => setOrderQty(orderQty + 1)}
                        className="w-10 h-10 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] text-lg font-bold flex items-center justify-center cursor-pointer hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] text-xs font-bold focus:outline-none focus:border-[#d99a3d]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] text-xs font-bold focus:outline-none focus:border-[#d99a3d]"
                      >
                        <option>09:00 AM - 12:00 PM</option>
                        <option>12:00 PM - 03:00 PM</option>
                        <option>03:00 PM - 06:00 PM</option>
                        <option>06:00 PM - 09:00 PM</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Delivery Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">
                    {isService ? 'Service Location / Address' : 'Delivery Address'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter full street address, landmark, and pin code..."
                    value={orderAddress}
                    onChange={(e) => setOrderAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] text-xs font-medium focus:outline-none focus:border-[#d99a3d]"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Order Instructions / Notes</label>
                  <input
                    type="text"
                    placeholder="E.g. Call before arrival or specific size/color preferences..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] text-xs font-medium focus:outline-none focus:border-[#d99a3d]"
                  />
                </div>

                {/* Payment Option */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Payment Preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'vendor_upi', label: 'UPI / GPay' },
                      { id: 'cod', label: 'Cash on Delivery' },
                      { id: 'bank_transfer', label: 'Bank Transfer' },
                      { id: 'vendor_qr', label: 'Vendor QR' },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs font-bold ${
                          paymentMethod === method.id ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]' : 'bg-[#f8f4ec] border-[#e3dccb] text-[#1a1a1a]'
                        }`}
                      >
                        <span>{method.label}</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Dynamic Payment Method Details & Security Gate */}
                  <div className="mt-3 p-4 rounded-xl border transition-all duration-200 bg-[#fdfbf7] border-[#e3dccb]">
                    {paymentMethod === 'vendor_upi' && (
                      isVerified ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <FiCreditCard size={16} />
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-[#1a1a1a] flex items-center gap-1.5">
                                  <span>Verified Merchant UPI Details</span>
                                  <FiCheckCircle className="text-emerald-600" size={13} />
                                </h5>
                                <p className="text-[11px] text-slate-500">Pay directly to vendor's verified UPI account</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Verified Merchant
                            </span>
                          </div>

                          {vendorUpi ? (
                            <div className="p-3 rounded-lg bg-white border border-[#e3dccb] flex items-center justify-between gap-3 shadow-2xs">
                              <div className="min-w-0">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">UPI ID</span>
                                <span className="text-xs font-black text-[#1a1a1a] font-mono select-all truncate block">{vendorUpi}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(vendorUpi, 'upi')}
                                className="px-3 py-1.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] hover:border-[#d99a3d] text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer transition"
                              >
                                {copiedKey === 'upi' ? <><FiCheck size={12} className="text-emerald-600" /> Copied</> : <><FiCopy size={12} /> Copy UPI</>}
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                              ℹ️ Vendor has not configured a direct UPI ID. You can pay via UPI upon visit/delivery.
                            </div>
                          )}

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Payable Amount: <strong className="text-[#1a1a1a]">₹{(priceVal * orderQty).toLocaleString('en-IN')}</strong>. Keep your transaction reference handy.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                            <FiLock className="text-amber-700" size={15} />
                            <span>Advance UPI Details Hidden (Unverified Merchant)</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            For your safety, direct digital advance payment details are hidden because this vendor is not yet verified. We recommend selecting <strong>Cash on Delivery</strong> or <strong>Chatting with Vendor</strong> before making advance payments.
                          </p>
                        </div>
                      )
                    )}

                    {paymentMethod === 'vendor_qr' && (
                      isVerified ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <BsQrCode size={16} />
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-[#1a1a1a] flex items-center gap-1.5">
                                  <span>Verified Vendor Payment QR Code</span>
                                  <FiCheckCircle className="text-emerald-600" size={13} />
                                </h5>
                                <p className="text-[11px] text-slate-500">Scan using Google Pay, PhonePe, Paytm, or BHIM</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Verified QR
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-lg bg-white border border-[#e3dccb]">
                            {vendorQr ? (
                              <img
                                src={resolveMediaUrl(vendorQr)}
                                alt="Vendor Payment QR"
                                className="w-32 h-32 object-contain rounded-lg border border-[#e3dccb] bg-white p-1 shadow-2xs"
                              />
                            ) : vendorUpi ? (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${vendorUpi}&pn=${encodeURIComponent(vendorName)}&am=${priceVal * orderQty}&cu=INR`)}`}
                                alt="Dynamic UPI QR"
                                className="w-32 h-32 object-contain rounded-lg border border-[#e3dccb] bg-white p-1 shadow-2xs"
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[10px] p-2 text-center">
                                <BsQrCode size={24} className="mb-1" />
                                <span>No QR uploaded</span>
                              </div>
                            )}

                            <div className="space-y-1.5 text-xs text-center sm:text-left flex-1">
                              <span className="text-[11px] font-bold text-slate-600 block">Payable Amount: <strong className="text-base text-[#1a1a1a]">₹{(priceVal * orderQty).toLocaleString('en-IN')}</strong></span>
                              {vendorUpi && (
                                <p className="text-[11px] text-slate-500 font-mono">UPI ID: {vendorUpi}</p>
                              )}
                              <p className="text-[11px] text-slate-500 leading-tight">Scan the QR code directly from your mobile UPI application to complete payment.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                            <FiLock className="text-amber-700" size={15} />
                            <span>QR Code Hidden (Unverified Merchant)</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            Vendor payment QR is restricted for unverified accounts to protect against unverified transactions. Please choose <strong>Cash on Delivery</strong> or in-person settlement.
                          </p>
                        </div>
                      )
                    )}

                    {paymentMethod === 'bank_transfer' && (
                      isVerified ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <FiShield size={16} />
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-[#1a1a1a] flex items-center gap-1.5">
                                  <span>Verified Vendor Bank Account</span>
                                  <FiCheckCircle className="text-emerald-600" size={13} />
                                </h5>
                                <p className="text-[11px] text-slate-500">Direct IMPS / NEFT / RTGS Bank Transfer</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              Verified Account
                            </span>
                          </div>

                          {(vendorBank.accountNumber || vendorBank.ifscCode) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-white border border-[#e3dccb] text-xs shadow-2xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Account Holder</span>
                                <p className="font-extrabold text-[#1a1a1a]">{vendorBank.accountHolderName || vendorName}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</span>
                                <p className="font-extrabold text-[#1a1a1a]">{vendorBank.bankName || 'Commercial Bank'}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number</span>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono font-extrabold text-[#1a1a1a] select-all">{vendorBank.accountNumber}</p>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(vendorBank.accountNumber, 'acc')}
                                    className="p-1 text-slate-500 hover:text-[#d99a3d] cursor-pointer"
                                    title="Copy Account Number"
                                  >
                                    {copiedKey === 'acc' ? <FiCheck size={12} className="text-emerald-600" /> : <FiCopy size={12} />}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</span>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono font-extrabold text-[#1a1a1a] select-all">{vendorBank.ifscCode}</p>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(vendorBank.ifscCode, 'ifsc')}
                                    className="p-1 text-slate-500 hover:text-[#d99a3d] cursor-pointer"
                                    title="Copy IFSC"
                                  >
                                    {copiedKey === 'ifsc' ? <FiCheck size={12} className="text-emerald-600" /> : <FiCopy size={12} />}
                                  </button>
                                </div>
                              </div>
                              {vendorBank.branchName && (
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
                                  <p className="font-semibold text-slate-700">{vendorBank.branchName}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                              ℹ️ Bank transfer details not provided by vendor. Please choose UPI or Cash on Delivery.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                            <FiLock className="text-amber-700" size={15} />
                            <span>Bank Details Hidden (Unverified Merchant)</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            Direct bank account details are hidden for unverified merchant listings to protect against fraudulent transfers. Please select <strong>Cash on Delivery</strong> or in-person settlement.
                          </p>
                        </div>
                      )
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                          <FiDollarSign className="text-emerald-600" size={16} />
                          <span>{isService ? 'Pay in Person after Service Completion' : 'Cash on Delivery / Pay on Handover'}</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                          {isService
                            ? 'No advance payment required. Inspect the completed service and pay the service technician directly via Cash or UPI at your location.'
                            : 'No advance online payment required. Inspect your package when delivered at your address and pay in cash or scan vendor QR.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Calculation & Submit */}
              <div className="pt-4 border-t border-[#e3dccb] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Estimated Total</div>
                  <div className="text-2xl font-black text-[#1a1a1a]">
                    ₹{(priceVal * orderQty).toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#d99a3d] hover:bg-[#b8802a] text-[#1a1a1a] text-xs font-black transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {orderSubmitting ? 'Submitting...' : 'Confirm Order Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Reviews & Ratings Section ──────────────────────────────── */}
        <div className="bg-white border border-[#e3dccb] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-[#1a1a1a] border-b border-[#e3dccb] pb-3">
            Customer Reviews & Ratings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Reviews List */}
            <div className="md:col-span-7 space-y-4">
              {reviewsList.length === 0 ? (
                <div className="p-6 bg-[#f8f4ec] rounded-xl text-center text-xs text-slate-500 font-medium">
                  No reviews yet for this listing. Be the first to leave a review!
                </div>
              ) : (
                reviewsList.map((rev, idx) => (
                  <div key={idx} className="p-4 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1a1a1a]">{rev.userName || rev.user?.name || 'Verified Buyer'}</span>
                      <div className="flex text-amber-500 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar key={i} className={i < (rev.rating || 5) ? 'fill-current' : 'opacity-30'} size={12} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{rev.comment || rev.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleAddReview} className="md:col-span-5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">Write a Review</h4>
              
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition"
                  >
                    <FiStar size={18} className={star <= reviewRating ? 'fill-current' : 'opacity-30'} />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                placeholder="Share your experience with this product or vendor..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#e3dccb] bg-white text-xs font-medium focus:outline-none focus:border-[#d99a3d]"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
