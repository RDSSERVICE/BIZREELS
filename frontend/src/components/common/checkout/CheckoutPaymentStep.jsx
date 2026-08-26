import React from 'react';
import { FiCreditCard, FiShield, FiDollarSign, FiCheck, FiCopy, FiExternalLink } from 'react-icons/fi';
import { resolveMediaUrl } from '../../../lib/api';

/**
 * CheckoutPaymentStep — Step 4: Multi-Mode Payment Options (UPI/QR, Bank Transfer, COD)
 */
export default function CheckoutPaymentStep({
  activeStep,
  setActiveStep,
  paymentMethod,
  setPaymentMethod,
  isService,
  vendorUpi,
  verifiedUpiName,
  pspBank,
  vendorQr,
  dynamicQrCodeUrl,
  upiDeepLink,
  vendorBank,
  vendorObj,
  totalAmount,
  copiedKey,
  handleCopy,
}) {
  const isCurrent = activeStep === 4;

  return (
    <div className="bg-white rounded-xl border border-[#e3dccb] overflow-hidden shadow-xs">
      <div
        onClick={() => setActiveStep(4)}
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
            4
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            Payment Selection
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase">
          {paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : paymentMethod === 'bank_transfer'
            ? 'Bank Transfer'
            : 'Direct UPI / QR'}
        </span>
      </div>

      {isCurrent && (
        <div className="p-4 space-y-3.5 bg-[#faf7f2]">
          <div className="grid grid-cols-3 gap-2">
            {/* UPI Mode */}
            <div
              onClick={() => setPaymentMethod('vendor_upi')}
              className={`p-2.5 rounded-xl border transition cursor-pointer text-center flex flex-col items-center justify-center ${
                paymentMethod === 'vendor_upi'
                  ? 'bg-amber-50/90 border-[#d99a3d] text-[#1a1a1a] font-black shadow-xs ring-1 ring-[#d99a3d]'
                  : 'bg-white border-[#e3dccb] text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiCreditCard size={17} className="text-[#d99a3d] mb-1" />
              <span className="text-[10.5px] font-bold">UPI / QR Code</span>
            </div>

            {/* Bank Mode */}
            <div
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-2.5 rounded-xl border transition cursor-pointer text-center flex flex-col items-center justify-center ${
                paymentMethod === 'bank_transfer'
                  ? 'bg-amber-50/90 border-[#d99a3d] text-[#1a1a1a] font-black shadow-xs ring-1 ring-[#d99a3d]'
                  : 'bg-white border-[#e3dccb] text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiShield size={17} className="text-[#d99a3d] mb-1" />
              <span className="text-[10.5px] font-bold">Bank Transfer</span>
            </div>

            {/* COD Mode */}
            <div
              onClick={() => setPaymentMethod('cod')}
              className={`p-2.5 rounded-xl border transition cursor-pointer text-center flex flex-col items-center justify-center ${
                paymentMethod === 'cod'
                  ? 'bg-amber-50/90 border-[#d99a3d] text-[#1a1a1a] font-black shadow-xs ring-1 ring-[#d99a3d]'
                  : 'bg-white border-[#e3dccb] text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FiDollarSign size={17} className="text-emerald-600 mb-1" />
              <span className="text-[10.5px] font-bold">{isService ? 'Pay on Visit' : 'Cash on Delivery'}</span>
            </div>
          </div>

          {/* UPI Payment Preview */}
          {paymentMethod === 'vendor_upi' && (
            <div className="p-3 bg-white rounded-xl border border-[#e3dccb] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#1a1a1a]">Verified Vendor UPI & QR</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Verified
                </span>
              </div>

              {vendorUpi ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Vendor UPI ID</span>
                      <span className="text-xs font-mono font-black text-[#1a1a1a] truncate block select-all">
                        {vendorUpi}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {verifiedUpiName} · {pspBank}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(vendorUpi, 'upi')}
                      className="px-3 py-1.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs border-none shrink-0"
                    >
                      {copiedKey === 'upi' ? (
                        <>
                          <FiCheck size={12} /> Copied
                        </>
                      ) : (
                        <>
                          <FiCopy size={12} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#f8f4ec] rounded-lg border border-[#e3dccb] flex items-center gap-3">
                    <div className="w-20 h-20 bg-white p-1 rounded-lg border border-[#e3dccb] shrink-0 flex items-center justify-center">
                      <img
                        src={vendorQr ? resolveMediaUrl(vendorQr) : dynamicQrCodeUrl}
                        alt="Vendor QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1 text-left min-w-0">
                      <p className="font-extrabold text-xs text-[#1a1a1a]">
                        Scan to Pay ₹{totalAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10.5px] text-slate-600">Scan via Google Pay, PhonePe, Paytm, or BHIM.</p>
                      {upiDeepLink && (
                        <a
                          href={upiDeepLink}
                          className="inline-flex items-center gap-1 text-[10.5px] font-black text-[#d99a3d] hover:underline mt-0.5"
                        >
                          <span>Open Installed UPI App</span>
                          <FiExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#f8f4ec] rounded-lg text-center text-slate-600">
                  <p className="text-xs font-bold text-[#1a1a1a]">
                    UPI ID: {vendorObj.phone ? `${vendorObj.phone}@upi` : 'Shared in Chat'}
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    Vendor will confirm payment details in chat upon order placement.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer Preview */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-3 bg-white rounded-xl border border-[#e3dccb] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#1a1a1a]">Bank Account Details</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Direct IMPS/NEFT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] text-xs">
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Bank Name</span>
                  <p className="font-bold text-[#1a1a1a] truncate">{vendorBank.bankName}</p>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Account Holder</span>
                  <p className="font-bold text-[#1a1a1a] truncate">{vendorBank.accountHolderName}</p>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase block">Account Number</span>
                  <p className="font-mono font-bold text-[#1a1a1a] truncate">
                    {vendorBank.accountNumber || 'Available in chat'}
                  </p>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                  <p className="font-mono font-bold text-[#1a1a1a] uppercase truncate">
                    {vendorBank.ifscCode || 'Available in chat'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COD Preview */}
          {paymentMethod === 'cod' && (
            <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-950 font-black">
                <FiDollarSign size={15} className="text-emerald-700" />
                <span>{isService ? 'Pay in Person After Service Completion' : 'Pay in Cash / UPI Upon Delivery'}</span>
              </div>
              <p className="text-[10.5px] text-emerald-800 leading-snug">
                No advance payment required. Inspect the {isService ? 'service quality' : 'product package'} upon delivery and pay directly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
