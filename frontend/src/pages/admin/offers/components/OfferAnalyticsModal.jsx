import React, { useState } from 'react';
import {
  FiSend,
  FiDownload,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { formatCurrency, formatDate, exportRedemptionsToCsv } from './offerUtils';

export default function OfferAnalyticsModal({
  isOpen,
  onClose,
  offer = null,
  analyticsData = null,
  isLoading = false
}) {
  const [redemptionSearch, setRedemptionSearch] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const pageSize = 8;

  if (!offer && !analyticsData) return null;

  const data = analyticsData?.analytics || {};
  const views = data.viewsCount || offer?.analytics?.viewsCount || 0;
  const clicks = data.clicksCount || offer?.analytics?.clicksCount || 0;
  const used = data.usedCount || offer?.usedCount || 0;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : 0;
  const conversionRate = clicks > 0 ? ((used / clicks) * 100).toFixed(1) : 0;

  const redemptions = data.redemptions || offer?.redemptions || [];
  const totalSavingsDisbursed = redemptions.reduce(
    (acc, curr) => acc + (Number(curr.discountAmount) || 0),
    0
  );

  const notification = data.notification || offer?.notificationStatus || {};

  const filteredRedemptions = redemptions.filter((r) => {
    if (!redemptionSearch) return true;
    const term = redemptionSearch.toLowerCase();
    const name = (r.userId?.name || '').toLowerCase();
    const email = (r.userId?.email || '').toLowerCase();
    const phone = (r.userId?.phone || '').toLowerCase();
    const orderId = (r.orderId || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term) || orderId.includes(term);
  });

  const totalPages = Math.ceil(filteredRedemptions.length / pageSize) || 1;
  const paginatedRedemptions = filteredRedemptions.slice(
    (ledgerPage - 1) * pageSize,
    ledgerPage * pageSize
  );

  const handleExport = () => {
    exportRedemptionsToCsv(redemptions, offer?.title || 'Offer');
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Telemetry & Redemption Ledger"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 py-2 font-sans">
        {/* Campaign Info Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#fbf9f4] border border-[#e3dccb] shadow-2xs">
          <div>
            <h3 className="text-base font-black text-[#1a1a1a]">
              {offer?.title || 'Campaign Overview'}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#8c827a]">
              {offer?.code && (
                <span className="font-mono font-black text-[#1a1a1a] bg-[#f8f4ec] px-2.5 py-0.5 rounded-md border border-[#e3dccb]">
                  {offer.code}
                </span>
              )}
              <span>·</span>
              <span className="font-bold">{offer?.isVendorOffer ? 'Vendor Store Deal' : 'BizReels Platform Campaign'}</span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={redemptions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-[#d99a3d] bg-[#1a1a1a] hover:bg-[#241b15] border border-[#1a1a1a] shadow-xs disabled:opacity-40 transition-all cursor-pointer"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export Redemptions (CSV)</span>
          </button>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Views */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block">
              Total Views
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-[#1a1a1a]">
                {views.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Clicks & CTR */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block">
              Clicks (CTR)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#1a1a1a]">
                {clicks.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-bold text-blue-600">({ctr}%)</span>
            </div>
          </div>

          {/* Redemptions */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block">
              Redemptions
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600">
                {used.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Conv. Rate */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block">
              Conv. Rate
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-600">
                {conversionRate}%
              </span>
            </div>
          </div>

          {/* Gross Savings */}
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="text-[10px] font-black text-[#8c827a] uppercase tracking-wider block">
              Gross Savings
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-700">
                {formatCurrency(totalSavingsDisbursed)}
              </span>
            </div>
          </div>
        </div>

        {/* Push Notification Broadcast Telemetry */}
        <div className="p-4 rounded-2xl bg-[#fbf9f4] border border-[#e3dccb] flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f8f4ec] text-[#d99a3d] border border-[#e3dccb] flex items-center justify-center shrink-0">
              <FiSend className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-[#1a1a1a]">
                {notification.sent ? 'Push Broadcast Delivered' : 'Push Notification Scheduled'}
              </p>
              <p className="text-[11px] text-[#8c827a] font-medium">
                {notification.sent
                  ? `Sent at ${formatDate(notification.sentAt)} · Reached ${offer?.recipientCount || 0} target users`
                  : 'Automatically dispatched when campaign enters Active state.'}
              </p>
            </div>
          </div>
          {notification.sent && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-200 text-emerald-700">
              {notification.deliveryRate || 100}% Delivered
            </span>
          )}
        </div>

        {/* Customer Redemption Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
              Redemption Audit Ledger ({redemptions.length})
            </span>
            {redemptions.length > 0 && (
              <div className="relative min-w-[220px]">
                <FiSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c827a]" />
                <input
                  type="text"
                  value={redemptionSearch}
                  onChange={(e) => {
                    setRedemptionSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  placeholder="Filter customer or order..."
                  className="w-full pl-8 pr-3 py-1 bg-white border border-[#e3dccb] rounded-lg text-xs font-medium text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e3dccb] bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f4ec] border-b border-[#e3dccb] text-[10px] font-black text-[#8c827a] uppercase">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Savings</th>
                  <th className="py-2.5 px-3 text-right">Redeemed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eadc]">
                {paginatedRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#8c827a]">
                      No redemptions recorded for this campaign yet.
                    </td>
                  </tr>
                ) : (
                  paginatedRedemptions.map((r, i) => (
                    <tr key={i} className="hover:bg-[#fbf9f4]">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#1a1a1a]">
                          {r.userId?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-[#8c827a]">
                          {r.userId?.email || r.userId?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#1a1a1a]">
                        {r.orderId || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-black text-emerald-600">
                        {formatCurrency(r.discountAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8c827a]">
                        {formatDate(r.redeemedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#8c827a] pt-1">
              <span>
                Page {ledgerPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                  disabled={ledgerPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-[#e3dccb] bg-white font-bold text-[#1a1a1a] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setLedgerPage(p => Math.min(totalPages, p + 1))}
                  disabled={ledgerPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-[#e3dccb] bg-white font-bold text-[#1a1a1a] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
