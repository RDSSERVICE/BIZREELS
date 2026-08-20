import React from 'react';
import { FiUsers, FiAward, FiGift, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useGetReferralOfferStatsQuery } from '../../../../features/vendor/vendorApi';

/**
 * ReferralOfferStatsCard — Card component displaying vendor-scoped referral offer metrics.
 * Shows active referral offer status, conversion rate, and coupon disbursements.
 */
export default function ReferralOfferStatsCard({ onCreateReferralOffer }) {
  const { data, isLoading } = useGetReferralOfferStatsQuery(undefined, {
    pollingInterval: 30000,
  });

  const payload = data?.data;
  const hasActiveOffer = payload?.hasActiveOffer;
  const offer = payload?.offer;
  const stats = payload?.stats;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] animate-pulse space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-10 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!hasActiveOffer) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase">
            <FiAward className="w-4 h-4 text-amber-600" />
            <span>Launch a Store Referral Offer</span>
          </div>
          <p className="text-[11px] text-amber-800 font-bold mt-0.5">
            Reward your existing customers when they bring their friends to your store.
          </p>
        </div>
        {onCreateReferralOffer && (
          <button
            type="button"
            onClick={onCreateReferralOffer}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1 cursor-pointer border-none"
          >
            <span>Set Up Offer</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const config = offer?.config || {};

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
            Active Referral Campaign
          </span>
          <h4 className="text-xs sm:text-sm font-black text-[#1a1a1a]">
            {offer?.title || 'Customer Referral Promotion'}
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
          <FiCheckCircle className="w-2.5 h-2.5" /> Active
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#e3dccb]">
        <div className="p-2 bg-[#f8f4ec] rounded-xl text-center">
          <div className="text-base font-black text-[#1a1a1a]">{stats?.totalReferrals || 0}</div>
          <div className="text-[9px] text-slate-500 font-bold uppercase">Attributed</div>
        </div>
        <div className="p-2 bg-[#f8f4ec] rounded-xl text-center">
          <div className="text-base font-black text-emerald-700">{stats?.convertedReferrals || 0}</div>
          <div className="text-[9px] text-slate-500 font-bold uppercase">Converted</div>
        </div>
        <div className="p-2 bg-[#f8f4ec] rounded-xl text-center">
          <div className="text-base font-black text-brand-purple">{stats?.conversionRate || 0}%</div>
          <div className="text-[9px] text-slate-500 font-bold uppercase">Rate</div>
        </div>
      </div>

      <div className="text-[10px] text-slate-600 font-bold flex justify-between items-center pt-1 border-t border-[#e3dccb]">
        <span>
          Referrer: <strong>₹{config.referrerBenefitValue || 0} {config.referrerBenefitType || 'coupon'}</strong>
        </span>
        <span>
          New Customer: <strong>₹{config.newCustomerBenefitValue || 0} {config.newCustomerBenefitType || 'coupon'}</strong>
        </span>
      </div>
    </div>
  );
}
