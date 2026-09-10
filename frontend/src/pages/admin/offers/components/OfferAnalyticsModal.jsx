import React, { useState } from 'react';
import {
  FiEye,
  FiMousePointer,
  FiCheckCircle,
  FiDollarSign,
  FiSend,
  FiDownload,
  FiSearch,
  FiUser,
  FiClock,
  FiLayers
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

  // Filter redemptions
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
      <div className="space-y-6 py-2">
        {/* Campaign Info Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {offer?.title || 'Campaign Overview'}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {offer?.code && (
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  {offer.code}
                </span>
              )}
              <span>·</span>
              <span>{offer?.isVendorOffer ? 'Vendor Store Deal' : 'BizReels Platform Campaign'}</span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={redemptions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
          >
            <FiDownload className="w-4 h-4 text-amber-500" />
            <span>Export Redemptions CSV</span>
          </button>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Views */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Views
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                {views.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Clicks & CTR */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Clicks (CTR)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {clicks.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-bold text-slate-400">({ctr}%)</span>
            </div>
          </div>

          {/* Redemptions */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Redemptions
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {used.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Conv. Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Conv. Rate
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {conversionRate}%
              </span>
            </div>
          </div>

          {/* Gross Savings */}
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Savings
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                {formatCurrency(totalSavingsDisbursed)}
              </span>
            </div>
          </div>
        </div>

        {/* Push Notification Broadcast Telemetry */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <FiSend className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {notification.sent ? 'Push Broadcast Delivered' : 'Push Notification Pending'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {notification.sent
                  ? `Sent at ${formatDate(notification.sentAt)} · Reached ${offer?.recipientCount || 0} users`
                  : 'Will be sent automatically when campaign transitions to Active.'}
              </p>
            </div>
          </div>
          {notification.sent && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {notification.deliveryRate || 100}% Delivered
            </span>
          )}
        </div>

        {/* Customer Redemption Ledger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Redemption Audit Trail ({redemptions.length})
            </span>
            {redemptions.length > 0 && (
              <div className="relative min-w-[200px]">
                <FiSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={redemptionSearch}
                  onChange={(e) => {
                    setRedemptionSearch(e.target.value);
                    setLedgerPage(1);
                  }}
                  placeholder="Filter customer or order..."
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-700/80 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Savings</th>
                  <th className="py-2.5 px-3 text-right">Redeemed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No redemptions recorded for this campaign yet.
                    </td>
                  </tr>
                ) : (
                  paginatedRedemptions.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.userId?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.userId?.email || r.userId?.phone || '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {r.orderId || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.discountAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
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
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Page {ledgerPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                  disabled={ledgerPage === 1}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setLedgerPage(p => Math.min(totalPages, p + 1))}
                  disabled={ledgerPage === totalPages}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
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
