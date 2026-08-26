import React from 'react';
import { FiTag, FiCheck, FiCheckCircle } from 'react-icons/fi';

/**
 * CheckoutCouponsStep — Step 3: Coupon Code Input & Available Coupons Tray
 */
export default function CheckoutCouponsStep({
  activeStep,
  setActiveStep,
  couponInput,
  setCouponInput,
  appliedCoupon,
  couponDiscount,
  validatingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  availableCoupons,
  loadingCoupons,
  onProceed,
}) {
  const isCurrent = activeStep === 3;

  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] overflow-hidden shadow-xs">
      <div
        onClick={() => setActiveStep(3)}
        className={`px-4 py-3 flex items-center justify-between cursor-pointer border-b transition ${
          isCurrent ? 'bg-[#241b15] text-white border-[#241b15]' : 'bg-white text-[#1a1a1a] border-[#f0ebe0]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              isCurrent ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-[#241b15] text-[#d99a3d]'
            }`}
          >
            3
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            Coupons & Bank Offers
          </span>
        </div>
        {appliedCoupon && (
          <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
            <FiCheck size={12} /> {appliedCoupon.couponCode} (-₹{couponDiscount})
          </span>
        )}
      </div>

      {isCurrent && (
        <div className="p-4 space-y-3.5 bg-[#faf7f2]">
          {/* Coupon Code Input Box */}
          <div className="p-3 bg-white rounded-xl border border-[#e3dccb] space-y-2">
            <label className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1.5">
              <FiTag className="text-[#d99a3d]" size={13} />
              <span>Apply Coupon / Promo Code</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter coupon code (e.g. WELCOME10)"
                disabled={Boolean(appliedCoupon)}
                className="flex-1 px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-mono font-black text-[#1a1a1a] uppercase placeholder:normal-case placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#d99a3d] disabled:opacity-60"
              />

              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-xl transition cursor-pointer border border-red-200"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  disabled={validatingCoupon || !couponInput.trim()}
                  onClick={() => handleApplyCoupon()}
                  className="px-5 py-2 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-xs font-black rounded-xl transition cursor-pointer border-none shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {validatingCoupon ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
                  ) : (
                    'APPLY'
                  )}
                </button>
              )}
            </div>

            {/* Applied Coupon Success Notice */}
            {appliedCoupon && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <FiCheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span>'{appliedCoupon.couponCode}' applied. You save ₹{couponDiscount}!</span>
                </div>
                <span className="text-[10px] font-black text-emerald-700 uppercase">Applied</span>
              </div>
            )}
          </div>

          {/* ── Flipkart-Style "Available Offers for you" List ── */}
          <div className="p-3 bg-white rounded-xl border border-[#e3dccb] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-[#1a1a1a] uppercase">Available Coupons</span>
              <span className="text-[10px] text-slate-500 font-medium">1-Click Instant Apply</span>
            </div>

            {loadingCoupons ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading active coupons...</div>
            ) : availableCoupons.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No public coupons available for this vendor right now.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableCoupons.map((coupon) => {
                  const isCurrentCoupon = appliedCoupon?.couponCode === coupon.code;
                  return (
                    <div
                      key={coupon.id || coupon.code}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCurrentCoupon
                          ? 'bg-emerald-50/70 border-emerald-400'
                          : 'bg-[#f8f4ec] border-[#e3dccb] hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#241b15] text-[#d99a3d] font-mono font-black text-[10px] tracking-wide">
                            {coupon.code}
                          </span>
                          <span className="text-xs font-bold text-[#1a1a1a] truncate">{coupon.title}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-snug">{coupon.description}</p>
                        {coupon.minOrderAmount > 0 && (
                          <p className="text-[9.5px] text-slate-400">Min. order value: ₹{coupon.minOrderAmount}</p>
                        )}
                      </div>

                      {isCurrentCoupon ? (
                        <span className="text-[10.5px] font-black text-emerald-700 flex items-center gap-1 shrink-0">
                          <FiCheck size={13} /> APPLIED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(coupon.code)}
                          className="px-3 py-1 bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-[11px] font-black rounded-lg transition cursor-pointer border-none shadow-2xs shrink-0"
                        >
                          APPLY
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onProceed}
              className="px-4 py-1.5 bg-[#d99a3d] hover:bg-[#c2872f] text-[#1a1a1a] text-xs font-black rounded-lg transition cursor-pointer border-none shadow-xs"
            >
              Proceed to Payment Options →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
