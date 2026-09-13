import React, { useState } from 'react';
import { FiZap, FiX, FiTrendingUp, FiTarget, FiMessageSquare, FiChevronRight } from 'react-icons/fi';

export default function ReelBoostPromptModal({
  isOpen,
  onClose,
  unboostedReels = [],
  onSelectReelToBoost,
}) {
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  if (!isOpen || !unboostedReels || unboostedReels.length === 0) return null;

  const currentReel = unboostedReels[selectedReelIndex] || unboostedReels[0];

  const handleBoostNow = () => {
    if (onSelectReelToBoost && currentReel) {
      onSelectReelToBoost(currentReel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-2xl rounded-3xl p-6 sm:p-7 max-w-lg w-full relative overflow-hidden">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition border border-[#e3dccb] cursor-pointer z-10 shadow-2xs"
          title="Dismiss"
        >
          <FiX size={16} />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <FiZap className="text-amber-600 fill-amber-500 animate-pulse" size={13} />
            Lead Acceleration Tip
          </div>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl text-[#1a1a1a] tracking-tight uppercase">
            Boost Your Reel for <span className="text-amber-600">10x More Leads!</span> 🚀
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
            Your reels are live, but unboosted! Boosted reels appear at the top of local customer searches and home feeds.
          </p>
        </div>

        {/* Unboosted Reel Card Preview */}
        {currentReel && (
          <div className="p-3.5 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] mb-5 relative shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-16 rounded-xl overflow-hidden bg-black border border-[#e3dccb] flex-shrink-0 relative shadow-xs">
                {currentReel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || currentReel.mediaType === 'video' ? (
                  <video src={currentReel.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={currentReel.mediaUrls?.[0] || currentReel.thumbnailUrl || currentReel.videoUrl || '/placeholder.png'}
                    className="w-full h-full object-cover"
                    alt="reel preview"
                  />
                )}
                <span className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-black text-amber-300 uppercase">
                  Live
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider truncate">
                    {currentReel.category || 'General'} {currentReel.subcategory ? `• ${currentReel.subcategory}` : ''}
                  </span>
                  <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                    Not Boosted
                  </span>
                </div>
                <p className="text-xs font-bold text-[#1a1a1a] line-clamp-1 mt-0.5">
                  {currentReel.caption || currentReel.title || 'Your Published Reel'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  🚀 Ready for 5x–10x local viewer boost
                </p>
              </div>
            </div>

            {/* Multiple unboosted reels selector pills */}
            {unboostedReels.length > 1 && (
              <div className="mt-3 pt-2.5 border-t border-[#e3dccb] flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-bold">
                  {unboostedReels.length} unboosted reel(s)
                </span>
                <div className="flex items-center gap-1">
                  {unboostedReels.slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedReelIndex(idx)}
                      className={`w-6 h-6 rounded-full text-[10px] font-black transition cursor-pointer flex items-center justify-center ${
                        selectedReelIndex === idx
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white border border-[#e3dccb] text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="p-3 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center">
              <FiTarget size={14} />
            </div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight">Top Placement</p>
            <p className="text-[10px] text-slate-500 font-medium leading-snug">Ranks at top of local customer feeds.</p>
          </div>

          <div className="p-3 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center">
              <FiTrendingUp size={14} />
            </div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight">5x–10x Reach</p>
            <p className="text-[10px] text-slate-500 font-medium leading-snug">Viral impressions in your immediate city radius.</p>
          </div>

          <div className="p-3 bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] space-y-1 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center">
              <FiMessageSquare size={14} />
            </div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight">Direct Inquiries</p>
            <p className="text-[10px] text-slate-500 font-medium leading-snug">Get fast customer calls & WhatsApp leads.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleBoostNow}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
          >
            <FiZap size={15} className="fill-white" />
            <span>Boost This Reel Now ⚡</span>
            <FiChevronRight size={15} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>

      </div>
    </div>
  );
}
