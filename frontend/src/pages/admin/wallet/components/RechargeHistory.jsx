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
      <div className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Recharge ID, User ID, or Gateway Order ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Recharge ID</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">User</th>
                <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Amount</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Gateway</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><div className="animate-pulse">Loading recharges...</div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No recharge records found.</td></tr>
              ) : items.map((r) => (
                <tr key={r.id} className="hover:bg-[#fbf9f4] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] font-bold text-[#1a1a1a]">{r.recharge_id?.slice(-12)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-[#1a1a1a] block">{r.user_name || 'Unknown'}</span>
                      <span className="text-[9px] text-slate-400">{r.user_id?.slice(-8)} • <span className="capitalize">{r.user_role}</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-emerald-600">₹{r.amount?.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs font-bold text-slate-700 bg-[#f8f4ec] border border-[#e3dccb] px-2 py-0.5 rounded">{r.payment_gateway}</span>
                  </td>
                  <td className="px-4 py-3"><AdminStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 text-[10px] font-medium">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-slate-400">{r.invoice_number || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-slate-500 font-bold">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronLeft className="w-4 h-4 text-[#1a1a1a]" /></button>
              <span className="text-xs font-bold text-[#1a1a1a] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e3dccb] disabled:opacity-30 cursor-pointer"><FiChevronRight className="w-4 h-4 text-[#1a1a1a]" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
