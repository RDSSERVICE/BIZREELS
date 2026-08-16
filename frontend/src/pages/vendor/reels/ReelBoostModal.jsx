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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#24262d] text-slate-100 border border-amber-500/30 shadow-2xl shadow-slate-950/60 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-5 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-3.5">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 font-display">
            <FiZap className="text-amber-400 fill-amber-500/20" size={18} />
            Boost Reel Visibility
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition border border-white/10 cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Reel Preview Info */}
        <div className="flex items-center gap-3 p-3.5 bg-[#2b2d36] rounded-2xl border border-amber-500/25">
          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-white/15 flex-shrink-0">
            {reel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || reel.mediaType === 'video' ? (
              <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl} className="w-full h-full object-cover" alt="preview" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white line-clamp-1">{reel.caption || reel.title || 'Untitled Reel'}</p>
            <p className="text-[10px] text-amber-300 uppercase font-extrabold mt-0.5">{reel.category} • {reel.subcategory}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex gap-2.5">
          <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <p className="leading-relaxed">
            Boosted reels automatically rank at the <strong>top of customer feeds</strong> and local search results, driving up to 12x higher viewer engagement.
          </p>
        </div>

        {/* Choose Duration */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">Boost Duration (Days)</label>
          <input
            type="number"
            min="1"
            max="90"
            placeholder="Enter number of days (e.g. 5)"
            value={durationDays || ''}
            onChange={handleDaysChange}
            className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
          />
        </div>

        {/* Cost & Wallet Status */}
        <div className="p-4 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
            <span className="text-slate-300">Rate Per Day</span>
            <span className="font-bold text-white">{ratePerDay} Credits / Day</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
            <span className="text-slate-300">Your Available Balance</span>
            <span className="font-bold text-white flex items-center"><FiDollarSign className="inline-block mt-0.5" />{availableCredits}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-amber-300">Total Cost</span>
            <span className="text-sm font-black text-amber-400 flex items-center">
              <FiZap size={14} className="mr-0.5" />
              {totalCost} Credits
            </span>
          </div>
        </div>

        {/* Insufficient balance alert */}
        {!hasEnoughCredits && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 animate-fade-in">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1 space-y-1.5">
              <p className="font-bold leading-none text-red-300">Insufficient Credits</p>
              <p className="text-[10px] leading-relaxed">
                You need {totalCost - availableCredits} more credits to activate this boost. Recharge your wallet to proceed.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/vendor/wallet');
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
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
            className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/15 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading}
            onClick={handleConfirmBoost}
            className={`flex-1 py-3.5 text-white font-extrabold text-xs rounded-full shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400 ${
              isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading
                ? 'bg-white/10 text-slate-500 cursor-not-allowed border-none shadow-none'
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

