import React from 'react';
import { FiTag, FiTruck, FiShield, FiZap } from 'react-icons/fi';

/**
 * CheckoutPriceDetails — Right column sticky Flipkart-style price breakdown and CTA
 */
export default function CheckoutPriceDetails({
  isService,
  quantity,
  itemTotal,
  itemRetailSavings,
  appliedCoupon,
  couponDiscount,
  deliveryFee,
  totalAmount,
  totalCustomerSavings,
  submitting,
  deliveryAddress,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] p-4 sm:p-5 shadow-xs space-y-3.5 sticky top-2">
      {/* Header */}
      <div className="border-b border-[#e3dccb] pb-2.5">
        <h4
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
          className="text-xs sm:text-sm font-black text-[#1a1a1a] uppercase tracking-wider"
        >
          Price Details
        </h4>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 text-xs font-bold text-slate-600">
        <div className="flex items-center justify-between">
          <span>Price ({isService ? '1 service' : `${quantity} item${quantity > 1 ? 's' : ''}`})</span>
          <span className="text-[#1a1a1a]">₹{itemTotal.toLocaleString('en-IN')}</span>
        </div>

        {/* Retail Discount */}
        {itemRetailSavings > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>Listing Discount</span>
            <span>- ₹{itemRetailSavings.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Coupon Discount Line */}
        {appliedCoupon && (
          <div className="flex items-center justify-between text-emerald-700 font-extrabold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <span className="flex items-center gap-1">
              <FiTag size={12} /> Coupon ({appliedCoupon.couponCode})
            </span>
            <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Delivery Charges (Shiprocket) */}
        {!isService && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FiTruck size={12} className="text-[#d99a3d]" /> Delivery Charges
            </span>
            {deliveryFee === 0 ? (
              <div className="text-right">
                <span className="line-through text-slate-400 text-[10.5px] mr-1">₹40</span>
                <span className="text-emerald-700 font-black uppercase text-[11px]">FREE</span>
              </div>
            ) : (
              <span className="text-[#1a1a1a] font-bold">₹{deliveryFee}</span>
            )}
          </div>
        )}

        {/* Total Amount */}
        <div className="border-t border-[#e3dccb] pt-3 flex items-baseline justify-between">
          <span className="text-sm font-black text-[#1a1a1a] uppercase">Total Amount</span>
          <span className="text-xl font-black text-[#d99a3d]">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Flipkart Signature Green Savings Banner */}
      {totalCustomerSavings > 0 && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center space-y-0.5">
          <p className="text-xs font-black text-emerald-800">
            🎉 You will save ₹{totalCustomerSavings.toLocaleString('en-IN')} on this order
          </p>
        </div>
      )}

      {/* Place Order CTA Button */}
      <button
        type="submit"
        disabled={submitting || !deliveryAddress.trim()}
        className="w-full py-3.5 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-sm font-black rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer border border-[#241b15] disabled:opacity-50"
      >
        {submitting ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
        ) : (
          <>
            <FiZap size={16} />
            <span>
              {isService ? 'Confirm & Book Appointment' : `Place Order (₹${totalAmount.toLocaleString('en-IN')})`}
            </span>
          </>
        )}
      </button>

      {/* Trust Badges */}
      <div className="border-t border-[#e3dccb] pt-3 space-y-1.5 text-[10px] text-slate-500 font-bold">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <FiShield size={13} className="shrink-0" />
          <span>100% Safe & Secure Payments</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <FiTruck size={13} className="text-[#d99a3d] shrink-0" />
          <span>Shiprocket Fast Courier Network Delivery</span>
        </div>
      </div>
    </div>
  );
}
