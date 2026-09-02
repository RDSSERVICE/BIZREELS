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
  const isPopular = plan.plan_type === 'premium' || plan.plan_type === 'standard' || plan.title.toLowerCase().includes('pro');
  const addOnsCount = Array.isArray(plan.add_ons) ? plan.add_ons.filter((a) => a.is_active !== false).length : 0;

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative border ${
        isCurrent
          ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-[#d99a3d] ring-2 ring-[#d99a3d]/40 shadow-xl'
          : isPopular
          ? 'bg-white border-[#241b15] shadow-lg hover:shadow-2xl hover:-translate-y-1'
          : 'bg-white border-[#e3dccb] shadow-xs hover:border-[#241b15] hover:shadow-md'
      }`}
    >
      {/* Popular or Current Badge */}
      {isCurrent ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider">
          {bi('Current Active Plan', 'सक्रिय प्लान')}
        </div>
      ) : isPopular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#241b15] text-[#d99a3d] font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md tracking-wider">
          {bi('Most Popular', 'सर्वाधिक लोकप्रिय')}
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

        {/* Pricing */}
        <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e3dccb] space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight font-mono">
              ₹{Number(plan.price_inr || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-slate-500">
              /{plan.billing_cycle || 'month'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10.5px]">
            <span className="text-slate-500 font-medium">
              {plan.duration_days || 30} {bi('days validity', 'दिन की वैधता')}
            </span>
            {plan.discount_percentage > 0 && (
              <span className="font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[9.5px]">
                {plan.discount_percentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Usage Limits & Features */}
        <div className="space-y-2 pt-1 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            {bi('Plan Entitlements:', 'प्लान के अंतर्गत शामिल:')}
          </span>

          <div className="space-y-2 font-medium text-slate-700">
            {plan.reels_limit !== undefined && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>
                  {bi('Reels Uploads:', 'रील्स अपलोड:')}{' '}
                  <strong className="text-[#1a1a1a]">{plan.reels_limit ?? bi('Unlimited', 'असीमित')}</strong>
                </span>
              </div>
            )}

            {plan.leads_limit !== undefined && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>
                  {bi('Buyer Leads & Calls:', 'खरीदार लीड्स व कॉल्स:')}{' '}
                  <strong className="text-[#1a1a1a]">{plan.leads_limit ?? bi('Unlimited', 'असीमित')}</strong>
                </span>
              </div>
            )}

            {plan.product_limit !== undefined && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>
                  {bi('Catalog Listings:', 'कैटलॉग लिस्टिंग्स:')}{' '}
                  <strong className="text-[#1a1a1a]">{plan.product_limit ?? bi('Unlimited', 'असीमित')}</strong>
                </span>
              </div>
            )}

            {Number(plan.ai_credits || 0) > 0 && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>
                  {bi('AI Content Credits:', 'AI कंटेंट क्रेडिट्स:')}{' '}
                  <strong className="text-amber-700">{plan.ai_credits} / mo</strong>
                </span>
              </div>
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

            {plan.analytics_access && (
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-600 shrink-0" size={14} />
                <span>{bi('Advanced Analytics & Insights', 'उन्नत एनालिटिक्स व रिपोर्ट')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-5 mt-4 border-t border-[#f0ebe0]">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-black text-xs cursor-default flex items-center justify-center gap-1.5"
          >
            <FiCheck size={14} strokeWidth={3} />
            <span>{bi('Active Plan', 'सक्रिय प्लान')}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubscribing}
            onClick={() => onSelectPlan(plan)}
            className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md border ${
              isPopular
                ? 'bg-[#241b15] hover:bg-[#342820] text-[#d99a3d] border-[#241b15]'
                : 'bg-white hover:bg-[#241b15] hover:text-[#d99a3d] text-[#1a1a1a] border-[#241b15]'
            }`}
          >
            <FiZap size={14} />
            <span>{addOnsCount > 0 ? bi('Select Plan & Add-Ons', 'प्लान व ऐड-ऑन चुनें') : bi('Choose Plan', 'प्लान चुनें')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
