import React from 'react';
import { FiMessageSquare, FiShield, FiTruck, FiCreditCard } from 'react-icons/fi';

export default function CartOrderSummary({ totalAmount, totalItems, vendorCount, onCheckout, isCheckingOut }) {
  return (
    <div className="bg-white border border-[#e3dccb] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 sticky top-24">
      {/* Header */}
      <div className="border-b border-[#e3dccb] pb-4">
        <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase tracking-wide">
          Order Summary
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} across {vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'}
        </p>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 text-xs font-bold text-slate-600">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-[#1a1a1a] font-extrabold">₹{totalAmount?.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-emerald-700">
          <span>Platform Service Fee</span>
          <span className="font-extrabold uppercase text-[11px]">FREE</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Vendor Confirmation</span>
          <span className="text-slate-500 text-[11px]">Via Direct Chat</span>
        </div>

        {/* Final Total */}
        <div className="border-t border-[#e3dccb] pt-3 flex items-baseline justify-between">
          <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">Estimated Total</span>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-[#d99a3d]">
              ₹{totalAmount?.toLocaleString()}
            </span>
            <span className="block text-[9.5px] text-slate-400 font-semibold">Taxes calculated on confirmation</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="space-y-2.5">
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
          <span>Send Order Request to {vendorCount} {vendorCount === 1 ? 'Vendor' : 'Vendors'}</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
          Order details are securely routed to the verified vendors to confirm stock & delivery via in-app chat.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-[#e3dccb] pt-4 space-y-2 text-[10.5px] text-slate-600 font-bold">
        <div className="flex items-center gap-2">
          <FiShield className="text-emerald-600 shrink-0" size={14} />
          <span>100% Verified Local Businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <FiTruck className="text-[#d99a3d] shrink-0" size={14} />
          <span>Direct Local Pickup or Vendor Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <FiCreditCard className="text-blue-600 shrink-0" size={14} />
          <span>Pay Directly to Vendor (UPI / COD)</span>
        </div>
      </div>
    </div>
  );
}
