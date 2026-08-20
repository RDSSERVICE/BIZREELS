import React, { useState } from 'react';
import {
  FiPercent, FiEdit2, FiTrash2, FiCopy, FiPlay, FiPause,
  FiEye, FiShoppingCart, FiCalendar, FiUsers, FiFilter, FiTag
} from 'react-icons/fi';
import { OFFER_CATEGORIES, CATEGORY_GROUPS } from '../../../constants/offerCategories';

/**
 * OffersTab — Displays all vendor-created dynamic offers supporting 19 categories
 * Filterable by category groups.
 */
export default function OffersTab({
  offers = [],
  loading = false,
  onCreateOffer,
  onEditOffer,
  onActivateOffer,
  onDisableOffer,
  onDeleteOffer,
  onDuplicateOffer,
}) {
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(d).slice(0, 16);
    }
  };

  const getOfferStatus = (offer) => {
    if (offer.status) return offer.status.toLowerCase();
    if (offer.is_active === false) return 'disabled';
    const now = new Date();
    const end = offer.endTime || offer.validTill;
    if (end && new Date(end) < now) return 'expired';
    return 'active';
  };

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    expired: 'bg-red-500/10 text-red-500 border-red-500/20',
    disabled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const getCategoryBadge = (offer) => {
    const catKey = offer.category || 'discount';
    const cat = OFFER_CATEGORIES[catKey] || { label: catKey, icon: '🏷️' };
    return cat;
  };

  const getOfferHighlight = (offer) => {
    const config = offer.config || {};
    const catKey = offer.category || 'discount';

    switch (catKey) {
      case 'discount':
        if (config.discountType === 'fixed') return `₹${config.discountValue || offer.discountValue || 0} FLAT OFF`;
        return `${config.discountValue || offer.discountValue || offer.discountPct || 0}% OFF`;
      case 'buy_x_get_y':
        return `BUY ${config.buyQuantity || 1} GET ${config.getQuantity || 1}`;
      case 'free_product':
        return `FREE PRODUCT GIFT`;
      case 'combo':
        return `COMBO ₹${config.comboPrice || 0}`;
      case 'coupon':
        return `COUPON: ${config.couponCode || offer.code || 'PROMO'}`;
      case 'first_order':
        return `FIRST ORDER ${config.discountValue || 0}% OFF`;
      case 'repeat_customer':
        return `LOYALTY REWARD`;
      case 'flash_sale':
        return `⚡ FLASH SALE ${config.discountValue || 0}% OFF`;
      case 'festival_seasonal':
        return `🎊 ${config.festivalName || 'FESTIVAL SPECIAL'}`;
      case 'free_delivery':
        return `FREE DELIVERY`;
      case 'referral':
        return `REFER & EARN ₹${config.referrerBenefitValue || 0}`;
      case 'minimum_order':
        return `MIN ORDER ₹${config.minOrderValue || 0}`;
      default:
        if (offer.discountValue || offer.discountPct) {
          return `${offer.discountValue || offer.discountPct}% OFF`;
        }
        return 'SPECIAL DEAL';
    }
  };

  const filteredOffers = offers.filter(o => {
    if (selectedGroup === 'ALL') return true;
    const cat = OFFER_CATEGORIES[o.category];
    return cat?.group === selectedGroup;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs">
        <div className="min-w-0">
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wider">
            Vendor Promotions & Offer Engine
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold">
            19 promotional offer categories with automatic search boost & customer triggers
          </p>
        </div>
        <button
          onClick={onCreateOffer}
          className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-2xs transition flex-shrink-0 cursor-pointer border-none"
        >
          + Create Offer
        </button>
      </div>

      {/* Category Group Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedGroup('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
            selectedGroup === 'ALL'
              ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
              : 'bg-white text-slate-600 border-[#e3dccb] hover:border-slate-400'
          }`}
        >
          All Offers ({offers.length})
        </button>
        {CATEGORY_GROUPS.map(g => {
          const count = offers.filter(o => OFFER_CATEGORIES[o.category]?.group === g.key).length;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelectedGroup(g.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
                selectedGroup === g.key
                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                  : 'bg-white text-slate-600 border-[#e3dccb] hover:border-slate-400'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.label}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-[#e3dccb] animate-pulse space-y-3">
              <div className="h-5 bg-slate-100 rounded w-16" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl text-center border border-[#e3dccb] shadow-2xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#f8f4ec] flex items-center justify-center mx-auto border border-[#e3dccb]">
            <FiPercent className="w-8 h-8 text-[#d99a3d]" />
          </div>
          <h4 className="text-sm font-black text-[#1a1a1a]">
            {selectedGroup === 'ALL' ? 'No offers created yet' : `No ${selectedGroup} offers`}
          </h4>
          <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">
            Create an offer to reward customers, boost your visibility, and drive more sales.
          </p>
          <button
            onClick={onCreateOffer}
            className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-2xs mt-2 cursor-pointer border-none"
          >
            + Create Offer
          </button>
        </div>
      ) : (
        /* Offers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer, i) => {
            const offerId = offer._id || offer.id || i;
            const status = getOfferStatus(offer);
            const catBadge = getCategoryBadge(offer);
            const highlightText = getOfferHighlight(offer);

            return (
              <div
                key={offerId}
                className="bg-white p-5 rounded-2xl border border-[#e3dccb] shadow-2xs relative overflow-hidden space-y-3 hover:shadow-card-hover transition-all"
              >
                {/* Header: Highlight & Category & Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 bg-[#241b15] text-[#d99a3d] rounded-lg text-xs font-black">
                      {highlightText}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] flex items-center gap-1">
                      <span>{catBadge.icon}</span> {catBadge.label}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${statusColors[status] || statusColors.active}`}>
                    {status}
                  </span>
                </div>

                {/* Title & Code */}
                <div>
                  <h4 className="font-black text-sm text-[#1a1a1a]">{offer.title}</h4>
                  {offer.offerName && (
                    <span className="text-[10px] text-brand-purple font-bold block">
                      {offer.offerName}
                    </span>
                  )}
                  {(offer.couponCode || offer.code) && (
                    <span className="text-[10px] font-mono text-slate-500 font-bold block mt-0.5">
                      CODE: <strong className="text-[#d99a3d]">{offer.couponCode || offer.code}</strong>
                    </span>
                  )}
                </div>

                {/* Description */}
                {offer.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{offer.description}</p>
                )}

                {/* Stats Row */}
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <FiEye className="w-3 h-3 text-slate-400" />
                    {offer.analytics?.viewsCount || offer.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-3 h-3 text-slate-400" />
                    {offer.usedCount || offer.usageCount || 0} used
                  </span>
                  <span className="flex items-center gap-1">
                    <FiShoppingCart className="w-3 h-3 text-slate-400" />
                    ₹{offer.analytics?.totalSales || offer.totalSales || 0} sales
                  </span>
                </div>

                {/* Dates */}
                <div className="text-[10px] text-slate-500 font-bold border-t border-[#e3dccb] pt-2 flex justify-between">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3 text-slate-400" />
                    {formatDate(offer.startTime || offer.created_at)}
                  </span>
                  <span>→ {formatDate(offer.endTime || offer.validTill)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-[#e3dccb]">
                  <button
                    onClick={() => onEditOffer(offer)}
                    className="p-1.5 rounded-lg hover:bg-[#241b15] text-slate-500 hover:text-[#d99a3d] transition cursor-pointer border-none"
                    title="Edit"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  {status === 'active' ? (
                    <button
                      onClick={() => onDisableOffer(offer)}
                      className="p-1.5 rounded-lg hover:bg-[#241b15] text-slate-500 hover:text-[#d99a3d] transition cursor-pointer border-none"
                      title="Disable"
                    >
                      <FiPause className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivateOffer(offer)}
                      className="p-1.5 rounded-lg hover:bg-[#241b15] text-slate-500 hover:text-[#d99a3d] transition cursor-pointer border-none"
                      title="Activate"
                    >
                      <FiPlay className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateOffer(offer)}
                    className="p-1.5 rounded-lg hover:bg-[#241b15] text-slate-500 hover:text-[#d99a3d] transition cursor-pointer border-none"
                    title="Duplicate"
                  >
                    <FiCopy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteOffer(offer)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer border-none"
                    title="Delete"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
