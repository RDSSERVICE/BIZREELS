import React, { useState, useCallback } from 'react';
import { FiSearch, FiDownload, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useListWalletTransactionsQuery } from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'manual_credit', label: 'Manual Credit' },
  { value: 'manual_debit', label: 'Manual Debit' },
  { value: 'recharge', label: 'Recharge' },
  { value: 'refund', label: 'Refund' },
  { value: 'subscription_purchase', label: 'Subscription' },
  { value: 'order_payment', label: 'Order Payment' },
  { value: 'commission_payout', label: 'Commission' },
  { value: 'lead_purchase', label: 'Lead Purchase' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'deposit', label: 'Deposit' },
];

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'creator', label: 'Creator' },
  { value: 'customer', label: 'Customer' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
];

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

/**
 * TransactionHistory
 * Full-featured transaction table with search, filter, sort, pagination, and export.
 */
export default function TransactionHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    user_role: '',
    status: '',
    transaction_type: '',
    credit_debit: '',
    from_date: '',
    to_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = {
    page,
    limit: 25,
    ...(search && { search }),
    ...(filters.user_role && { user_role: filters.user_role }),
    ...(filters.status && { status: filters.status }),
    ...(filters.transaction_type && { transaction_type: filters.transaction_type }),
    ...(filters.credit_debit && { credit_debit: filters.credit_debit }),
    ...(filters.from_date && { from_date: filters.from_date }),
    ...(filters.to_date && { to_date: filters.to_date }),
  };

  const { data, isFetching } = useListWalletTransactionsQuery(queryParams, { pollingInterval: 8000 });
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('bizreels_access_token') || localStorage.getItem('accessToken');
    const params = new URLSearchParams(queryParams).toString();
    window.open(`${API_URL}/admin/wallet/transactions/export/csv?${params}`, '_blank');
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams(queryParams).toString();
    window.open(`${API_URL}/admin/wallet/transactions/export/excel?${params}`, '_blank');
  };

  const formatType = (type) => {
    return (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="glass rounded-2xl p-4 border border-white/50 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              placeholder="Search by User ID, Transaction ID, Reference ID, or Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90 transition-all"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${showFilters ? 'bg-brand-purple text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}
          >
            <FiFilter className="w-3.5 h-3.5" /> Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
          >
            <FiDownload className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
          >
            <FiDownload className="w-3.5 h-3.5" /> Excel
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border animate-fade-in">
            <select
              value={filters.user_role}
              onChange={(e) => handleFilterChange('user_role', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={filters.credit_debit}
              onChange={(e) => handleFilterChange('credit_debit', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              <option value="">Credit & Debit</option>
              <option value="credit">Credit Only</option>
              <option value="debit">Debit Only</option>
            </select>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              placeholder="From Date"
            />
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              placeholder="To Date"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Transaction</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Amount</th>
                <th className="text-right px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Balance</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-bold text-text-tertiary uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isFetching && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-tertiary">
                    <div className="animate-pulse">Loading transactions...</div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-tertiary">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                items.map((txn) => (
                  <tr key={txn.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono text-[10px] text-brand-purple block">{txn.transaction_id?.slice(-12)}</span>
                        {txn.reference_id && (
                          <span className="text-[9px] text-text-tertiary">Ref: {txn.reference_id?.slice(-10)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-text-primary block">{txn.user_name || 'Unknown'}</span>
                        <span className="text-[9px] text-text-tertiary">
                          {txn.user_id?.slice(-8)} • <span className="capitalize">{txn.user_role}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${txn.credit_debit === 'credit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                        {formatType(txn.transaction_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${txn.credit_debit === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {txn.credit_debit === 'credit' ? '+' : '-'}{txn.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className="font-bold text-text-primary block">{txn.updated_balance?.toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-text-tertiary">was {txn.previous_balance?.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminStatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-tertiary text-[10px]">
                        {txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </span>
                      <span className="text-[9px] text-text-tertiary block">
                        {txn.created_at ? new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[150px]">
                      <span className="text-text-tertiary text-[10px] truncate block" title={txn.admin_remarks}>
                        {txn.admin_remarks || txn.notes || '—'}
                      </span>
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
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total} transactions
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 transition-all"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-text-secondary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 transition-all"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
