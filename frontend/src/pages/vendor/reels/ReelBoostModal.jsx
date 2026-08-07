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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-t-3xl sm:rounded-3xl p-6 border border-white/50 shadow-2xl max-w-md w-full space-y-5 bg-surface relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 font-display">
            <FiZap className="text-amber-500 fill-amber-500/20" size={18} />
            Boost Reel Visibility
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Reel Preview Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-2xl border border-border">
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0">
            {reel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || reel.mediaType === 'video' ? (
              <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl} className="w-full h-full object-cover" alt="preview" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary line-clamp-1">{reel.caption || reel.title || 'Untitled Reel'}</p>
            <p className="text-[10px] text-text-tertiary uppercase font-extrabold mt-0.5">{reel.category} • {reel.subcategory}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-xl bg-brand-purple/5 border border-brand-purple/20 text-[10px] sm:text-xs text-brand-purple flex gap-2">
          <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="leading-normal">
            Boosted reels automatically rank at the <strong>top of customer feeds</strong> and local search results, driving up to 12x higher viewer engagement.
          </p>
        </div>

        {/* Choose Duration */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Boost Duration (Days)</label>
          <input
            type="number"
            min="1"
            max="90"
            placeholder="Enter number of days (e.g. 5)"
            value={durationDays || ''}
            onChange={handleDaysChange}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple outline-none"
          />
        </div>

        {/* Cost & Wallet Status */}
        <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="text-text-secondary">Rate Per Day</span>
            <span className="font-bold text-text-primary">{ratePerDay} Credits / Day</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2">
            <span className="text-text-secondary">Your Available Balance</span>
            <span className="font-bold text-text-primary flex items-center"><FiDollarSign className="inline-block mt-0.5" />{availableCredits}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-brand-purple">Total Cost</span>
            <span className="text-sm font-black text-brand-purple flex items-center">
              <FiZap size={14} className="mr-0.5" />
              {totalCost} Credits
            </span>
          </div>
        </div>

        {/* Insufficient balance alert */}
        {!hasEnoughCredits && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2 text-xs text-red-600 animate-fade-in">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="font-bold leading-none">Insufficient Credits</p>
              <p className="text-[10px] leading-relaxed">
                You need {totalCost - availableCredits} more credits to activate this boost. Recharge your wallet to proceed.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/vendor/wallet');
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
              >
                Recharge Wallet Now
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-surface border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-tertiary transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading}
            onClick={handleConfirmBoost}
            className={`flex-1 py-3 text-white font-bold text-xs rounded-xl shadow-premium transition flex items-center justify-center gap-1.5 ${
              isBoosting || !hasEnoughCredits || durationDays <= 0 || isDashboardLoading
                ? 'bg-text-tertiary cursor-not-allowed opacity-50'
                : 'gradient-brand hover:brightness-110'
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
