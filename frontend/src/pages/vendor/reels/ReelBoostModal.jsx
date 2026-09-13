import React, { useState } from 'react';
import { FiZap, FiX, FiInfo, FiDollarSign, FiAlertCircle, FiGift, FiCheckCircle, FiClock, FiEdit3 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGetVendorDashboardQuery, useBoostReelMutation } from '../../../features/vendor/vendorApi';

const PRESET_DURATIONS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days (Recommended)', recommended: true },
  { days: 14, label: '14 Days' },
  { days: 30, label: '30 Days' },
];

export default function ReelBoostModal({ isOpen, onClose, reel, refetchReels }) {
  const navigate = useNavigate();
  const [durationDays, setDurationDays] = useState(1);
  const [isCustom, setIsCustom] = useState(false);
  const [customDays, setCustomDays] = useState('');

  const { data: dashboardRes, isLoading: isDashboardLoading } = useGetVendorDashboardQuery(undefined, {
    skip: !isOpen
  });
  const [boostReel, { isLoading: isBoosting }] = useBoostReelMutation();

  if (!isOpen || !reel) return null;

  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const availableCredits = Number(metrics.credits?.available ?? metrics.credits?.walletBalance ?? 0);
  const freeReelBoosts = Number(metrics.credits?.free_reel_boosts ?? metrics.credits?.freeReelBoosts ?? 0);

  // Rate is 2.00 Credits PER DAY
  const creditRates = metrics.creditRates || {};
  const ratePerDay = Number(creditRates.reelBoost1Day ?? creditRates.reelBoostAdditional ?? 2.00);

  // Active duration in days
  const activeDuration = isCustom ? (parseInt(customDays, 10) || 0) : durationDays;

  // Free boost entitlement from subscription plan (Starter: 1, Growth: 3, Business: 5)
  const hasFreeBoost = freeReelBoosts > 0;
  
  // Total cost: 0 if vendor has free boost from plan, otherwise (activeDuration * 2.00 Credits)
  const totalCost = hasFreeBoost ? 0 : Number((activeDuration * ratePerDay).toFixed(2));
  const hasEnoughCredits = hasFreeBoost || availableCredits >= totalCost;

  const handlePresetSelect = (days) => {
    setIsCustom(false);
    setDurationDays(days);
  };

  const handleCustomDaysChange = (e) => {
    const val = e.target.value;
    setCustomDays(val);
    if (!isCustom) setIsCustom(true);
  };

  const handleConfirmBoost = async () => {
    if (activeDuration <= 0) {
      toast.error('Please specify a valid duration of at least 1 day.');
      return;
    }

    if (activeDuration > 90) {
      toast.error('Boost duration cannot exceed 90 days at once.');
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(`Insufficient credits. You need ${totalCost.toFixed(2)} credits but have ${availableCredits.toFixed(2)} credits.`);
      return;
    }

    const toastId = toast.loading(
      hasFreeBoost
        ? `Activating Free Reel Boost (${activeDuration} day${activeDuration === 1 ? '' : 's'})...`
        : `Activating Reel Boost for ${activeDuration} day${activeDuration === 1 ? '' : 's'} (${totalCost.toFixed(2)} Credits)...`
    );

    try {
      await boostReel({ id: reel._id || reel.id, durationDays: activeDuration }).unwrap();
      toast.success(
        hasFreeBoost
          ? `🎉 Free Reel Boost activated for ${activeDuration} day${activeDuration === 1 ? '' : 's'}! (${freeReelBoosts - 1} free boosts remaining)`
          : `✓ Reel boosted for ${activeDuration} day${activeDuration === 1 ? '' : 's'}! (${totalCost.toFixed(2)} Credits deducted at ${ratePerDay.toFixed(2)}/day)`,
        { id: toastId, duration: 5000 }
      );
      if (refetchReels) refetchReels();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to boost reel', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-2xl rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3.5 bg-[#f8f4ec] -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#1a1a1a] flex items-center gap-2">
              <FiZap className="text-amber-600 fill-amber-500/20" size={18} />
              Boost Reel Visibility
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Rank #1 on customer feed & local search</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition border border-[#e3dccb] cursor-pointer shadow-2xs"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Reel Preview Info */}
        <div className="flex items-center gap-3 p-3 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] shadow-2xs">
          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black border border-[#e3dccb] flex-shrink-0 shadow-xs">
            {reel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || reel.mediaType === 'video' ? (
              <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl} className="w-full h-full object-cover" alt="preview" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1a1a1a] line-clamp-1">{reel.caption || reel.title || 'Untitled Reel'}</p>
            <p className="text-[10px] text-amber-900 uppercase font-black mt-0.5">{reel.category || 'Service'} • {reel.subcategory || 'General'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded text-[10px] font-black text-amber-900">
              Rate: {ratePerDay.toFixed(2)} Credits / Day
            </span>
          </div>
        </div>

        {/* Free Boost Privilege Banner (from Subscription Plan) */}
        {hasFreeBoost ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 text-xs text-amber-950 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center shadow-xs">
                <FiGift size={16} />
              </span>
              <div>
                <p className="font-extrabold text-xs text-amber-950 flex items-center gap-1">
                  Plan Entitlement Active <FiCheckCircle className="text-amber-700" size={13} />
                </p>
                <p className="text-[11px] text-amber-800">
                  You have <strong className="font-black text-amber-950">{freeReelBoosts} Free Reel Boost{freeReelBoosts > 1 ? 's' : ''}</strong> available in your plan.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white border border-amber-300 text-amber-900 font-black text-[11px] shadow-2xs">
              0 Credits
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex gap-2.5 shadow-2xs">
            <FiInfo className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            <p className="leading-relaxed text-[11px] font-medium">
              Boosted reels receive priority placement across customer feeds and local searches at <strong className="font-black text-amber-950">{ratePerDay.toFixed(2)} Credits per day</strong>.
            </p>
          </div>
        )}

        {/* Choose Duration Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <FiClock className="text-amber-600" size={13} />
              Select Duration
            </label>
            <button
              type="button"
              onClick={() => {
                if (isCustom) {
                  setIsCustom(false);
                } else {
                  setIsCustom(true);
                  if (!customDays) setCustomDays('1');
                }
              }}
              className="text-[11px] font-extrabold text-amber-800 hover:text-amber-950 underline decoration-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <FiEdit3 size={12} />
              {isCustom ? '← Quick Presets' : '+ Custom Days'}
            </button>
          </div>

          {/* Quick Preset Buttons (1, 3, 7, 14, 30 Days) */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_DURATIONS.map((opt) => {
              const isSelected = !isCustom && durationDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handlePresetSelect(opt.days)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400/50 shadow-xs'
                      : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec]'
                  }`}
                >
                  <span className="font-extrabold">{opt.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {hasFreeBoost ? '0 Credits' : `${(opt.days * ratePerDay).toFixed(2)} Credits`}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5">
                      <FiZap size={11} className="text-amber-600 fill-amber-500" />
                    </span>
                  )}
                </button>
              );
            })}

            {/* Custom Days Button Tile */}
            <button
              type="button"
              onClick={() => {
                setIsCustom(true);
                if (!customDays) setCustomDays('1');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                isCustom
                  ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400/50 shadow-xs'
                  : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec]'
              }`}
            >
              <span className="font-extrabold flex items-center gap-1">
                <FiEdit3 size={11} /> Custom
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                {isCustom && customDays ? `${customDays} Days` : 'Any Days'}
              </span>
            </button>
          </div>

          {/* Custom Duration Input Field */}
          {isCustom && (
            <div className="p-3 bg-[#f8f4ec] rounded-2xl border border-amber-300 animate-fade-in space-y-1.5">
              <label className="text-[10px] font-black uppercase text-amber-950 tracking-wide block">
                Enter Custom Boost Duration (1 to 90 Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="e.g. 1, 5, 10, 21"
                  value={customDays}
                  onChange={handleCustomDaysChange}
                  className="flex-1 p-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-2xs"
                  autoFocus
                />
                <span className="text-xs font-bold text-slate-600 px-2">Days</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Cost calculation: {activeDuration || 0} Day{activeDuration === 1 ? '' : 's'} × {ratePerDay.toFixed(2)} Credits = {totalCost.toFixed(2)} Credits
              </p>
            </div>
          )}
        </div>

        {/* Cost & Wallet Status Breakdown */}
        <div className="p-4 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs border-b border-[#e3dccb] pb-2">
            <span className="text-slate-600 font-semibold">Rate Per Day</span>
            <span className="font-bold text-[#1a1a1a]">{ratePerDay.toFixed(2)} Credits / Day</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-[#e3dccb] pb-2">
            <span className="text-slate-600 font-semibold">Selected Duration</span>
            <span className="font-bold text-[#1a1a1a]">
              {activeDuration > 0 ? `${activeDuration} Day${activeDuration === 1 ? '' : 's'}` : '0 Days'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-[#e3dccb] pb-2">
            <span className="text-slate-600 font-semibold">Available Wallet Balance</span>
            <span className="font-bold text-[#1a1a1a] flex items-center">
              <FiDollarSign className="inline-block" />{availableCredits.toFixed(2)} Credits
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="font-black text-slate-800 uppercase tracking-wide block">Total Cost</span>
              {!hasFreeBoost && activeDuration > 0 && (
                <span className="text-[10px] text-slate-500 font-medium">
                  ({activeDuration} days × {ratePerDay.toFixed(2)} Credits)
                </span>
              )}
            </div>
            <span className="text-base font-black text-amber-700 flex items-center">
              <FiZap size={16} className="mr-0.5 text-amber-600 fill-amber-500" />
              {hasFreeBoost ? (
                <span className="text-emerald-700 font-black">0 Credits (1 Free Boost Used)</span>
              ) : (
                `${totalCost.toFixed(2)} Credits`
              )}
            </span>
          </div>
        </div>

        {/* Insufficient balance alert */}
        {!hasEnoughCredits && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in shadow-2xs">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 space-y-2">
              <p className="font-extrabold text-rose-800">Insufficient Credits for Reel Boost</p>
              <p className="text-[11px] leading-relaxed text-rose-700">
                You need <strong>{totalCost.toFixed(2)} Credits</strong> for {activeDuration} days (Available: <strong>{availableCredits.toFixed(2)} Credits</strong>). You need <strong>{(totalCost - availableCredits).toFixed(2)} more credits</strong>.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/pricing');
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  View Subscription Plans
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/vendor/wallet?tab=plans');
                  }}
                  className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-900 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer hover:bg-rose-50"
                >
                  Recharge Wallet
                </button>
              </div>
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
            disabled={isBoosting || !hasEnoughCredits || activeDuration <= 0 || isDashboardLoading}
            onClick={handleConfirmBoost}
            className={`flex-1 py-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400 ${
              isBoosting || !hasEnoughCredits || activeDuration <= 0 || isDashboardLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300 shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 hover:scale-[1.01]'
            }`}
          >
            <FiZap size={14} />
            {isBoosting
              ? 'Activating...'
              : hasFreeBoost
              ? `Activate Free Boost (${activeDuration} Day${activeDuration === 1 ? '' : 's'})`
              : `Boost for ${totalCost.toFixed(2)} Credits (${activeDuration} Day${activeDuration === 1 ? '' : 's'})`}
          </button>
        </div>

      </div>
    </div>
  );
}


