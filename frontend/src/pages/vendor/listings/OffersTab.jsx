import React from 'react';
import {
  FiPercent, FiEdit2, FiTrash2, FiCopy, FiPlay, FiPause,
  FiEye, FiShoppingCart, FiCalendar, FiUsers
} from 'react-icons/fi';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';

/**
 * OffersTab — Displays all vendor-created dynamic offers
 * Each card shows: Name, Discount, Dates, Status, Usage, Views
 * Actions: Edit, Activate, Disable, Delete, Duplicate
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

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return String(d).slice(0, 16); }
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-surface p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary">Active Customer Offers & Deals</h3>
          <p className="text-[10px] sm:text-xs text-text-tertiary">Real-time dynamic discounts for buyer search results</p>
        </div>
        <button onClick={onCreateOffer} className="px-3 sm:px-3.5 py-2 gradient-brand text-white text-[11px] sm:text-xs font-bold rounded-xl flex-shrink-0">
          + Create Offer
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-border animate-pulse space-y-3">
              <div className="h-5 skeleton rounded w-16" />
              <div className="h-4 skeleton rounded w-3/4" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        /* Empty State */
        <div className="glass p-12 rounded-2xl text-center border border-border space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <FiPercent className="w-8 h-8 text-amber-500/50" />
          </div>
          <h4 className="text-sm font-bold text-text-primary">No offers created yet</h4>
          <p className="text-xs text-text-tertiary max-w-xs mx-auto">
            Create your first dynamic offer to attract more customers with discounts and deals.
          </p>
          <button onClick={onCreateOffer} className="px-4 py-2 gradient-brand text-white text-xs font-bold rounded-xl mt-2">
            + Create First Offer
          </button>
        </div>
      ) : (
        /* Offers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer, i) => {
            const offerId = offer._id || offer.id || i;
            const status = getOfferStatus(offer);
            const discountText = offer.discountType === 'fixed'
              ? `₹${offer.discountValue || offer.discountPct} OFF`
              : `${offer.discountValue || offer.discountPct}% OFF`;

            return (
              <div key={offerId} className="glass p-5 rounded-2xl border border-amber-500/20 relative overflow-hidden space-y-3 hover:shadow-card-hover transition-all">
                {/* Discount Badge & Status */}
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-black">
                    {discountText}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${statusColors[status] || statusColors.active}`}>
                    {status}
                  </span>
                </div>

                {/* Title & Code */}
                <div>
                  <h4 className="font-bold text-sm text-text-primary">{offer.title}</h4>
                  {(offer.couponCode || offer.code) && (
                    <span className="text-[10px] font-mono text-text-tertiary">
                      CODE: <strong className="text-brand-purple">{offer.couponCode || offer.code}</strong>
                    </span>
                  )}
                </div>

                {/* Description */}
                {offer.description && (
                  <p className="text-xs text-text-tertiary line-clamp-2">{offer.description}</p>
                )}

                {/* Stats Row */}
                <div className="flex flex-wrap gap-3 text-[10px] text-text-tertiary">
                  <span className="flex items-center gap-1"><FiEye className="w-3 h-3" /> {offer.analytics?.viewsCount || offer.views || 0} views</span>
                  <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" /> {offer.usedCount || offer.usageCount || 0} used</span>
                  <span className="flex items-center gap-1"><FiShoppingCart className="w-3 h-3" /> ₹{offer.totalSales || 0} sales</span>
                </div>

                {/* Dates */}
                <div className="text-[10px] text-text-tertiary border-t border-border pt-2 flex justify-between">
                  <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" /> {formatDate(offer.startTime || offer.created_at)}</span>
                  <span>→ {formatDate(offer.endTime || offer.validTill)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  <button onClick={() => onEditOffer(offer)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                  {status === 'active' ? (
                    <button onClick={() => onDisableOffer(offer)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition" title="Disable"><FiPause className="w-3.5 h-3.5" /></button>
                  ) : (
                    <button onClick={() => onActivateOffer(offer)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition" title="Activate"><FiPlay className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => onDuplicateOffer(offer)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Duplicate"><FiCopy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDeleteOffer(offer)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition ml-auto" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
