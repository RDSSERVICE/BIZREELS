import React from 'react';
import { FiZap, FiInfo } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * PlatformCreditsCard
 * Displays prepaid platform usage credits (utility token balance, 1 Credit = ₹1 INR).
 * Non-withdrawable balance used for reel boosts, lead unlocks, proposals, and listings.
 */
export default function PlatformCreditsCard({
  credits = 0,
  freeReelBoosts = 0,
  onOpenRecharge,
  onViewRates,
}) {
  const { bi } = useLanguage();

  return (
    <div className="bg-[#241b15] text-white p-6 sm:p-7 rounded-2xl border-2 border-[#241b15] shadow-md flex flex-col justify-between relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#d99a3d]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#d99a3d] bg-white/10 px-2.5 py-1 rounded-md">
            ⚡ {bi('PLATFORM USAGE CREDITS', 'प्लेटफ़ॉर्म उपयोग क्रेडिट्स')}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            ✓ {bi('Non-Expiring Balance', 'कभी समाप्त नहीं होते')}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            >
              {Number(credits || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {bi('Credits', 'क्रेडिट्स')}
            </span>
          </div>

          {freeReelBoosts > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
              <FiZap size={13} className="fill-emerald-400 text-emerald-400" />
              <span>
                {freeReelBoosts} {bi('Free Reel Boosts Remaining', 'मुफ़्त रील बूस्ट शेष')}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-300 font-medium">
          {bi(
            'Draws down at 2.00/boost, 2.50/WhatsApp, 2.50/call lead, 1.00/post. 1 Credit = ₹1. Credits accumulate on every recharge.',
            'प्रत्येक रीचार्ज पर क्रेडिट जमा होते हैं और कॉल, व्हाट्सएप, बूस्ट्स पर स्वतः कटते हैं। 1 क्रेडिट = ₹1।'
          )}
        </p>
      </div>

      <div className="pt-5 mt-4 border-t border-white/10 flex items-center gap-3 z-10">
        <button
          type="button"
          onClick={onOpenRecharge}
          className="flex-1 py-3 px-4 bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#eab35b] text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <FiZap size={16} className="fill-current" />
          <span>{bi('RECHARGE CREDITS', 'क्रेडिट रीचार्ज करें')}</span>
        </button>

        <button
          type="button"
          onClick={onViewRates}
          className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FiInfo size={15} />
          <span>{bi('View Rates', 'दरें देखें')}</span>
        </button>
      </div>
    </div>
  );
}
