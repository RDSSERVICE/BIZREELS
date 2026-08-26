import React from 'react';
import { FiMinus, FiPlus, FiCalendar } from 'react-icons/fi';
import { resolveMediaUrl } from '../../../lib/api';

/**
 * CheckoutOrderSummaryStep — Step 2: Item Summary, Quantity & Booking Schedule
 */
export default function CheckoutOrderSummaryStep({
  activeStep,
  setActiveStep,
  item,
  isService,
  vendorName,
  mediaImage,
  priceVal,
  originalPrice,
  discountPercent,
  quantity,
  setQuantity,
  itemTotal,
  bookingDate,
  setBookingDate,
  bookingTime,
  setBookingTime,
  bookingTimeMode,
  setBookingTimeMode,
  customTimeVal,
  setCustomTimeVal,
  formatTime12h,
  onProceed,
}) {
  const isCurrent = activeStep === 2;

  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] overflow-hidden shadow-xs">
      <div
        onClick={() => setActiveStep(2)}
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
            2
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">Order Summary</span>
        </div>
        {!isCurrent && (
          <span className="text-xs font-black text-[#1a1a1a]">₹{itemTotal.toLocaleString('en-IN')}</span>
        )}
      </div>

      {isCurrent && (
        <div className="p-4 space-y-3.5 bg-[#faf7f2]">
          {/* Item Card */}
          <div className="p-3 bg-white rounded-xl border border-[#e3dccb] flex items-center gap-3.5 shadow-2xs">
            <div className="w-16 h-16 rounded-lg bg-[#f2ede4] border border-[#e3dccb] overflow-hidden shrink-0">
              <img
                src={resolveMediaUrl(mediaImage)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.2 rounded ${
                    isService ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isService ? 'Service' : 'Product'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold truncate">Seller: {vendorName}</span>
              </div>

              <h4 className="text-xs sm:text-sm font-black text-[#1a1a1a] line-clamp-1">
                {item.title || item.caption || 'Item Details'}
              </h4>

              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-[#d99a3d]">
                  ₹{priceVal.toLocaleString('en-IN')}
                </span>
                {originalPrice > priceVal && (
                  <span className="text-[10.5px] text-slate-400 line-through font-bold">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[9.5px] text-emerald-600 font-extrabold">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Selector / Service Appointment Date */}
          {!isService ? (
            <div className="p-3 bg-white rounded-xl border border-[#e3dccb] flex items-center justify-between">
              <div>
                <label className="text-[11px] font-black text-[#1a1a1a] block">Select Quantity</label>
                <span className="text-[10px] text-slate-500 font-medium">Standard unit packaging</span>
              </div>

              <div className="flex items-center gap-2 bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb]">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-[#e3dccb] text-[#1a1a1a] flex items-center justify-center disabled:opacity-40 transition cursor-pointer hover:bg-slate-50"
                >
                  <FiMinus size={12} />
                </button>
                <span className="w-8 text-center text-xs font-black text-[#1a1a1a]">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= 99}
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-[#e3dccb] text-[#1a1a1a] flex items-center justify-center disabled:opacity-40 transition cursor-pointer hover:bg-slate-50"
                >
                  <FiPlus size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-[#e3dccb] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[#1a1a1a] flex items-center gap-1.5">
                  <FiCalendar size={13} className="text-[#d99a3d]" />
                  <span>Appointment Date & Time Slot</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setBookingTimeMode('slot')}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition cursor-pointer border ${
                      bookingTimeMode === 'slot'
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                        : 'bg-[#f8f4ec] text-slate-600 border-[#e3dccb]'
                    }`}
                  >
                    Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingTimeMode('custom');
                      if (customTimeVal) setBookingTime(formatTime12h(customTimeVal));
                    }}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition cursor-pointer border ${
                      bookingTimeMode === 'custom'
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                        : 'bg-[#f8f4ec] text-slate-600 border-[#e3dccb]'
                    }`}
                  >
                    ⏰ Exact Time
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />

                {bookingTimeMode === 'slot' ? (
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  >
                    <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM</option>
                    <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM</option>
                  </select>
                ) : (
                  <input
                    type="time"
                    required
                    value={customTimeVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTimeVal(val);
                      if (val) setBookingTime(formatTime12h(val));
                    }}
                    className="w-full px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onProceed}
              className="px-4 py-1.5 bg-[#d99a3d] hover:bg-[#c2872f] text-[#1a1a1a] text-xs font-black rounded-lg transition cursor-pointer border-none shadow-xs"
            >
              Continue to Coupons & Offers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
