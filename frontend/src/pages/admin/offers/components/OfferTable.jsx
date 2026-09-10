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
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import { formatDuration } from './offerUtils';

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
    <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden font-sans">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[320px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f4ec] border-b border-[#e3dccb] text-[10px] font-black text-[#8c827a] uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded-md border-[#e3dccb] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 min-w-[240px]">Campaign / Origin</th>
              <th className="py-3.5 px-4 min-w-[140px]">Promo Code</th>
              <th className="py-3.5 px-4 min-w-[150px]">Discount Value</th>
              <th className="py-3.5 px-4 min-w-[120px]">Audience</th>
              <th className="py-3.5 px-4 min-w-[150px]">Usage / Cap</th>
              <th className="py-3.5 px-4 min-w-[150px]">Timeline & Status</th>
              <th className="py-3.5 px-4 text-right min-w-[150px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0eadc] text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-[#8c827a]">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold">Loading campaign ledger...</span>
                  </div>
                </td>
              </tr>
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#f8f4ec] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center mx-auto shadow-2xs">
                      <FiGift className="w-6 h-6" />
                    </div>
                    <p className="font-black text-[#1a1a1a] text-sm">No campaigns found</p>
                    <p className="text-xs text-[#8c827a]">
                      Try adjusting search filters or launch a new promotional campaign.
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
                      isSelected ? 'bg-[#f8f4ec]' : 'hover:bg-[#fbf9f4]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(offer.id || offer._id)}
                        className="rounded-md border-[#e3dccb] text-[#1a1a1a] focus:ring-[#1a1a1a] cursor-pointer"
                      />
                    </td>

                    {/* Campaign Title & Origin */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#e3dccb] shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#f8f4ec] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center shrink-0 shadow-2xs">
                            <FiTag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <p className="font-black text-[#1a1a1a] truncate">
                            {offer.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isVendor ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a]">
                                <FiShoppingBag className="w-2.5 h-2.5 text-[#d99a3d]" />
                                {offer.vendorId?.storeName || 'Vendor Deal'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#1a1a1a] text-[#d99a3d]">
                                BizReels Platform
                              </span>
                            )}
                            {offer.priority > 0 && (
                              <span className="text-[10px] font-black text-amber-600">
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
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-black bg-[#f8f4ec] hover:bg-white text-[#1a1a1a] border border-[#e3dccb] hover:border-[#1a1a1a] shadow-2xs transition-all cursor-pointer"
                          title="Click to copy promo code"
                        >
                          <span>{offer.code}</span>
                          {copiedCode === offer.code ? (
                            <FiCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FiCopy className="w-3 h-3 text-[#8c827a] group-hover:text-[#1a1a1a]" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[#8c827a] text-xs italic">Auto-Applied</span>
                      )}
                    </td>

                    {/* Discount Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#1a1a1a] text-sm">
                          {isPercentage ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} FLAT`}
                        </span>
                        <div className="text-[11px] text-[#8c827a] font-medium">
                          {offer.minOrderAmount > 0
                            ? `Min. order ₹${offer.minOrderAmount}`
                            : 'No minimum'}
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
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] capitalize"
                            >
                              {role}s
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#8c827a]">All users</span>
                        )}
                      </div>
                    </td>

                    {/* Usage & Redemptions */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-[#1a1a1a]">
                            {usage} used
                          </span>
                          <span className="text-[#8c827a] font-medium">
                            {limit > 0 ? `of ${limit}` : 'unlimited'}
                          </span>
                        </div>
                        {limit > 0 && (
                          <div className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-full h-1.5 overflow-hidden">
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
                        <div className="text-[10px] text-[#8c827a] font-medium flex items-center gap-1">
                          <FiClock className="w-3 h-3 shrink-0" />
                          <span>{formatDuration(offer.startTime, offer.endTime)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Analytics */}
                        <button
                          onClick={() => onOpenAnalytics(offer.id || offer._id)}
                          className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white text-[#8c827a] hover:text-[#1a1a1a] transition-all shadow-2xs cursor-pointer"
                          title="View Analytics"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateOffer(offer.id || offer._id)}
                          className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white text-[#8c827a] hover:text-amber-600 transition-all shadow-2xs cursor-pointer"
                          title="Duplicate Campaign"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={() => onToggleStatus(offer)}
                          className={`p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white transition-all shadow-2xs cursor-pointer ${
                            offer.status === 'Active'
                              ? 'text-emerald-700 hover:text-emerald-800'
                              : 'text-[#8c827a] hover:text-[#1a1a1a]'
                          }`}
                          title={offer.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {offer.status === 'Active' ? (
                            <FiPause className="w-3.5 h-3.5" />
                          ) : (
                            <FiPlay className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditOffer(offer)}
                          className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white text-[#8c827a] hover:text-[#1a1a1a] transition-all shadow-2xs cursor-pointer"
                          title="Edit Campaign"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteOffer(offer.id || offer._id)}
                          className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-rose-50 text-[#8c827a] hover:text-rose-600 transition-all shadow-2xs cursor-pointer"
                          title="Delete Campaign"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
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
        <div className="px-4 py-3 border-t border-[#e3dccb] bg-[#fbf9f4] flex items-center justify-between text-xs text-[#8c827a]">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            campaigns
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2.5 py-1 rounded-lg border border-[#e3dccb] bg-white disabled:opacity-40 hover:bg-[#f8f4ec] text-[#1a1a1a] font-bold cursor-pointer"
            >
              <FiChevronLeft className="w-3.5 h-3.5 inline" /> Prev
            </button>
            <span className="font-bold text-[#1a1a1a] px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2.5 py-1 rounded-lg border border-[#e3dccb] bg-white disabled:opacity-40 hover:bg-[#f8f4ec] text-[#1a1a1a] font-bold cursor-pointer"
            >
              Next <FiChevronRight className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
