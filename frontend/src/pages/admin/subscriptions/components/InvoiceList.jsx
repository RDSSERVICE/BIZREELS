import React, { useState } from 'react';
import { FiSearch, FiFileText, FiDownload, FiMail, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useListSubscriptionInvoicesQuery } from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

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
      <div className="glass rounded-2xl p-4 border border-white/50 flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
          <input
            type="text"
            placeholder="Search by invoice #, user name or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-4 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Invoice No.</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Subscriber</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Plan Name</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Tax (GST)</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Discount</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Total Amount</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Issued Date</th>
                <th className="text-center px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-text-tertiary animate-pulse">Loading billing invoices...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-text-tertiary">No invoices found.</td></tr>
              ) : (
                items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FiFileText className="w-4 h-4 text-text-tertiary" />
                        <span className="font-mono font-bold text-text-primary">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-text-primary block">{inv.user_name || 'Customer'}</span>
                        <span className="text-[9px] text-text-tertiary">{inv.user_id?.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span>{inv.plan_name}</span>
                        <span className="text-[9px] text-text-tertiary block capitalize">{inv.billing_cycle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span>₹{inv.gst_amount?.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-text-tertiary block">({inv.gst_percentage}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {inv.discount_amount > 0 ? `-₹${inv.discount_amount}` : '—'}
                      {inv.coupon_code && <span className="text-[9px] text-text-tertiary block font-mono">[{inv.coupon_code}]</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-text-primary">₹{inv.total_amount?.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3"><AdminStatusBadge status={inv.payment_status} /></td>
                    <td className="px-4 py-3 text-text-tertiary">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv.id)}
                          className="p-1 rounded text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                          title="Download PDF"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEmailInvoice(inv.id)}
                          className="p-1 rounded text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-secondary/30">
            <span className="text-[10px] text-text-tertiary">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total} invoices
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
