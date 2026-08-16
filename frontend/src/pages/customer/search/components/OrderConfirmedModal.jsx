import React from 'react';
import { FiCheckCircle, FiPackage, FiTruck } from 'react-icons/fi';

export default function OrderConfirmedModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white border border-[#e3dccb] rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto border border-emerald-200">
          <FiCheckCircle size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#1a1a1a]">Order Request Confirmed!</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your order request has been sent to the vendor. You can pay the vendor directly upon confirmation or delivery via UPI / QR / Cash.
          </p>
        </div>

        <div className="bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb] text-left text-xs space-y-1.5 text-slate-600">
          <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
            <FiTruck className="text-[#d99a3d]" />
            <span>Next Steps:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            1. Vendor will review your order details and contact you.
            <br />
            2. You can track status anytime under <strong>Customer Activities → My Orders</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#d99a3d] hover:text-[#1a1a1a] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );
}
