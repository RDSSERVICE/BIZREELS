import React from 'react';
import { FiGift, FiPlayCircle, FiClock, FiCheckCircle, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency } from './offerUtils';

export default function OfferKpiBanner({ stats = {}, isLoading = false }) {
  const {
    totalOffers = 0,
    activeOffers = 0,
    scheduledOffers = 0,
    draftOffers = 0,
    expiredOffers = 0,
    disabledOffers = 0,
    vendorOffersCount = 0,
    totalRedemptions = 0,
    totalDiscountDisbursed = 0,
    totalViews = 0,
    totalClicks = 0,
    ctrPercentage = 0,
    conversionRate = 0
  } = stats;

  const platformOffersCount = Math.max(0, totalOffers - vendorOffersCount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Campaigns */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Campaigns
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FiGift className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : totalOffers}
          </span>
          <span className="text-xs text-slate-400 font-medium">campaigns</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Platform: <strong className="text-slate-700 dark:text-slate-200">{platformOffersCount}</strong></span>
          <span>Vendor: <strong className="text-amber-600 dark:text-amber-400">{vendorOffersCount}</strong></span>
        </div>
      </div>

      {/* 2. Active & Live */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-emerald-200/70 dark:border-emerald-800/40 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Live Now
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FiPlayCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : activeOffers}
          </span>
          <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-medium">active discounts</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-emerald-100/80 dark:border-emerald-900/30 flex items-center justify-between text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
          <span>Targeting users</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Broadcasting</span>
        </div>
      </div>

      {/* 3. Scheduled Queue */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Scheduled Queue
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FiClock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : scheduledOffers}
          </span>
          <span className="text-xs text-slate-400 font-medium">upcoming</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Drafts: <strong className="text-slate-700 dark:text-slate-200">{draftOffers}</strong></span>
          <span>Expired: <strong className="text-slate-400">{expiredOffers}</strong></span>
        </div>
      </div>

      {/* 4. Total Redemptions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Redemptions
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FiCheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {isLoading ? '...' : totalRedemptions.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400 font-medium">used</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>CTR: <strong className="text-indigo-600 dark:text-indigo-400">{ctrPercentage}%</strong></span>
          <span>Clicks: <strong className="text-slate-700 dark:text-slate-200">{totalClicks}</strong></span>
        </div>
      </div>

      {/* 5. Gross Savings Disbursed */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Gross Savings
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FiDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {isLoading ? '...' : formatCurrency(totalDiscountDisbursed)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Conv. Rate: <strong className="text-purple-600 dark:text-purple-400">{conversionRate}%</strong></span>
          <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <FiTrendingUp className="w-3 h-3" /> ROI Pos.
          </span>
        </div>
      </div>
    </div>
  );
}
