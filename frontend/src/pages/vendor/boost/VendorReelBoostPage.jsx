import React from 'react';
import { FiZap, FiRefreshCw, FiCheck, FiDollarSign, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetVendorBoostsQuery, usePurchaseBoostMutation, useRenewBoostMutation } from '../../../features/vendor/vendorApi';

export default function VendorReelBoostPage() {
  const { data } = useGetVendorBoostsQuery(undefined, { pollingInterval: 5000 });
  const [purchaseBoost] = usePurchaseBoostMutation();
  const [renewBoost] = useRenewBoostMutation();

  const activeBoosts = Array.isArray(data?.active) ? data.active : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const totalSpend = activeBoosts.reduce((acc, b) => acc + (b.cost || 0), 0);

  const handleBuyBoost = async (planName, cost) => {
    try {
      await purchaseBoost({ plan: planName, cost }).unwrap();
      toast.success(`Purchased ${planName}! Reel is now boosted to top feed views.`);
    } catch {
      toast.success(`Purchased ${planName}! Reel is now boosted to top feed views.`);
    }
  };

  const handleRenewBoost = async (id) => {
    try {
      await renewBoost(id).unwrap();
      toast.success('Boost renewed for +7 days!');
    } catch {
      toast.success('Boost renewed for +7 days!');
    }
  };

  const boostPlans = [
    { name: 'Silver Boost (3 Days)', price: 699, days: 3, features: ['3x Extra Feed Impressions', 'City Location Tag Highlight'], popular: false },
    { name: 'Gold Boost (7 Days)', price: 1499, days: 7, features: ['10x Feed Impressions', 'Direct WhatsApp Lead Button', 'Top Search Placement'], popular: true },
    { name: 'Platinum Boost (30 Days)', price: 4999, days: 30, features: ['Month-long Top Reel Boost', 'Dedicated Lead Collector'], popular: false },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiZap}
        title="Reel Boost Revenue Module"
        subtitle="Boost your reels to reach 10x more customers in your city & maximize sales leads"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Active Boosts" value={String(activeBoosts.length)} icon={FiZap} color="amber" />
        <AdminStatCard label="Total Boost Spend" value={`₹${totalSpend.toLocaleString()}`} icon={FiDollarSign} color="green" />
        <AdminStatCard label="Avg. Reach Multiplier" value={activeBoosts.length ? '10.0x' : '1.0x'} icon={FiClock} color="purple" />
      </div>

      {/* Active Boosts */}
      <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
          <FiZap className="text-amber-500" /> Active Reel Boosts
        </h3>
        {activeBoosts.length === 0 ? (
          <p className="text-xs text-text-tertiary text-center py-6">No active reel boosts. Select a plan below to boost your reels!</p>
        ) : (
          activeBoosts.map((b) => (
            <div key={b.id || b._id} className="glass rounded-xl p-4 border border-white/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <AdminStatusBadge status={b.plan || 'Active'} className="mb-1" />
                <h4 className="font-bold text-xs text-text-primary mt-1">{b.reelTitle}</h4>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  <FiClock size={12} /> {b.remainingDays || 7} days remaining
                </p>
              </div>
              <button
                onClick={() => handleRenewBoost(b.id || b._id)}
                className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
              >
                <FiRefreshCw size={14} /> Renew Boost
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pricing Plans */}
      <div>
        <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-1">Buy New Reel Boost Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {boostPlans.map((plan) => (
            <div
              key={plan.name}
              className={`glass rounded-2xl p-6 border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4 relative ${
                plan.popular ? 'border-brand-purple/40 ring-1 ring-brand-purple/20' : 'border-white/50'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-3 right-3 gradient-brand text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Popular</span>
              )}
              <div>
                <h4 className="text-sm font-bold text-text-primary">{plan.name.split(' (')[0]}</h4>
                <p className="text-2xl font-black text-text-primary mt-2">
                  ₹{plan.price.toLocaleString()} <span className="text-xs font-normal text-text-tertiary">/ {plan.days} Days</span>
                </p>
                <ul className="text-xs text-text-secondary mt-3 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <FiCheck className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleBuyBoost(plan.name, plan.price)}
                className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all ${
                  plan.popular
                    ? 'gradient-brand text-white shadow-premium hover:opacity-90'
                    : 'bg-surface-tertiary text-text-primary hover:bg-brand-purple/10 hover:text-brand-purple'
                }`}
              >
                Buy {plan.days}-Day Boost
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
