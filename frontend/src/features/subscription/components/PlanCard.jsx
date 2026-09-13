import React from 'react';
import { FiCheck, FiZap, FiStar, FiShield } from 'react-icons/fi';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * PlanCard — Modular Pricing Tier Card for Vendors and Creators
 */
export default function PlanCard({
  plan,
  isCurrent,
  onSelectPlan,
  isSubscribing,
}) {
  const { bi } = useLanguage();
  const hasCredits = Number(plan.wallet_credits || 0) > 0;
  const badgeLabel = plan.badge_text || (isCurrent ? null : (plan.title.toLowerCase().includes('growth') || isPopular ? bi('Most Popular', 'सर्वाधिक लोकप्रिय') : plan.title.toLowerCase().includes('business') ? bi('Best Value', 'सर्वोत्तम मूल्य') : null));
  const addOnsCount = Array.isArray(plan.add_ons) ? plan.add_ons.filter((a) => a.is_active !== false).length : 0;

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative border-2 ${
        isCurrent
          ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-[#d99a3d] ring-2 ring-[#d99a3d]/40 shadow-xl'
          : badgeLabel
          ? 'bg-white border-[#241b15] shadow-lg hover:shadow-2xl hover:-translate-y-1'
          : 'bg-white border-[#e3dccb] shadow-xs hover:border-[#241b15] hover:shadow-md'
      }`}
    >
      {/* Popular, Best Value, or Current Badge */}
      {isCurrent ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider">
          {bi('Current Active Plan', 'सक्रिय प्लान')}
        </div>
      ) : badgeLabel ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#241b15] text-[#d99a3d] font-black text-[10px] uppercase px-3.5 py-0.5 rounded-full shadow-md tracking-wider border border-[#d99a3d]/30">
          {badgeLabel}
        </div>
      ) : null}

      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-[#1a1a1a] tracking-tight font-heading">
              {plan.title}
            </h3>
            {addOnsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[9.5px] border border-emerald-300 flex items-center gap-1">
                <FiZap size={10} className="text-[#d99a3d]" />
                <span>+{addOnsCount} {bi('Add-on', 'ऐड-ऑन')}{addOnsCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-slate-500 font-medium line-clamp-2">{plan.description}</p>
          )}
        </div>

        {/* Pricing & Credits Overview */}
        <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight font-mono">
              ₹{Number(plan.price_inr || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-slate-500">
              /{hasCredits ? bi('recharge pack', 'रीचार्ज पैक') : (plan.billing_cycle || 'month')}
            </span>
          </div>

          {/* Credits & Free Boosts Highlights */}
          {hasCredits && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-[#e3dccb]/70">
              <div className="flex items-center justify-between bg-amber-100/70 border border-amber-300/80 px-2.5 py-1 rounded-lg">
                <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                  <FiZap size={13} className="text-amber-600 fill-amber-500" />
                  <span>{plan.wallet_credits} {bi('Platform Credits', 'प्लेटफ़ॉर्म क्रेडिट')}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-1.5 py-0.5 rounded">
                  {bi('Included', 'शामिल')}
                </span>
              </div>

              {Number(plan.free_reel_boosts || 0) > 0 && (
                <div className="flex items-center justify-between bg-emerald-100/70 border border-emerald-300/80 px-2.5 py-1 rounded-lg">
                  <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                    <FiStar size={13} className="text-emerald-600 fill-emerald-500" />
                    <span>{plan.free_reel_boosts} {bi('Free Reel Boost', 'मुफ़्त रील बूस्ट')}{plan.free_reel_boosts > 1 ? 's' : ''}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded">
                    {bi('Free', 'मुफ़्त')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[10.5px]">
            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
              <span>✓</span>
              <span>{hasCredits ? bi('Non-Expiring Balance', 'क्रेडिट कभी समाप्त नहीं होते') : `${plan.duration_days || 30} ${bi('days validity', 'दिन की वैधता')}`}</span>
            </span>
          </div>
        </div>

        {/* Usage Limits & Features */}
        <div className="space-y-2 pt-1 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            {bi('Plan Entitlements:', 'प्लान के अंतर्गत शामिल:')}
          </span>

          <div className="space-y-2 font-medium text-slate-700">
            {hasCredits && (
              <>
                <div className="flex items-center gap-2">
                  <FiCheck className="text-emerald-600 shrink-0" size={14} />
                  <span>{bi('Calls, WhatsApp & Inquiries draw down from credits', 'कॉल, व्हाट्सएप और पूछताछ क्रेडिट से कटेंगे')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="text-emerald-600 shrink-0" size={14} />
                  <span>{bi('Accumulates with every additional recharge', 'हर नए रीचार्ज के साथ बैलेंस जुड़ता है')}</span>
                </div>
              </>
            )}

            {plan.verified_badge && (
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <FiShield className="shrink-0" size={14} />
                <span>{bi('Official Verified Gold Badge', 'आधिकारिक सत्यापित गोल्ड बैज')}</span>
              </div>
            )}

            {plan.priority_support && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>{bi('24/7 Priority Support Desk', '24/7 प्राथमिकता सपोर्ट')}</span>
              </div>
            )}

            {plan.priority_ranking && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>{bi('Priority Local Search & Reel Ranking', 'लोकल सर्च व रील्स में प्राथमिकता')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-5 mt-4 border-t border-[#f0ebe0]">
        <button
          type="button"
          disabled={isSubscribing}
          onClick={() => onSelectPlan(plan)}
          className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-2 ${
            badgeLabel || isCurrent
              ? 'bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] border-[#241b15]'
              : 'bg-white hover:bg-[#241b15] hover:text-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
          }`}
        >
          <FiZap size={14} />
          <span>
            {hasCredits
              ? bi(`Recharge Pack (+${plan.wallet_credits} Credits)`, `रीचार्ज करें (+${plan.wallet_credits} क्रेडिट)`)
              : (addOnsCount > 0 ? bi('Select Plan & Add-Ons', 'प्लान व ऐड-ऑन चुनें') : bi('Choose Plan', 'प्लान चुनें'))}
          </span>
        </button>
      </div>
    </div>
  );
}
