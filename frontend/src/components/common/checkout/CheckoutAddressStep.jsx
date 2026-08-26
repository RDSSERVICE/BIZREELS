import React from 'react';
import { FiMapPin } from 'react-icons/fi';

/**
 * CheckoutAddressStep — Step 1: Recipient and Delivery Address
 */
export default function CheckoutAddressStep({
  activeStep,
  setActiveStep,
  deliveryAddress,
  setDeliveryAddress,
  pincode,
  setPincode,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  addressType,
  setAddressType,
  handleFetchLiveLocation,
  isFetchingLocation,
  isService,
  onProceed,
}) {
  const isCurrent = activeStep === 1;

  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] overflow-hidden shadow-xs">
      <div
        onClick={() => setActiveStep(1)}
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
            1
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            {isService ? 'Service Location' : 'Delivery Address'}
          </span>
        </div>
        {!isCurrent && deliveryAddress && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveStep(1);
            }}
            className="text-[11px] font-extrabold text-[#d99a3d] hover:underline bg-transparent border-none cursor-pointer"
          >
            CHANGE
          </button>
        )}
      </div>

      {isCurrent ? (
        <div className="p-4 space-y-3 bg-[#faf7f2]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">Enter recipient & location details:</span>
            <button
              type="button"
              onClick={handleFetchLiveLocation}
              disabled={isFetchingLocation}
              className="px-2.5 py-1 rounded-lg bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] text-[10px] font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs border-none disabled:opacity-50"
            >
              {isFetchingLocation ? (
                <div className="w-3 h-3 rounded-full border-2 border-[#d99a3d] border-t-transparent animate-spin" />
              ) : (
                <FiMapPin size={11} />
              )}
              <span>{isFetchingLocation ? 'Detecting GPS...' : '📍 Use Live GPS'}</span>
            </button>
          </div>

          <div>
            <textarea
              rows={2}
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Complete Address: Flat/House No., Building, Street, Area, City..."
              className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#d99a3d] resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[9.5px] font-bold text-slate-500 mb-0.5 block">Pincode (Shiprocket)</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 110001"
                className="w-full px-2.5 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[9.5px] font-bold text-slate-500 mb-0.5 block">Recipient Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-2.5 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[9.5px] font-bold text-slate-500 mb-0.5 block">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-2.5 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {['HOME', 'WORK', 'OTHER'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAddressType(type)}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition cursor-pointer border ${
                    addressType === type
                      ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                      : 'bg-white text-slate-600 border-[#e3dccb]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onProceed}
              className="px-4 py-1.5 bg-[#d99a3d] hover:bg-[#c2872f] text-[#1a1a1a] text-xs font-black rounded-lg transition cursor-pointer border-none shadow-xs"
            >
              Deliver Here →
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 text-xs text-slate-600 flex items-center justify-between">
          <div className="truncate">
            <span className="font-bold text-[#1a1a1a]">{customerName || 'Customer'}</span>
            {customerPhone && <span className="ml-2 font-mono text-slate-500">{customerPhone}</span>}
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{deliveryAddress || 'No address specified'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
