import React from 'react';
import {
  FiCopy,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPlay,
  FiPause,
  FiCheck,
  FiClock,
  FiGift,
  FiShoppingBag,
  FiTag,
  FiUsers,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { formatDate, formatDuration } from './offerUtils';

export default function OfferTable({
  offers = [],
  isLoading = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onOpenAnalytics,
  onEditOffer,
  onDuplicateOffer,
  onToggleStatus,
  onDeleteOffer,
  pagination = {},
  onPageChange
}) {
  const [copiedCode, setCopiedCode] = React.useState(null);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const allSelected = offers.length > 0 && selectedIds.length === offers.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < offers.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 min-w-[240px]">Campaign / Origin</th>
              <th className="py-3.5 px-4 min-w-[140px]">Promo Code</th>
              <th className="py-3.5 px-4 min-w-[150px]">Discount</th>
              <th className="py-3.5 px-4 min-w-[120px]">Audience</th>
              <th className="py-3.5 px-4 min-w-[150px]">Redemption Progress</th>
              <th className="py-3.5 px-4 min-w-[150px]">Timeline & Status</th>
              <th className="py-3.5 px-4 text-right min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs sm:text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading campaigns...</span>
                  </div>
                </td>
              </tr>
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <FiGift className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">No campaigns found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search criteria or create a new marketing campaign.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              offers.map((offer) => {
                const isSelected = selectedIds.includes(offer.id || offer._id);
                const isVendor = Boolean(offer.isVendorOffer || offer.vendorId);
                const isPercentage = offer.discountType === 'percentage';
                const usage = offer.usedCount || 0;
                const limit = offer.usageLimit || offer.config?.totalUsageLimit || 0;
                const usagePct = limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 0;

                return (
                  <tr
                    key={offer.id || offer._id}
                    className={`transition-colors duration-150 ${
                      isSelected
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-750/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(offer.id || offer._id)}
                        className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>

                    {/* Campaign Title & Origin */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <FiTag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                            {offer.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isVendor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                <FiShoppingBag className="w-2.5 h-2.5" />
                                {offer.vendorId?.storeName || 'Vendor Deal'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                Platform
                              </span>
                            )}
                            {offer.priority > 0 && (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                ★ P{offer.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Promo Code with 1-click Copy */}
                    <td className="py-3.5 px-4">
                      {offer.code ? (
                        <button
                          onClick={(e) => handleCopyCode(offer.code, e)}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all cursor-pointer"
                          title="Click to copy promo code"
                        >
                          <span>{offer.code}</span>
                          {copiedCode === offer.code ? (
                            <FiCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Auto-Applied</span>
                      )}
                    </td>

                    {/* Discount Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {isPercentage ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} FLAT`}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {offer.minOrderAmount > 0
                            ? `Min. order ₹${offer.minOrderAmount}`
                            : 'No min. order'}
                          {isPercentage && offer.maxDiscountLimit && (
                            <span> · Max ₹{offer.maxDiscountLimit}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Roles */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {offer.targetRoles && offer.targetRoles.length > 0 ? (
                          offer.targetRoles.map((role) => (
                            <span
                              key={role}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">All users</span>
                        )}
                      </div>
                    </td>

                    {/* Usage & Redemptions */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {usage} used
                          </span>
                          <span className="text-slate-400">
                            {limit > 0 ? `of ${limit}` : 'unlimited'}
                          </span>
                        </div>
                        {limit > 0 && (
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usagePct >= 90
                                  ? 'bg-rose-500'
                                  : usagePct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Timeline & Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <AdminStatusBadge status={offer.status} />
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3 shrink-0" />
                          <span>{formatDuration(offer.startTime, offer.endTime)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {/* Analytics */}
                        <button
                          onClick={() => onOpenAnalytics(offer.id || offer._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                          title="View Campaign Analytics"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateOffer(offer.id || offer._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                          title="Duplicate Campaign"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={() => onToggleStatus(offer)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            offer.status === 'Active'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                          title={offer.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {offer.status === 'Active' ? (
                            <FiPause className="w-4 h-4" />
                          ) : (
                            <FiPlay className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditOffer(offer)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          title="Edit Campaign"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteOffer(offer.id || offer._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            results
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
