import React from 'react';
import { FiGift, FiPlayCircle, FiClock, FiCheckCircle, FiDollarSign, FiArrowUpRight, FiZap } from 'react-icons/fi';
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] h-24 animate-pulse shadow-2xs" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Campaigns',
      val: totalOffers,
      sub: `${platformOffersCount} Platform · ${vendorOffersCount} Vendor`,
      icon: FiGift,
      iconColor: 'text-[#d99a3d]'
    },
    {
      label: 'Live Now',
      val: activeOffers,
      badge: 'Active & Broadcasting',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: FiPlayCircle,
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Scheduled Queue',
      val: scheduledOffers,
      sub: `${draftOffers} Drafts · ${expiredOffers} Expired`,
      icon: FiClock,
      iconColor: 'text-blue-600'
    },
    {
      label: 'Redemptions (CTR)',
      val: totalRedemptions.toLocaleString('en-IN'),
      badge: `${ctrPercentage}% CTR · ${totalClicks} Clicks`,
      badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      icon: FiCheckCircle,
      iconColor: 'text-indigo-600'
    },
    {
      label: 'Gross Savings Disbursed',
      val: formatCurrency(totalDiscountDisbursed),
      badge: `${conversionRate}% Conv. Rate`,
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
      icon: FiDollarSign,
      iconColor: 'text-[#d99a3d]'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs hover:shadow-xs flex items-center justify-between transition-all"
          >
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-widest block truncate">
                {card.label}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#1a1a1a] mt-1 block truncate tracking-tight">
                {card.val}
              </span>
              {card.badge ? (
                <span
                  className={`text-[10px] border px-1.5 py-0.5 rounded-md font-extrabold inline-flex items-center gap-0.5 mt-1.5 truncate ${card.badgeClass}`}
                >
                  <FiZap className="w-3 h-3 shrink-0" />
                  {card.badge}
                </span>
              ) : (
                <span className="text-[10px] text-[#8c827a] mt-1 block font-medium truncate">
                  {card.sub}
                </span>
              )}
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] flex items-center justify-center shrink-0 shadow-2xs">
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
