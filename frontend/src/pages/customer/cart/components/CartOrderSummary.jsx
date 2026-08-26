import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiShield, FiTruck, FiCreditCard, FiAlertTriangle, FiTag, FiCheck, FiCheckCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { offersApi } from '../../../../lib/api';

export default function CartOrderSummary({
  totalAmount,
  totalItems,
  vendorCount,
  onCheckout,
  isCheckingOut,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  deliveryFee = 0,
  isFreeDelivery = true,
  pincode = '',
  onPincodeChange,
}) {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponsTray, setShowCouponsTray] = useState(false);

  // Load active available coupons for cart
  useEffect(() => {
    setLoadingCoupons(true);
    offersApi.getApplicable({ orderAmount: totalAmount })
      .then((res) => {
        const coupons = res.data?.data || res.data?.items || [];
        setAvailableCoupons(coupons);
      })
      .catch(() => {})
      .finally(() => setLoadingCoupons(false));
  }, [totalAmount]);

  const handleApply = async (codeToUse) => {
    const code = (codeToUse || couponCode).trim();
    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }

    setValidating(true);
    try {
      const res = await offersApi.validateCoupon({
        couponCode: code,
        orderAmount: totalAmount,
      });

      const couponData = res.data?.data;
      if (couponData) {
        onApplyCoupon(couponData);
        setCouponCode(couponData.couponCode);
        toast.success(`🎉 Coupon "${couponData.couponCode}" applied! ₹${couponData.discountAmount} saved!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setValidating(false);
    }
  };

  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const finalPayable = Math.max(0, totalAmount - couponDiscount + deliveryFee);
  const totalSavings = couponDiscount + (isFreeDelivery ? 40 : 0);

  return (
    <div className="bg-white border border-[#e3dccb] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 sticky top-24">
      {/* Header — Flipkart Style */}
      <div className="border-b border-[#e3dccb] pb-3">
        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm font-black text-[#1a1a1a] uppercase tracking-wider">
          Price Details
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} across {vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'}
        </p>
      </div>

      {/* ── Flipkart Coupon Application Section ── */}
      <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#e3dccb] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1.5">
            <FiTag className="text-[#d99a3d]" size={13} />
            <span>Apply Coupons & Promo Code</span>
          </label>
          {availableCoupons.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCouponsTray(!showCouponsTray)}
              className="text-[10.5px] font-extrabold text-[#d99a3d] hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
            >
              <span>{availableCoupons.length} Offers</span>
              {showCouponsTray ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            disabled={Boolean(appliedCoupon)}
            className="flex-1 px-3 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-mono font-black text-[#1a1a1a] uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d] disabled:opacity-60"
          />

          {appliedCoupon ? (
            <button
              type="button"
              onClick={() => {
                onRemoveCoupon();
                setCouponCode('');
              }}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-lg transition cursor-pointer border border-red-200"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              disabled={validating || !couponCode.trim()}
              onClick={() => handleApply()}
              className="px-4 py-1.5 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black rounded-lg transition cursor-pointer border-none shadow-2xs disabled:opacity-50 flex items-center gap-1"
            >
              {validating ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
              ) : (
                'APPLY'
              )}
            </button>
          )}
        </div>

        {/* Applied Coupon Badge */}
        {appliedCoupon && (
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-[11.5px] text-emerald-800 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <FiCheckCircle size={13} className="text-emerald-600 shrink-0" />
              '{appliedCoupon.couponCode}' Applied (-₹{couponDiscount})
            </span>
            <span className="text-[9.5px] font-black uppercase text-emerald-700">SAVED</span>
          </div>
        )}

        {/* Expandable Available Coupons Tray */}
        {showCouponsTray && availableCoupons.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-[#e3dccb]/70 max-h-40 overflow-y-auto pr-1">
            {availableCoupons.map((coupon) => {
              const isCurrent = appliedCoupon?.couponCode === coupon.code;
              return (
                <div
                  key={coupon.id || coupon.code}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    isCurrent ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-[#e3dccb]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-mono font-black text-[10px] bg-[#241b15] text-[#d99a3d] px-1.5 py-0.5 rounded">
                      {coupon.code}
                    </span>
                    <p className="text-[10.5px] text-slate-600 font-medium truncate mt-0.5">{coupon.title || coupon.description}</p>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1 shrink-0">
                      <FiCheck size={11} /> Applied
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApply(coupon.code)}
                      className="px-2.5 py-1 bg-[#241b15] text-[#d99a3d] text-[10px] font-black rounded transition cursor-pointer border-none shadow-2xs shrink-0"
                    >
                      Apply
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pricing Breakdown ── */}
      <div className="space-y-2.5 text-xs font-bold text-slate-600">
        <div className="flex items-center justify-between">
          <span>Price ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
          <span className="text-[#1a1a1a] font-extrabold">₹{totalAmount?.toLocaleString('en-IN')}</span>
        </div>

        {/* Coupon Discount Line */}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-extrabold">
            <span>Coupon Discount</span>
            <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Delivery Charges (Shiprocket standard) */}
        <div className="flex items-center justify-between">
          <span>Delivery Charges</span>
          {isFreeDelivery ? (
            <div className="text-right">
              <span className="line-through text-slate-400 text-[10.5px] mr-1">₹40</span>
              <span className="text-emerald-700 font-black uppercase text-[11px]">FREE</span>
            </div>
          ) : (
            <span className="text-[#1a1a1a] font-bold">₹{deliveryFee}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-slate-500 text-[11px]">
          <span>Packaging / Platform Fee</span>
          <span className="text-emerald-700 font-bold uppercase">FREE</span>
        </div>

        {/* Final Total */}
        <div className="border-t border-[#e3dccb] pt-3 flex items-baseline justify-between">
          <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">Total Amount</span>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-[#d99a3d]">
              ₹{finalPayable.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Flipkart Savings Banner */}
      {totalSavings > 0 && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-0.5">
          <p className="text-xs font-black text-emerald-800">
            🎉 You will save ₹{totalSavings.toLocaleString('en-IN')} on this order
          </p>
        </div>
      )}

      {/* Checkout CTA */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={onCheckout}
          disabled={isCheckingOut || totalItems === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 border border-[#241b15]"
        >
          {isCheckingOut ? (
            <div className="w-4 h-4 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
          ) : (
            <FiMessageSquare className="w-4 h-4" />
          )}
          <span>Send Order Request (₹{finalPayable.toLocaleString('en-IN')})</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
          Direct verification & invoice routing to verified vendors.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-[#e3dccb] pt-3 space-y-2 text-[10.5px] text-slate-600 font-bold">
        <div className="flex items-center gap-2">
          <FiShield className="text-emerald-600 shrink-0" size={14} />
          <span>100% Safe & Verified Local Businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <FiTruck className="text-[#d99a3d] shrink-0" size={14} />
          <span>Shiprocket Fast Courier Network Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <FiCreditCard className="text-blue-600 shrink-0" size={14} />
          <span>Pay Directly to Vendor (UPI / COD / Bank)</span>
        </div>
      </div>
    </div>
  );
}
