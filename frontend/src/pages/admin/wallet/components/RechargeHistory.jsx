import React, { useState } from 'react';
import { FiSearch, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useListWalletRechargesQuery } from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

/**
 * RechargeHistory
 * Displays all wallet recharge/top-up transactions with search and filters.
 */
export default function RechargeHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isFetching } = useListWalletRechargesQuery(
    { page, limit: 25, ...(search && { search }), ...(statusFilter && { status: statusFilter }) },
    { pollingInterval: 10000 }
  );

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="glass rounded-2xl p-4 border border-white/50">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Recharge ID, User ID, or Gateway Order ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-4 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90 transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Recharge ID</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">User</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Gateway</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-tertiary"><div className="animate-pulse">Loading recharges...</div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-text-tertiary">No recharge records found.</td></tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-brand-purple">{r.recharge_id?.slice(-12)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-text-primary block">{r.user_name || 'Unknown'}</span>
                      <span className="text-[9px] text-text-tertiary">{r.user_id?.slice(-8)} • <span className="capitalize">{r.user_role}</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-emerald-600">₹{r.amount?.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded">{r.payment_gateway}</span>
                  </td>
                  <td className="px-4 py-3"><AdminStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-text-tertiary text-[10px]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-text-tertiary">{r.invoice_number || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-secondary/30">
            <span className="text-[10px] text-text-tertiary">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-bold text-text-secondary px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
