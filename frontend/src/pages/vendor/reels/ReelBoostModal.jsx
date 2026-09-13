import React, { useState } from 'react';
import { FiZap, FiX, FiInfo, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetVendorDashboardQuery, useBoostReelMutation } from '../../../features/vendor/vendorApi';

export default function ReelBoostModal({ isOpen, onClose, reel, refetchReels }) {
  const navigate = useNavigate();
  const [durationDays, setDurationDays] = useState(3);

  const { data: dashboardRes, isLoading: isDashboardLoading } = useGetVendorDashboardQuery(undefined, {
    skip: !isOpen
  });
  const [boostReel, { isLoading: isBoosting }] = useBoostReelMutation();

  if (!isOpen || !reel) return null;

  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const availableCredits = metrics.credits?.available ?? metrics.credits?.walletBalance ?? 0;
  
  const creditRates = metrics.creditRates || {};
  const ratePerDay = creditRates.reelBoost1Day ?? 10;

  const totalCost = durationDays * ratePerDay;
  const hasEnoughCredits = availableCredits >= totalCost;

  const handleDaysChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setDurationDays(isNaN(val) ? 0 : val);
  };

  const handleConfirmBoost = async () => {
    if (durationDays <= 0) {
      toast.error('Please select a valid boost duration.');
      return;
    }

    if (!hasEnoughCredits) {
      toast.error('Insufficient credits in your wallet.');
      return;
    }

    const toastId = toast.loading('Activating Reel Boost...');
    try {
      await boostReel({ id: reel._id || reel.id, durationDays }).unwrap();
      toast.success(`Reel boosted successfully for ${durationDays} days!`, { id: toastId });
      if (refetchReels) refetchReels();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to boost reel', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-2xl rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3.5 bg-[#f8f4ec] -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
          <h3 className="text-sm sm:text-base font-black text-[#1a1a1a] flex items-center gap-2">
            <FiZap className="text-amber-600 fill-amber-500/20" size={18} />
            Boost Reel Visibility
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition border border-[#e3dccb] cursor-pointer shadow-2xs"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Reel Preview Info */}
        <div className="flex items-center gap-3 p-3.5 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] shadow-2xs">
          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-[#e3dccb] flex-shrink-0 shadow-xs">
            {reel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || reel.mediaType === 'video' ? (
              <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl} className="w-full h-full object-cover" alt="preview" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1a1a1a] line-clamp-1">{reel.caption || reel.title || 'Untitled Reel'}</p>
            <p className="text-[10px] text-amber-900 uppercase font-black mt-0.5">{reel.category} • {reel.subcategory}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex gap-2.5 shadow-2xs">
          <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
          <p className="leading-relaxed text-[11px] font-medium">
            Boosted reels automatically rank at the <strong className="font-extrabold text-amber-950">top of customer feeds</strong> and local search results, driving up to 12x higher viewer engagement.
          </p>
        </div>

        {/* Choose Duration */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
            Boost Duration (Days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            placeholder="Enter number of days (e.g. 5)"
            value={durationDays || ''}
            onChange={handleDaysChange}
            className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs"
          />
        </div>

        {/* Cost & Wallet Status */}
        <div className="p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs border-b border-[#e3dccb] pb-2">
            <span className="text-slate-600 font-semibold">Rate Per Day</span>
            <span className="font-extrabold text-[#1a1a1a]">{ratePerDay} Credits / Day</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-[#e3dccb] pb-2">
            <span className="text-slate-600 font-semibold">Your Available Balance</span>
            <span className="font-extrabold text-[#1a1a1a] flex items-center">
              <FiDollarSign className="inline-block" />{availableCredits} Credits
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-black text-slate-700 uppercase tracking-wide">Total Cost</span>
            <span className="text-base font-black text-amber-700 flex items-center">
              <FiZap size={15} className="mr-0.5 text-amber-600 fill-amber-500" />
              {totalCost} Credits
            </span>
          </div>
        </div>

        {/* Insufficient balance alert */}
        {!hasEnoughCredits && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in shadow-2xs">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 space-y-1.5">
              <p className="font-extrabold text-rose-800">Insufficient Credits</p>
              <p className="text-[11px] leading-relaxed text-rose-700">
                You need {totalCost - availableCredits} more credits to activate this boost. Recharge your wallet to proceed.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/vendor/subscription');
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Recharge Wallet Now
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-[#e3dccb] rounded-full text-xs font-bold text-slate-700 hover:text-black hover:bg-[#ede5d8] transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading}
            onClick={handleConfirmBoost}
            className={`flex-1 py-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400 ${
              isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300 shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 hover:scale-[1.01]'
            }`}
          >
            <FiZap size={14} />
            {isBoosting ? 'Activating...' : 'Confirm Boost'}
          </button>
        </div>

      </div>
    </div>
  );
}

