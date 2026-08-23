import React from 'react';
import { FiCheck, FiZap, FiShield, FiAward } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

const BADGE_DESCRIPTIONS = {
  unverified: {
    label: 'Unverified Creator',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: '⚪',
    desc: 'Verify contact details and government identity to get verified checkmark and brand offers.'
  },
  partially_verified: {
    label: 'Partially Verified',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '🟡',
    desc: 'Great progress! Complete PAN, Aadhaar or Payout verification to unlock your 🟢 Verified Creator badge.'
  },
  verified_creator: {
    label: 'Verified Creator (OFFICIAL)',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: '🟢',
    desc: 'Verified Talent! You get top ranking in creator search, verified checkmark, and direct brand campaign offers.'
  },
  pro_verified: {
    label: 'Pro Verified (SUBSCRIBED)',
    badgeBg: 'bg-[#d99a3d]/20 text-[#241b15] border-[#d99a3d]',
    icon: '🔵',
    desc: 'VIP Status! Featured placement across BizReels, premium brand discovery, and priority payout processing.'
  }
};

export default function CreatorVerificationHeader({ statusData }) {
  const { bi } = useLanguage();
  const currentBadge = BADGE_DESCRIPTIONS[statusData?.tier] || BADGE_DESCRIPTIONS.unverified;
  const completion = statusData?.completionPercentage || 0;

  return (
    <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs space-y-5">
      {/* Top row: Title, Eyebrow & Shield Icon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            CREATOR KYC &amp; VERIFICATION CENTER
          </span>
          <h1
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-xl sm:text-2xl uppercase tracking-wide text-white"
          >
            {bi('CREATOR VERIFICATION STATUS', 'क्रिएटर सत्यापन स्थिति')}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {bi(
              'Verify your contact details, government identity (Aadhaar & PAN), and UPI/Bank payout account to earn your verified creator badge.',
              'अपना सत्यापित क्रिएटर बैज अर्जित करने के लिए अपने संपर्क विवरण, सरकारी पहचान (आधार और पैन), और यूपीआई/बैंक पेआउट खाते को सत्यापित करें।'
            )}
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a] shadow-xs">
          <FiShield size={24} />
        </div>
      </div>

      {/* Center Row: Tier Card & Verification Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-md">
        <div className="flex items-center gap-3.5">
          <span className="text-3xl filter drop-shadow">{currentBadge.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider border ${currentBadge.badgeBg}`}>
                {bi(currentBadge.label, {
                  'Unverified Creator': 'असत्यापित क्रिएटर',
                  'Partially Verified': 'आंशिक रूप से सत्यापित',
                  'Verified Creator (OFFICIAL)': 'सत्यापित क्रिएटर (आधिकारिक)',
                  'Pro Verified (SUBSCRIBED)': 'प्रो सत्यापित (सब्सक्राइब्ड)'
                }[currentBadge.label] || currentBadge.label)}
              </span>
              {(statusData?.tier === 'verified_creator' || statusData?.tier === 'pro_verified') && (
                <span className="bg-emerald-500 text-white p-0.5 rounded-full text-xs flex items-center justify-center">
                  <FiCheck className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              {bi(
                currentBadge.desc,
                {
                  unverified: 'सत्यापित चेकमार्क और ब्रांड ऑफ़र पाने के लिए संपर्क विवरण और सरकारी पहचान सत्यापित करें।',
                  partially_verified: 'बहुत अच्छी प्रगति! अपना सत्यापित क्रिएटर बैज अनलॉक करने के लिए पैन, आधार या भुगतान सत्यापन पूरा करें।',
                  verified_creator: 'सत्यापित प्रतिभा! आपको क्रिएटर खोज में शीर्ष रैंकिंग, सत्यापित चेकमार्क और सीधे ब्रांड अभियान ऑफ़र मिलेंगे।',
                  pro_verified: 'वीआईपी स्थिति! बिजरील्स पर प्रमुख स्थान, प्रीमियम ब्रांड खोज और प्राथमिकता भुगतान प्रसंस्करण पाएं।'
                }[statusData?.tier] || currentBadge.desc
              )}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-[#1a130e] border border-[#d99a3d]/40 px-4 py-2 rounded-md">
          <span className="text-2xl font-black text-[#d99a3d] font-mono">{completion}%</span>
          <span className="block text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
            {bi('KYC SCORE', 'केवाईसी स्कोर')}
          </span>
        </div>
      </div>

      {/* Progress Bar & Highlight */}
      <div className="space-y-1.5">
        <div className="w-full bg-[#1a130e] h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-[#d99a3d] h-full rounded-full transition-all duration-700"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-300 flex items-center justify-between font-medium">
          <span>{bi('Priority ranking in Creator Marketplace', 'क्रिएटर मार्केटप्लेस में प्राथमिकता रैंकिंग')}</span>
          <span className="text-[#d99a3d] font-bold flex items-center gap-1">
            <FiZap size={13} /> {bi('5x More Direct Brand Offers', '5 गुना अधिक सीधे ब्रांड ऑफ़र')}
          </span>
        </div>
      </div>
    </div>
  );
}
