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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#1e2026] text-slate-100 border border-amber-500/40 shadow-2xl shadow-amber-950/40 rounded-3xl p-6 sm:p-7 max-w-lg w-full relative overflow-hidden">
        
        {/* Glow effect in background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition border border-white/10 cursor-pointer z-10"
          title="Dismiss"
        >
          <FiX size={16} />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
            <FiZap className="text-amber-400 fill-amber-400 animate-pulse" size={13} />
            Lead Acceleration Tip
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Boost Your Reel for <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">10x More Leads!</span> 🚀
          </h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Your reels are live, but unboosted! Boosted reels appear at the top of local customer searches and home feeds.
          </p>
        </div>

        {/* Unboosted Reel Card Preview */}
        {currentReel && (
          <div className="p-3.5 bg-[#282a33] rounded-2xl border border-amber-500/30 mb-5 relative">
            <div className="flex items-center gap-3">
              <div className="w-14 h-16 rounded-xl overflow-hidden bg-black border border-white/15 flex-shrink-0 relative">
                {currentReel.videoUrl?.match(/\.(mp4|mov|webm)$/i) || currentReel.mediaType === 'video' ? (
                  <video src={currentReel.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={currentReel.mediaUrls?.[0] || currentReel.thumbnailUrl || currentReel.videoUrl || '/placeholder.png'}
                    className="w-full h-full object-cover"
                    alt="reel preview"
                  />
                )}
                <span className="absolute top-1 left-1 bg-black/70 px-1 py-0.2 rounded text-[8px] font-bold text-amber-300 uppercase">
                  Live
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider truncate">
                    {currentReel.category || 'General'} {currentReel.subcategory ? `• ${currentReel.subcategory}` : ''}
                  </span>
                  <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shrink-0">
                    Not Boosted
                  </span>
                </div>
                <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                  {currentReel.caption || currentReel.title || 'Your Published Reel'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  🚀 Ready for 5x–10x local viewer boost
                </p>
              </div>
            </div>

            {/* Multiple unboosted reels selector pills */}
            {unboostedReels.length > 1 && (
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {unboostedReels.length} unboosted reel(s)
                </span>
                <div className="flex items-center gap-1">
                  {unboostedReels.slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedReelIndex(idx)}
                      className={`w-5 h-5 rounded-full text-[10px] font-extrabold transition cursor-pointer flex items-center justify-center ${
                        selectedReelIndex === idx
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20'
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
          <div className="p-3 bg-[#282a33]/80 rounded-2xl border border-white/10 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FiTarget size={14} />
            </div>
            <p className="text-xs font-bold text-white leading-tight">Top Placement</p>
            <p className="text-[10px] text-slate-400 leading-snug">Ranks at the top of local customer feeds.</p>
          </div>

          <div className="p-3 bg-[#282a33]/80 rounded-2xl border border-white/10 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FiTrendingUp size={14} />
            </div>
            <p className="text-xs font-bold text-white leading-tight">5x–10x Reach</p>
            <p className="text-[10px] text-slate-400 leading-snug">Viral impressions in your immediate city radius.</p>
          </div>

          <div className="p-3 bg-[#282a33]/80 rounded-2xl border border-white/10 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FiMessageSquare size={14} />
            </div>
            <p className="text-xs font-bold text-white leading-tight">Direct Inquiries</p>
            <p className="text-[10px] text-slate-400 leading-snug">Get fast customer calls & WhatsApp leads.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleBoostNow}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiZap size={16} className="fill-slate-950" />
            <span>Boost This Reel Now ⚡</span>
            <FiChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>

      </div>
    </div>
  );
}
