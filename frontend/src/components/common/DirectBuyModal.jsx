import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiX, FiTool, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api, offersApi } from '../../lib/api';

// Subcomponents
import CheckoutAddressStep from './checkout/CheckoutAddressStep';
import CheckoutOrderSummaryStep from './checkout/CheckoutOrderSummaryStep';
import CheckoutCouponsStep from './checkout/CheckoutCouponsStep';
import CheckoutPaymentStep from './checkout/CheckoutPaymentStep';
import CheckoutPriceDetails from './checkout/CheckoutPriceDetails';
import CheckoutSuccessScreen from './checkout/CheckoutSuccessScreen';

/**
 * DirectBuyModal — Modular Flipkart-Style Instant Checkout & Booking Modal
 */
export default function DirectBuyModal({
  isOpen,
  item,
  onClose,
  onSuccess,
  onOpenChat,
}) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});

  // Stepper State (1: Address, 2: Order Items, 3: Coupons, 4: Payment)
  const [activeStep, setActiveStep] = useState(1);

  // Address & Recipient State
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [addressType, setAddressType] = useState('HOME');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Service Booking State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM - 01:00 PM');
  const [bookingTimeMode, setBookingTimeMode] = useState('slot');
  const [customTimeVal, setCustomTimeVal] = useState('10:00');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('vendor_upi');
  const [vendorFullDetails, setVendorFullDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Shipping State (Shiprocket calculation)
  const [shippingRate, setShippingRate] = useState({
    shippingFee: 0,
    originalFee: 40,
    isFree: true,
    courierName: 'Shiprocket Fast Express',
    estimatedDays: '2-4 business days',
  });

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h < 10 ? '0' + h : h}:${m} ${ampm}`;
  };

  // Extract Item & Vendor Metadata
  const isService = item?.type === 'service' || item?.postType === 'service' || item?.postType === 'services';
  const itemId = item?._id || item?.id;
  const vendorObj = vendorFullDetails || item?.vendor || item?.creator || item?.vendorId || {};
  const vendorId = vendorObj?._id || vendorObj?.id || (typeof vendorObj === 'string' ? vendorObj : null);
  const vendorName = vendorObj?.shopName || vendorObj?.vendorProfile?.shopName || vendorObj?.businessName || vendorObj?.name || 'Verified Vendor';
  const vendorAvatar = vendorObj?.avatarUrl || vendorObj?.profile_pic || null;

  // Pricing calculations
  const rawPrice = Number(
    item?.sellingPrice || item?.salePrice || item?.price || item?.taggedListing?.salePrice || item?.taggedListing?.price || 0
  );
  const rawOriginalPrice = Number(
    item?.actualPrice || item?.regularPrice || item?.mrp || item?.taggedListing?.actualPrice || 0
  );
  const priceVal = isNaN(rawPrice) ? 0 : rawPrice;
  const originalPrice = isNaN(rawOriginalPrice) ? (priceVal > 0 ? Math.round(priceVal * 1.25) : 0) : rawOriginalPrice;
  const discountPercent = originalPrice > priceVal && priceVal > 0
    ? Math.round(((originalPrice - priceVal) / originalPrice) * 100)
    : Number(item?.discount || item?.discountPercent || 0);

  const itemTotal = isService ? priceVal : priceVal * quantity;
  const itemMrpTotal = isService ? originalPrice : originalPrice * quantity;
  const itemRetailSavings = Math.max(0, itemMrpTotal - itemTotal);
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const deliveryFee = isService ? 0 : (shippingRate.isFree ? 0 : shippingRate.shippingFee);
  const totalAmount = Math.max(0, itemTotal - couponDiscount + deliveryFee);
  const totalCustomerSavings = itemRetailSavings + couponDiscount + (isService ? 0 : (shippingRate.isFree ? (shippingRate.originalFee || 40) : 0));

  const mediaImage = (Array.isArray(item?.images) && item.images[0]) ||
    item?.thumbnailUrl || item?.image || (Array.isArray(item?.mediaUrls) && item.mediaUrls[0]) ||
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80';

  // Vendor payment details
  const vp = vendorObj?.vendorProfile || {};
  const vpPayment = vp.paymentDetails || vp.payoutDetails || vendorObj?.paymentDetails || vp.bankDetails || vendorObj?.bankDetails || {};
  const vendorUpi = vpPayment.upiId || vpPayment.upi_id || vpPayment.maskedUpi || vp.upiId || vp.upi_id || vp.upi || vendorObj?.upiId || vendorObj?.upi || '';
  const verifiedUpiName = vpPayment.verifiedUpiName || vpPayment.verifiedAccountName || vpPayment.accountHolderName || vpPayment.account_holder_name || vendorName;
  const pspBank = vpPayment.pspBank || 'NPCI UPI Network';
  const vendorQr = vpPayment.qrCodeUrl || vpPayment.qrCode || vpPayment.qr_code || vp.qrCodeUrl || vp.qrCode || vp.qr_code || vendorObj?.qrCode || vendorObj?.qrCodeUrl || '';
  
  const vendorBank = {
    bankName: vpPayment.bankName || vpPayment.bank_name || vp.bankDetails?.bankName || vp.bankName || 'Commercial Bank',
    accountHolderName: vpPayment.verifiedAccountName || vpPayment.accountHolderName || vpPayment.account_holder_name || vp.bankDetails?.accountHolderName || vendorName,
    accountNumber: vpPayment.bankAccount || vpPayment.accountNumber || vpPayment.account_number || vpPayment.maskedAccount || vp.bankDetails?.accountNumber || '',
    ifscCode: vpPayment.ifscCode || vpPayment.ifsc_code || vpPayment.ifsc || vp.bankDetails?.ifscCode || '',
    branchName: vpPayment.branchName || vpPayment.branch_name || vp.bankDetails?.branchName || vpPayment.city || '',
  };

  // Fetch full vendor details
  useEffect(() => {
    if (isOpen && vendorId && typeof vendorId === 'string') {
      api.get(`/v1/users/${vendorId}/profile`)
        .then((res) => {
          const vData = res.data?.data || res.data?.user || res.data;
          if (vData) setVendorFullDetails(vData);
        })
        .catch(() => {});
    }
  }, [isOpen, vendorId]);

  // Load available coupons
  useEffect(() => {
    if (isOpen) {
      setLoadingCoupons(true);
      offersApi.getApplicable({ vendorId: vendorId || '', orderAmount: itemTotal })
        .then((res) => {
          const offers = res.data?.data || res.data?.items || [];
          setAvailableCoupons(offers);
        })
        .catch(() => {})
        .finally(() => setLoadingCoupons(false));
    }
  }, [isOpen, vendorId, itemTotal]);

  // Calculate Shiprocket shipping rate
  useEffect(() => {
    if (isOpen && !isService) {
      offersApi.calculateShipping({ deliveryPincode: pincode, orderAmount: itemTotal })
        .then((res) => {
          if (res.data?.data) setShippingRate(res.data.data);
        })
        .catch(() => {});
    }
  }, [isOpen, pincode, itemTotal, isService]);

  // Prefill defaults on open
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setOrderConfirmed(null);
      setAppliedCoupon(null);
      setCouponInput('');
      setPaymentMethod('vendor_upi');
      setActiveStep(1);

      const existingAddress = user?.location?.address || user?.customerProfile?.address || user?.address ||
        (user?.location?.city ? `${user.location.city}, ${user.location.state || ''}` : '');
      setDeliveryAddress(existingAddress);
      setPincode(user?.location?.pincode || user?.pincode || '');
      setCustomerPhone(user?.phone || user?.mobile || '');
      setCustomerName(user?.name || '');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen, user]);

  const handleFetchLiveLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    const toastId = toast.loading('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedAddress = '';
        let detectedPin = '';

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              resolvedAddress = data.display_name;
              detectedPin = data.address?.postcode || '';
            }
          }
        } catch (err) {}

        if (!resolvedAddress) {
          try {
            const backendGeo = await api.post('/v1/utils/reverse-geocode', { lat: latitude, lng: longitude });
            const geoData = backendGeo.data?.data || backendGeo.data || {};
            const parts = [geoData.address, geoData.area, geoData.city, geoData.state, geoData.pincode].filter(Boolean);
            if (parts.length > 0) resolvedAddress = parts.join(', ');
            if (geoData.pincode) detectedPin = geoData.pincode;
          } catch (e) {}
        }

        setIsFetchingLocation(false);
        if (resolvedAddress) {
          setDeliveryAddress(resolvedAddress);
          if (detectedPin) setPincode(detectedPin);
          toast.success('Live location & pincode detected!', { id: toastId });
        } else {
          toast.error('Could not detect street address. Please type manually.', { id: toastId });
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Location permission denied. Please enter address manually.', { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      toast.error('Please enter a valid coupon code.');
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await offersApi.validateCoupon({
        couponCode: code,
        orderAmount: itemTotal,
        vendorId: vendorId || undefined,
        listingId: itemId,
      });

      const couponData = res.data?.data;
      if (couponData) {
        setAppliedCoupon(couponData);
        setCouponInput(couponData.couponCode);
        toast.success(`🎉 Coupon "${couponData.couponCode}" applied! ₹${couponData.discountAmount} saved!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || 'Invalid or expired coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    toast.success('Coupon removed');
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a valid delivery address or service location.');
      setActiveStep(1);
      return;
    }

    if (isService && !bookingDate) {
      toast.error('Please choose a preferred appointment date.');
      setActiveStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const fullAddressPayload = isService
        ? `${deliveryAddress.trim()} [Scheduled Date: ${bookingDate}, Slot: ${bookingTime}] ${specialInstructions ? `| Instructions: ${specialInstructions.trim()}` : ''}`
        : `${deliveryAddress.trim()}${pincode ? ` - Pincode: ${pincode}` : ''} [Recipient: ${customerName || user?.name || 'Customer'}, Contact: ${customerPhone || user?.phone || 'N/A'}] ${specialInstructions ? `| Note: ${specialInstructions.trim()}` : ''}`;

      const res = await api.post('/v1/orders', {
        listingId: itemId,
        quantity: isService ? 1 : quantity,
        address: fullAddressPayload,
        pincode: pincode || undefined,
        bookingDate: isService ? bookingDate : undefined,
        bookingTime: isService ? bookingTime : undefined,
        bookingNotes: specialInstructions.trim(),
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
        couponDiscount,
        shippingCharges: deliveryFee,
        shippingDetails: shippingRate,
        paymentDetails: {
          method: paymentMethod,
          upiId: vendorUpi,
          verifiedUpiName,
          bankName: vendorBank.bankName,
          accountNumber: vendorBank.accountNumber,
          ifscCode: vendorBank.ifscCode,
          bookingDate: isService ? bookingDate : undefined,
          bookingTime: isService ? bookingTime : undefined,
          instructions: specialInstructions.trim(),
          shippingCharges: deliveryFee,
          couponCode: appliedCoupon ? appliedCoupon.couponCode : undefined,
          discountAmount: couponDiscount,
        },
      });

      const placedOrder = res.data?.data?.order || res.data?.order || { _id: `ORD-${Date.now().toString().slice(-6)}` };
      setOrderConfirmed(placedOrder);
      toast.success(isService ? 'Service appointment booked!' : 'Order placed successfully!');
      if (onSuccess) onSuccess(placedOrder);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  const upiDeepLink = vendorUpi
    ? `upi://pay?pa=${vendorUpi}&pn=${encodeURIComponent(verifiedUpiName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Order for ${item.title || item.caption || 'Product'}`)}`
    : null;

  const dynamicQrCodeUrl = vendorUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${vendorUpi}&pn=${encodeURIComponent(verifiedUpiName)}&am=${totalAmount}&cu=INR`)}`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!submitting) onClose();
          }}
          className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Main Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-3xl bg-[#f1f3f6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border border-[#241b15]/20"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#241b15] text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shadow-xs shrink-0">
                {isService ? <FiTool size={17} /> : <FiPackage size={17} />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>{isService ? 'Service Appointment Checkout' : 'Order Checkout & Payment'}</span>
                  <span className="text-[10px] bg-[#d99a3d] text-[#1a1a1a] font-black px-2 py-0.5 rounded uppercase">
                    Flipkart Flow
                  </span>
                </h3>
                <p className="text-[11px] text-[#d99a3d] font-semibold">
                  Direct Verified Transaction with <span className="underline">{vendorName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#3a2c22] hover:bg-[#d99a3d] text-white hover:text-[#1a1a1a] flex items-center justify-center transition cursor-pointer border-none shrink-0"
              title="Close"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Body */}
          {orderConfirmed ? (
            <CheckoutSuccessScreen
              orderConfirmed={orderConfirmed}
              isService={isService}
              item={item}
              vendorName={vendorName}
              vendorId={vendorId}
              vendorAvatar={vendorAvatar}
              itemTotal={itemTotal}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              deliveryFee={deliveryFee}
              totalAmount={totalAmount}
              totalCustomerSavings={totalCustomerSavings}
              onClose={onClose}
              onOpenChat={onOpenChat}
              navigate={navigate}
            />
          ) : (
            <form onSubmit={handleConfirmOrder} className="flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left: 4 Stepper Blocks */}
                <div className="lg:col-span-7 space-y-3">
                  <CheckoutAddressStep
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    deliveryAddress={deliveryAddress}
                    setDeliveryAddress={setDeliveryAddress}
                    pincode={pincode}
                    setPincode={setPincode}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerPhone={customerPhone}
                    setCustomerPhone={setCustomerPhone}
                    addressType={addressType}
                    setAddressType={setAddressType}
                    handleFetchLiveLocation={handleFetchLiveLocation}
                    isFetchingLocation={isFetchingLocation}
                    isService={isService}
                    onProceed={() => {
                      if (!deliveryAddress.trim()) {
                        toast.error('Please enter delivery address');
                        return;
                      }
                      setActiveStep(2);
                    }}
                  />

                  <CheckoutOrderSummaryStep
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    item={item}
                    isService={isService}
                    vendorName={vendorName}
                    mediaImage={mediaImage}
                    priceVal={priceVal}
                    originalPrice={originalPrice}
                    discountPercent={discountPercent}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    itemTotal={itemTotal}
                    bookingDate={bookingDate}
                    setBookingDate={setBookingDate}
                    bookingTime={bookingTime}
                    setBookingTime={setBookingTime}
                    bookingTimeMode={bookingTimeMode}
                    setBookingTimeMode={setBookingTimeMode}
                    customTimeVal={customTimeVal}
                    setCustomTimeVal={setCustomTimeVal}
                    formatTime12h={formatTime12h}
                    onProceed={() => setActiveStep(3)}
                  />

                  <CheckoutCouponsStep
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    couponInput={couponInput}
                    setCouponInput={setCouponInput}
                    appliedCoupon={appliedCoupon}
                    couponDiscount={couponDiscount}
                    validatingCoupon={validatingCoupon}
                    handleApplyCoupon={handleApplyCoupon}
                    handleRemoveCoupon={handleRemoveCoupon}
                    availableCoupons={availableCoupons}
                    loadingCoupons={loadingCoupons}
                    onProceed={() => setActiveStep(4)}
                  />

                  <CheckoutPaymentStep
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isService={isService}
                    vendorUpi={vendorUpi}
                    verifiedUpiName={verifiedUpiName}
                    pspBank={pspBank}
                    vendorQr={vendorQr}
                    dynamicQrCodeUrl={dynamicQrCodeUrl}
                    upiDeepLink={upiDeepLink}
                    vendorBank={vendorBank}
                    vendorObj={vendorObj}
                    totalAmount={totalAmount}
                    copiedKey={copiedKey}
                    handleCopy={handleCopy}
                  />
                </div>

                {/* Right: Sticky Price Details */}
                <div className="lg:col-span-5 space-y-3">
                  <CheckoutPriceDetails
                    isService={isService}
                    quantity={quantity}
                    itemTotal={itemTotal}
                    itemRetailSavings={itemRetailSavings}
                    appliedCoupon={appliedCoupon}
                    couponDiscount={couponDiscount}
                    deliveryFee={deliveryFee}
                    totalAmount={totalAmount}
                    totalCustomerSavings={totalCustomerSavings}
                    submitting={submitting}
                    deliveryAddress={deliveryAddress}
                  />
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
