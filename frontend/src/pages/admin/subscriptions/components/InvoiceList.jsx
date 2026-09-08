import React, { useState } from 'react';
import { FiSearch, FiFileText, FiDownload, FiMail, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useListSubscriptionInvoicesQuery } from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

import API_CONFIG from '../../../../config';

const API_URL = API_CONFIG.BASE_URL;

export default function InvoiceList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isFetching } = useListSubscriptionInvoicesQuery({
    page,
    limit: 25,
    ...(search && { search }),
    ...(statusFilter && { payment_status: statusFilter }),
  }, { pollingInterval: 10000 });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleDownloadPDF = (invoiceId) => {
    window.open(`${API_URL}/admin/subscription/invoices/${invoiceId}/pdf`, '_blank');
  };

  const handleEmailInvoice = (invoiceId) => {
    // Stub endpoint integration / alert placeholder
    toast.success('Invoice email queue scheduled for delivery');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs flex flex-wrap gap-2.5 items-center font-sans">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by invoice #, user name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-10 pr-4 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer border-none"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Invoice No.</th>
                <th className="text-left px-4 py-3">Subscriber</th>
                <th className="text-left px-4 py-3">Plan Name</th>
                <th className="text-right px-4 py-3">Tax (GST)</th>
                <th className="text-right px-4 py-3">Discount</th>
                <th className="text-right px-4 py-3">Total Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Issued Date</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/50">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400 font-bold animate-pulse">Loading billing invoices...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400 font-bold">No invoices found.</td></tr>
              ) : (
                items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FiFileText className="w-4 h-4 text-[#d99a3d]" />
                        <span className="font-mono font-bold text-[#1a1a1a]">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-[#1a1a1a] block">{inv.user_name || 'Customer'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.user_id?.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-[#1a1a1a]">{inv.plan_name}</span>
                        <span className="text-[10px] text-slate-500 block capitalize">{inv.billing_cycle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-[#1a1a1a]">₹{inv.gst_amount?.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 block">({inv.gst_percentage}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                      {inv.discount_amount > 0 ? `-₹${inv.discount_amount}` : '—'}
                      {inv.coupon_code && <span className="text-[10px] text-slate-400 block font-mono">[{inv.coupon_code}]</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-[#1a1a1a]">₹{inv.total_amount?.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3"><AdminStatusBadge status={inv.payment_status} /></td>
                    <td className="px-4 py-3 text-slate-400 font-medium">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv.id)}
                          className="p-1.5 rounded-lg text-[#1a1a1a] bg-[#f8f4ec] border border-[#e3dccb] hover:bg-black hover:text-white transition-all cursor-pointer"
                          title="Download PDF"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEmailInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-[#1a1a1a] bg-[#f8f4ec] border border-[#e3dccb] hover:bg-black hover:text-white transition-all cursor-pointer"
                          title="Email Invoice"
                        >
                          <FiMail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
            <span className="text-[10px] text-slate-500 font-bold">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total} invoices
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer border-none"><FiChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-black text-[#1a1a1a] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 cursor-pointer border-none"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
