import React from 'react';
import { FiCheck, FiZap, FiShield } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

const BADGE_DESCRIPTIONS = {
  unverified: {
    label: 'Unverified Creator',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    icon: '⚪',
    desc: 'Verify contact details and government identity to get verified checkmark and brand offers.'
  },
  partially_verified: {
    label: 'Partially Verified',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: '🟡',
    desc: 'Great progress! Complete PAN, Aadhaar or Payout verification to unlock your 🟢 Verified Creator badge.'
  },
  verified_creator: {
    label: 'Verified Creator (OFFICIAL)',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: '🟢',
    desc: 'Verified Talent! You get top ranking in creator search, verified checkmark, and direct brand campaign offers.'
  },
  pro_verified: {
    label: 'Pro Verified (SUBSCRIBED)',
    color: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    icon: '🔵',
    desc: 'VIP Status! Featured placement across BizReels, premium brand discovery, and priority payout processing.'
  }
};

export default function CreatorVerificationHeader({ statusData }) {
  const { bi } = useLanguage();
  const currentBadge = BADGE_DESCRIPTIONS[statusData?.tier] || BADGE_DESCRIPTIONS.unverified;
  const completion = statusData?.completionPercentage || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-surface-secondary to-brand-purple/5 border border-border/80 p-6 sm:p-8 shadow-card space-y-6">
      {/* Ambient decorative glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top row: Badge, Title & Score */}
      <div className="relative z-10 border-b border-border/60 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-text-primary font-heading">
          {bi('Creator Verification Center', 'क्रिएटर सत्यापन केंद्र')}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-3xl">
          {bi(
            'Verify your contact details, government identity (Aadhaar & PAN), and UPI/Bank payout account to earn your verified creator badge.',
            'अपना सत्यापित क्रिएटर बैज अर्जित करने के लिए अपने संपर्क विवरण, सरकारी पहचान (आधार और पैन), और यूपीआई/बैंक पेआउट खाते को सत्यापित करें।'
          )}
        </p>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3.5">
          <span className="text-3xl sm:text-4xl filter drop-shadow">{currentBadge.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentBadge.color}`}>
                {bi(currentBadge.label, {
                  'Unverified Creator': 'असत्यापित क्रिएटर',
                  'Partially Verified': 'आंशिक रूप से सत्यापित',
                  'Verified Creator (OFFICIAL)': 'सत्यापित क्रिएटर (आधिकारिक)',
                  'Pro Verified (SUBSCRIBED)': 'प्रो सत्यापित (सब्सक्राइब्ड)'
                }[currentBadge.label] || currentBadge.label)}
              </span>
              {(statusData?.tier === 'verified_creator' || statusData?.tier === 'pro_verified') && (
                <span className="bg-emerald-500 text-white p-1 rounded-full text-xs flex items-center justify-center shadow-sm">
                  <FiCheck className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-xl">{bi(
              currentBadge.desc,
              {
                unverified: 'सत्यापित चेकमार्क और ब्रांड ऑफ़र पाने के लिए संपर्क विवरण और सरकारी पहचान सत्यापित करें।',
                partially_verified: 'बहुत अच्छी प्रगति! अपना सत्यापित क्रिएटर बैज अनलॉक करने के लिए पैन, आधार या भुगतान सत्यापन पूरा करें।',
                verified_creator: 'सत्यापित प्रतिभा! आपको क्रिएटर खोज में शीर्ष रैंकिंग, सत्यापित चेकमार्क और सीधे ब्रांड अभियान ऑफ़र मिलेंगे।',
                pro_verified: 'वीआईपी स्थिति! बिजरील्स पर प्रमुख स्थान, प्रीमियम ब्रांड खोज और प्राथमिकता भुगतान प्रसंस्करण पाएं।'
              }[statusData?.tier] || currentBadge.desc
            )}</p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-surface/70 border border-border/60 px-4 py-2.5 rounded-2xl shadow-sm">
          <span className="text-2xl sm:text-3xl font-black text-text-primary font-heading tracking-tight">{completion}%</span>
          <span className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{bi('Verification Score', 'सत्यापन स्कोर')}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 space-y-2">
        <div className="w-full bg-surface-tertiary h-3 rounded-full overflow-hidden p-0.5 border border-border/70">
          <div
            className="gradient-brand h-full rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="text-[11px] text-text-secondary flex items-center justify-between font-medium">
          <span>{bi('Priority ranking in Creator Marketplace', 'क्रिएटर मार्केटप्लेस में प्राथमिकता रैंकिंग')}</span>
          <span className="text-brand-purple font-bold flex items-center gap-1">
            <FiZap size={13} /> {bi('5x More Direct Brand Offers', '5 गुना अधिक सीधे ब्रांड ऑफ़र')}
          </span>
        </div>
      </div>

      {/* Benefits Highlights Banner */}
      <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
            <FiShield size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary">{bi('Instant Government & Banking Verification', 'तुरंत सरकारी और बैंकिंग सत्यापन')}</h4>
            <p className="text-[11px] text-text-secondary">{bi('Official Sandbox API verifies your Aadhaar, PAN, Bank and UPI in real time for instant verified talent approval.', 'आधिकारिक सैंडबॉक्स एपीआई आपके आधार, पैन, बैंक और यूपीआई को रियल टाइम में सत्यापित करके तुरंत क्रिएटर अनुमोदन देता है।')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
