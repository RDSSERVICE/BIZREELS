import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiCalendar, FiCreditCard, FiZap, FiShield, FiStar, FiArrowUpRight } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * ActiveSubscriptionCard — Displays current active subscription details and benefits
 */
export default function ActiveSubscriptionCard({
  currentPlan,
  planExpires,
  roleParam,
  walletBalance,
  activeSubscription,
}) {
  const { bi } = useLanguage();
  const isPaidPlan = currentPlan && !currentPlan.toLowerCase().includes('free');
  const selectedAddons = activeSubscription?.selected_addons || [];
  const walletLink = roleParam === 'creator' ? '/creator/wallet' : '/vendor/subscription';

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#1c1510] via-[#241b15] to-[#2d221b] text-white border border-[#3e3025] shadow-xl p-6 sm:p-7 relative overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#d99a3d]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Active Membership Info */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {bi('Active Membership', 'सक्रिय सदस्यता')}
            </span>

            {isPaidPlan && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d99a3d]/20 text-[#d99a3d] border border-[#d99a3d]/30 text-[10px] font-black uppercase tracking-wider">
                <FiStar size={11} />
                {bi('Verified Merchant', 'सत्यापित विक्रेता')}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-heading">
              <span>{currentPlan || (roleParam === 'creator' ? 'Free Creator' : 'Free Member')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              {roleParam === 'creator'
                ? bi('Creator Studio Standard Tier · Public Portfolio & Reels Listing Active', 'क्रिएटर स्टूडियो मानक श्रेणी · सार्वजनिक पोर्टफोलियो और रील्स सक्रिय')
                : bi('Verified Merchant Tier · Catalog Listings & Direct Buyer Enquiries Active', 'सत्यापित मर्चेंट श्रेणी · कैटलॉग लिस्टिंग्स और प्रत्यक्ष खरीदार पूछताछ सक्रिय')}
            </p>
          </div>

          {/* Expiry Pill */}
          {planExpires && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
              <FiCalendar className="text-[#d99a3d]" size={13} />
              <span>{bi('Renews / Expires on:', 'नवीनीकरण / समाप्ति:')}</span>
              <strong className="text-white font-mono font-bold">
                {new Date(planExpires).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          )}
        </div>

        {/* Right: Wallet Balance & Quick Recharge Widget */}
        <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end gap-3 shrink-0">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 w-full sm:w-auto min-w-[240px] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {roleParam === 'creator' ? bi('Creator Wallet Balance', 'क्रिएटर वॉलेट शेष') : bi('Vendor Wallet Balance', 'विक्रेता वॉलेट शेष')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono flex items-center">
                <TbCurrencyRupee size={22} className="-mr-1 text-emerald-400" />
                <span>{Number(walletBalance || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Link
              to={walletLink}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#d99a3d] hover:bg-[#c4882e] text-[#1a1a1a] text-xs font-black transition shadow-sm shrink-0"
            >
              <span>{bi('Recharge', 'रिचार्ज')}</span>
              <FiArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Active Add-Ons Chips (if any) */}
      {selectedAddons.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <span className="text-[10.5px] font-black uppercase tracking-wider text-[#d99a3d] block">
            {bi('Active Subscription Add-Ons', 'सक्रिय ऐड-ऑन सुविधाएं')} ({selectedAddons.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedAddons.map((addon, idx) => (
              <span
                key={addon.id || idx}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5"
              >
                <FiZap size={12} className="text-[#d99a3d]" />
                <span>{addon.title}</span>
                <span className="text-white/70 font-mono text-[10px]">(+₹{addon.price_inr})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
