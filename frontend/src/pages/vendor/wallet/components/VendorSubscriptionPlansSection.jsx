import React from 'react';
import { FiZap, FiCheck, FiStar, FiArrowRight } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';
import { useGetSubscriptionPlansQuery } from '../../../../features/vendor/vendorApi';

// Fallback plans strictly matching BizReels Requirements Document (Section 2)
const DEFAULT_PLANS = [
  {
    id: '6aa5537c564952f956e9c0ba',
    title: 'Starter',
    price_inr: 499,
    wallet_credits: 599,
    free_reel_boosts: 1,
    badge_text: 'Best for Beginners',
    description: 'Essential platform credits for local vendors getting started',
    features_list: [
      '599 Platform Usage Credits',
      '1 Free Reel Boost included',
      'Never Expiring credits',
      'Draws down on views, calls & WhatsApp',
      'Recharge anytime when used',
    ],
  },
  {
    id: '6aa5537c564952f956e9c0bb',
    title: 'Growth',
    price_inr: 1199,
    wallet_credits: 1599,
    free_reel_boosts: 3,
    badge_text: 'Most Popular',
    is_popular: true,
    description: 'High-yield credits for growing vendors with active listings',
    features_list: [
      '1,599 Platform Usage Credits (+33% bonus)',
      '3 Free Reel Boosts included',
      'Never Expiring credits',
      'Verified Merchant Badge',
      'Priority Lead Routing',
    ],
  },
  {
    id: '6aa5537c564952f956e9c0bc',
    title: 'Business',
    price_inr: 2199,
    wallet_credits: 2999,
    free_reel_boosts: 5,
    badge_text: 'Best Value',
    description: 'Maximum credit volume for multi-product retail & service leaders',
    features_list: [
      '2,999 Platform Usage Credits (+36% bonus)',
      '5 Free Reel Boosts included',
      'Never Expiring credits',
      'Verified Gold Badge',
      'Dedicated Account Support',
    ],
  },
];

/**
 * VendorSubscriptionPlansSection
 * Displays the 3 official Vendor Subscription Plans (Starter, Growth, Business)
 * from the BizReels Requirements Document.
 * Vendors purchase/recharge a plan to receive non-expiring usage credits.
 */
export default function VendorSubscriptionPlansSection({ onSelectPlan }) {
  const { bi } = useLanguage();
  const { data: plansData, isLoading } = useGetSubscriptionPlansQuery({ role: 'vendor' });

  const rawItems = plansData?.data?.items || plansData?.items || [];
  const activeVendorPlans = rawItems.filter(
    (p) =>
      p.is_active !== false &&
      !p.is_archived &&
      (p.user_type === 'vendor' || p.target_role === 'vendor' || !p.target_role) &&
      p.price_inr > 0
  );

  const displayPlans = activeVendorPlans.length > 0 ? activeVendorPlans : DEFAULT_PLANS;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-2xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3dccb] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#d99a3d]/15 text-[#d99a3d]">
              <FiZap size={18} className="fill-[#d99a3d]" />
            </span>
            <h3
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-base sm:text-lg uppercase text-[#1a1a1a] tracking-wide"
            >
              {bi('VENDOR SUBSCRIPTION PLANS & CREDITS', 'विक्रेता सदस्यता योजनाएं और क्रेडिट्स')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {bi(
              'Select a non-expiring plan to add platform usage credits and free reel boosts. Recharging accumulates credits on top of your existing balance.',
              'उपयोग क्रेडिट और निःशुल्क रील बूस्ट जोड़ने के लिए योजना चुनें। रीचार्ज करने पर क्रेडिट आपके मौजूदा बैलेंस में जमा होते रहते हैं।'
            )}
          </p>
        </div>

        <span className="self-start sm:self-auto text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          ✓ {bi('Pay & Recharge · No Auto-Debit', 'भुगतान और रीचार्ज · कोई स्वतः कटौती नहीं')}
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {displayPlans.map((plan) => {
          const isGrowth =
            plan.is_popular ||
            String(plan.title).toLowerCase().includes('growth') ||
            plan.price_inr === 1199;
          const isBusiness =
            String(plan.title).toLowerCase().includes('business') || plan.price_inr === 2199;

          const credits = Number(plan.wallet_credits || 0);
          const freeBoosts = Number(plan.free_reel_boosts || 0);
          const badgeLabel =
            plan.badge_text || (isGrowth ? 'Most Popular' : isBusiness ? 'Best Value' : 'Starter');

          return (
            <div
              key={plan.id || plan._id}
              className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 border-2 ${
                isGrowth
                  ? 'bg-[#fcfaf6] border-[#241b15] shadow-md ring-1 ring-[#241b15]'
                  : 'bg-white border-[#e3dccb] hover:border-[#241b15] shadow-2xs'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                    isGrowth
                      ? 'bg-[#241b15] text-[#d99a3d]'
                      : 'bg-[#f0ebe1] text-[#382b22]'
                  }`}
                >
                  {isGrowth && <FiStar size={11} className="fill-[#d99a3d]" />}
                  <span>{badgeLabel}</span>
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  {bi('Non-Expiring', 'कभी समाप्त नहीं')}
                </span>
              </div>

              {/* Title & Price */}
              <div className="space-y-2">
                <h4
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                  className="text-lg sm:text-xl text-[#1a1a1a] tracking-tight"
                >
                  {plan.title}
                </h4>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-[#1a1a1a] font-mono">
                    ₹{Number(plan.price_inr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">/ {bi('one-time', 'एकमुश्त')}</span>
                </div>

                {/* Credit Yield Box */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 my-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <FiZap size={14} className="fill-amber-500 text-amber-600" />
                      {bi('Wallet Credits:', 'वॉलेट क्रेडिट्स:')}
                    </span>
                    <span className="text-sm font-black text-amber-950 font-mono">
                      +{credits.toLocaleString('en-IN')} Credits
                    </span>
                  </div>

                  {freeBoosts > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                      <span className="font-semibold text-emerald-800">
                        {bi('Free Reel Boosts:', 'मुफ़्त रील बूस्ट्स:')}
                      </span>
                      <span className="font-black text-emerald-700 font-mono">
                        +{freeBoosts} {freeBoosts === 1 ? 'Boost' : 'Boosts'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Feature Bullet Points */}
                <ul className="space-y-2 text-xs text-slate-600 pt-1 pb-4">
                  <li className="flex items-start gap-2">
                    <FiCheck className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span className="font-medium">
                      <strong>+{credits.toLocaleString('en-IN')}</strong> usage credits added to your common wallet
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span className="font-medium">
                      <strong>+{freeBoosts} Free Reel {freeBoosts === 1 ? 'Boost' : 'Boosts'}</strong> (0 credits cost)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span className="font-medium">
                      No expiry — credits remain valid indefinitely until used
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <span className="font-medium">
                      Automatic draw-down for customer calls, WhatsApp & reel views
                    </span>
                  </li>
                </ul>
              </div>

              {/* Purchase CTA */}
              <button
                type="button"
                onClick={() => onSelectPlan(plan)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                  isGrowth
                    ? 'bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] hover:text-[#e8b566]'
                    : 'bg-[#241b15] text-white hover:bg-[#382b22]'
                }`}
              >
                <span>{bi(`Subscribe & Get ${credits.toLocaleString('en-IN')} Credits`, `सदस्यता लें और ${credits.toLocaleString('en-IN')} क्रेडिट्स पाएं`)}</span>
                <FiArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
