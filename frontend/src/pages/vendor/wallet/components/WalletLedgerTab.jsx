import React, { useState, useMemo } from 'react';
import { FiCreditCard, FiFilter } from 'react-icons/fi';
import AdminDataTable from '../../../../features/admin/components/AdminDataTable';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * WalletLedgerTab
 * Interactive, filterable transaction ledger cleanly distinguishing credit usages, recharges, and payouts.
 */
export default function WalletLedgerTab({ transactions = [], isLoading = false }) {
  const { bi } = useLanguage();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'usages' | 'recharges' | 'withdrawals'

  const isTxCredit = (t) => {
    const typeStr = (t?.type || t?.credit_debit || '').toLowerCase();
    return (
      typeStr === 'credit' ||
      typeStr === 'deposit' ||
      typeStr === 'recharge' ||
      typeStr === 'referral_bonus' ||
      typeStr === 'refund' ||
      t?.transaction_type === 'recharge' ||
      t?.transaction_type === 'manual_credit'
    );
  };

  const isTxWithdrawal = (t) => {
    const txType = (t?.transaction_type || t?.type || '').toLowerCase();
    return txType === 'withdrawal' || txType === 'payout' || t?.payment_method === 'bank_transfer';
  };

  // Filter transactions based on selected tab
  const filteredTransactions = useMemo(() => {
    if (filterType === 'recharges') {
      return transactions.filter((t) => isTxCredit(t));
    }
    if (filterType === 'withdrawals') {
      return transactions.filter((t) => isTxWithdrawal(t));
    }
    if (filterType === 'usages') {
      return transactions.filter((t) => !isTxCredit(t) && !isTxWithdrawal(t));
    }
    return transactions;
  }, [transactions, filterType]);

  const columns = [
    {
      key: 'created_at',
      label: bi('Date & Time', 'दिनांक और समय'),
      render: (val, row) => {
        const rawDate = val || row?.created_at || row?.createdAt || row?.date || row?.timestamp;
        if (!rawDate) return <span className="text-slate-400 font-bold text-xs">N/A</span>;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return <span className="text-slate-400 font-bold text-xs">N/A</span>;
        return (
          <div className="flex flex-col font-sans">
            <span className="font-black text-xs text-[#1a1a1a]">
              {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: bi('Description & Reference', 'विवरण (Description)'),
      render: (val, row) => {
        const desc =
          val ||
          row?.description ||
          row?.admin_remarks ||
          row?.meta?.plan_name ||
          row?.title ||
          row?.type ||
          'Transaction';
        const refId = row?.reference_id || row?.referenceId || row?.paymentId || row?.payment_id;
        const txType = row?.transaction_type || row?.type;
        const badgeLabel = txType ? txType.replace(/_/g, ' ').toUpperCase() : null;

        return (
          <div className="flex flex-col font-sans gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs text-[#1a1a1a]">{desc}</span>
              {badgeLabel && badgeLabel !== 'TRANSACTION' && badgeLabel !== 'DEBIT' && badgeLabel !== 'CREDIT' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#f8f4ec] text-slate-700 border border-[#e3dccb] uppercase tracking-wider">
                  {badgeLabel}
                </span>
              )}
            </div>
            {refId && <span className="text-[10px] text-slate-400 font-mono">ID: {refId}</span>}
          </div>
        );
      },
    },
    {
      key: 'type',
      label: bi('Category', 'श्रेणी (Category)'),
      render: (val, row) => {
        const isWithdrawal = isTxWithdrawal(row);
        const isCredit = isTxCredit(row);

        if (isWithdrawal) {
          return (
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
              🏦 {bi('Bank Payout', 'बैंक निकासी')}
            </span>
          );
        }

        return (
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              isCredit
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {isCredit ? bi('Credit (+)', 'क्रेडिट (+)') : bi('Usage Debit (-)', 'उपयोग कटौती (-)')}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: bi('Credits / Amount', 'क्रेडिट्स / राशि'),
      render: (val, row) => {
        const amt = typeof val === 'number' ? val : (typeof row?.amount === 'number' ? row.amount : 0);
        const isCredit = isTxCredit(row);
        const isWithdrawal = isTxWithdrawal(row);

        if (isWithdrawal) {
          return (
            <div className="flex flex-col font-sans">
              <span className="font-black text-xs font-mono text-indigo-700">
                -₹{Math.abs(amt).toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-slate-400 font-bold">
                {row?.status === 'pending' ? '⏳ Processing Bank Transfer' : '✓ Cleared to Bank'}
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col font-sans">
            <span className={`font-black text-xs font-mono ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isCredit ? '+' : '-'}{Math.abs(amt).toLocaleString('en-IN')} Credits
            </span>
            <span className="text-[9.5px] text-slate-400 font-bold">
              ₹{Math.abs(amt).toLocaleString('en-IN')} (1 Cr = ₹1)
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e3dccb] pb-3 gap-3">
        <h3
          style={{ fontFamily: "'Archivo Black', sans-serif" }}
          className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2"
        >
          <FiCreditCard className="text-[#d99a3d]" size={18} />{' '}
          {bi('WALLET TRANSACTION LEDGER', 'वॉलेट लेन-देन खाता')}
        </h3>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer border ${
              filterType === 'all'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-[#241b15]'
            }`}
          >
            {bi('All', 'सभी')} ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('usages')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer border ${
              filterType === 'usages'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-[#241b15]'
            }`}
          >
            ⚡ {bi('Credit Usages', 'क्रेडिट उपयोग')}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('recharges')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer border ${
              filterType === 'recharges'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-[#241b15]'
            }`}
          >
            💳 {bi('Recharges', 'रीचार्ज')}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('withdrawals')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer border ${
              filterType === 'withdrawals'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15]'
                : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:border-[#241b15]'
            }`}
          >
            🏦 {bi('Bank Payouts', 'बैंक निकासी')}
          </button>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredTransactions}
        loading={isLoading}
        searchPlaceholder={bi(
          'Search transactions by description or reference ID...',
          'विवरण या आईडी द्वारा लेन-देन खोजें...'
        )}
        emptyMessage={bi('No wallet transactions found.', 'कोई वॉलेट लेन-देन नहीं मिला।')}
        testId="vendor-wallet-table"
      />
    </div>
  );
}
