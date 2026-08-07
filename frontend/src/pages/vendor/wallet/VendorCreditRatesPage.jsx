import React, { useEffect } from 'react';
import { FiZap, FiDollarSign, FiTrendingUp, FiPackage, FiVideo, FiImage, FiCpu, FiInbox } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { useGetVendorDashboardQuery } from '../../../features/vendor/vendorApi';
import { tokenStore } from '../../../lib/api';

export default function VendorCreditRatesPage() {
  const { data: profileRes } = useGetMeQuery(undefined, {
    skip: !tokenStore.getUser(),
  });
  const { data: dashboardRes, isLoading } = useGetVendorDashboardQuery(undefined, {
    pollingInterval: 300000,
  });

  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const credits = metrics.credits || { available: 0, deposited: 0, earned: 0, used: 0 };
  const creditRates = metrics.creditRates || {
    productListing: 1,
    reelPost: 1,
    aiImage: 2,
    aiVideo30s: 15,
    reelBoost1Day: 10,
    validLead: 1,
  };

  const rateConfig = [
    { key: 'productListing', label: '1 Product Listing', value: creditRates.productListing, icon: FiPackage, color: 'purple', unit: 'Product Credit', desc: 'Deducted when uploading a product to active listings.' },
    { key: 'reelPost', label: '1 Reel Post', value: creditRates.reelPost, icon: FiVideo, color: 'violet', unit: 'Reel Credit', desc: 'Consumed when publishing a new promotional business reel.' },
    { key: 'aiImage', label: '1 AI Image', value: creditRates.aiImage, icon: FiImage, color: 'emerald', unit: 'AI Credits', desc: 'Used for creating high-fidelity product images in AI Studio.' },
    { key: 'aiVideo30s', label: '30 sec AI Video', value: creditRates.aiVideo30s, icon: FiCpu, color: 'blue', unit: 'AI Credits', desc: 'Charged for rendering dynamic AI product video advertisements.' },
    { key: 'reelBoost1Day', label: '1 Reel Boost (1 Day)', value: creditRates.reelBoost1Day, icon: FiZap, color: 'amber', unit: 'Boost Credits', desc: 'Credits per day to promote a reel in feed and local searches.' },
    { key: 'validLead', label: '1 Valid Lead', value: creditRates.validLead, icon: FiInbox, color: 'rose', unit: 'Lead Credit', desc: 'Charged to unlock contact details for customer search requirements.' },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiZap}
        title="Credit Rates & Wallet Overview"
        subtitle="Manage your platform credit wallet and inspect the active consumption rates determined by the platform"
      />

      {/* Credit Wallet Stat Cards */}
      <div className="glass rounded-3xl p-6 border border-white/50 shadow-card bg-gradient-to-r from-brand-purple/10 via-surface to-brand-pink/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiDollarSign className="text-brand-purple" /> Credit Balance Breakdown
          </h3>
          <Link to="/vendor/wallet" className="px-4 py-2 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple text-xs font-bold rounded-xl transition">
            Manage Wallet & Topup →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider block">AVAILABLE</span>
            <span className="text-2xl font-black text-emerald-500">{credits.available}</span>
            <span className="text-[10px] text-text-secondary block font-medium mt-0.5">Credits (₹{credits.available})</span>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider block">DEPOSITED</span>
            <span className="text-2xl font-black text-blue-400">{credits.deposited}</span>
            <span className="text-[10px] text-text-secondary block font-medium mt-0.5">Credits (₹{credits.deposited})</span>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider block">EARNED</span>
            <span className="text-2xl font-black text-brand-purple">{credits.earned}</span>
            <span className="text-[10px] text-text-secondary block font-medium mt-0.5">Credits (₹{credits.earned})</span>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider block">USED HISTORY</span>
            <span className="text-2xl font-black text-amber-500">{credits.used}</span>
            <span className="text-[10px] text-text-secondary block font-medium mt-0.5">Credits Spent</span>
          </div>
        </div>
      </div>

      {/* Credit Rates Grid */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-white/50 shadow-glass space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <FiZap className="text-amber-500 animate-pulse" /> Active Credit Consumption Rates
          </h3>
          <span className="text-[10px] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Live Rates
          </span>
        </div>

        {isLoading ? (
          <div className="text-center text-xs text-text-tertiary py-8">
            Loading rates from settings server...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rateConfig.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="glass p-5 rounded-2xl border border-white/20 flex gap-4 items-start hover:border-white/40 transition-all">
                  <div className={`p-3 rounded-xl bg-${item.color}-500/10 text-${item.color}-500 shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text-primary">{item.label}</span>
                      <strong className="text-xs font-black text-brand-purple shrink-0">
                        {item.value} {item.unit}
                      </strong>
                    </div>
                    <p className="text-[10px] text-text-tertiary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-3 items-start">
          <FiTrendingUp className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-bold text-amber-800">Dynamic Pricing Warning</h4>
            <p className="text-[10px] text-text-secondary leading-relaxed">
              These consumption rates are dynamic and configured directly by the admin console. Whenever you perform an action, the cost corresponding to these live rates will be deducted from your credit wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
