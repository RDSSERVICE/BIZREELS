import React from 'react';
import { FiCheckCircle, FiCalendar, FiCreditCard, FiZap, FiShield, FiStar } from 'react-icons/fi';

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
  const isPaidPlan = currentPlan && !currentPlan.toLowerCase().includes('free');
  const selectedAddons = activeSubscription?.selected_addons || [];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#241b15] via-[#2f231b] to-[#1a1410] text-white border border-[#e3dccb]/20 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#d99a3d]">
              Active Membership
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>{currentPlan}</span>
            {isPaidPlan && (
              <span className="p-1 rounded-full bg-[#d99a3d] text-[#1a1a1a]" title="Verified Membership">
                <FiStar size={14} />
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-300">
            {roleParam === 'creator' ? 'Creator Creator Pro Tier' : 'Verified Business Merchant Tier'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {planExpires && (
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
              <FiCalendar className="text-[#d99a3d]" size={15} />
              <div className="text-left">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Renews / Expires</span>
                <span className="text-xs font-black text-white font-mono">
                  {new Date(planExpires).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          {roleParam !== 'customer' && roleParam !== 'user' && (
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
              <FiCreditCard className="text-emerald-400" size={15} />
              <div className="text-left">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                  {roleParam === 'creator' ? 'Creator Wallet' : 'Vendor Wallet'}
                </span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  ₹{Number(walletBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Add-Ons Chips */}
      {selectedAddons.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#d99a3d] block">
            Active Subscription Add-Ons ({selectedAddons.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedAddons.map((addon, idx) => (
              <span
                key={addon.id || idx}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5"
              >
                <FiZap size={11} className="text-[#d99a3d]" />
                <span>{addon.title}</span>
                <span className="text-white/70 font-mono text-[9.5px]">(+₹{addon.price_inr})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
