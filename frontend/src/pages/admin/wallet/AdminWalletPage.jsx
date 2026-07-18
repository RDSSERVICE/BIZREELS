import React, { useState } from 'react';
import { FiCreditCard, FiPlus, FiMinus, FiRefreshCw, FiList, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminTransactionsQuery,
  useManualCreditWalletMutation,
  useManualDebitWalletMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'transactions', label: 'Transaction History', icon: FiList },
  { key: 'recharges', label: 'Recharge History', icon: FiCreditCard },
  { key: 'refunds', label: 'Refunds', icon: FiRefreshCw },
];

export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [search, setSearch] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualType, setManualType] = useState('credit'); // 'credit' | 'debit'
  const [manualForm, setManualForm] = useState({ user_id: '', amount_credits: 50, reason: '' });

  const { data, isFetching } = useListAdminTransactionsQuery({ limit: 100 }, { pollingInterval: 5000 });
  const [manualCredit] = useManualCreditWalletMutation();
  const [manualDebit] = useManualDebitWalletMutation();

  const items = data?.items || [];

  const handleManualAction = async () => {
    if (!manualForm.user_id || !manualForm.amount_credits) {
      return toast.error('User ID and credit amount are required');
    }
    try {
      if (manualType === 'credit') {
        await manualCredit(manualForm).unwrap();
        toast.success(`Credited ${manualForm.amount_credits} credits to user!`);
      } else {
        await manualDebit(manualForm).unwrap();
        toast.success(`Debited ${manualForm.amount_credits} credits from user!`);
      }
      setShowManualModal(false);
      setManualForm({ user_id: '', amount_credits: 50, reason: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Manual action failed');
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference / Ref ID',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || row.id}</span>
          <span className="text-[10px] text-text-tertiary capitalize">{row.kind} • {row.provider || 'Internal'}</span>
        </div>
      ),
    },
    {
      key: 'user_id',
      label: 'User ID',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'amount_paise',
      label: 'Amount / Credits',
      render: (val, row) => (
        <span className={`font-bold ${row.kind === 'wallet' ? 'text-brand-purple' : 'text-emerald-600'}`}>
          {row.kind === 'wallet' ? `${val / 100} Credits` : `₹${((val || 0) / 100).toLocaleString('en-IN')}`}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Wallet & Financial Management"
        subtitle="Manage wallet balances, recharge logs, refunds, and perform manual credits or debits"
      >
        <div className="flex gap-2">
          <button
            onClick={() => { setManualType('credit'); setShowManualModal(true); }}
            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-premium"
          >
            <FiPlus className="w-3.5 h-3.5" /> Manual Credit
          </button>
          <button
            onClick={() => { setManualType('debit'); setShowManualModal(true); }}
            className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1 shadow-premium"
          >
            <FiMinus className="w-3.5 h-3.5" /> Manual Debit
          </button>
        </div>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search transactions by reference or User ID..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No wallet transactions found."
        testId="wallet-table"
      />

      {/* Manual Credit / Debit Modal */}
      <AdminModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        title={manualType === 'credit' ? 'Manual Wallet Credit' : 'Manual Wallet Debit'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">User ID</label>
            <input
              type="text"
              placeholder="e.g. 64a8b... User ID"
              value={manualForm.user_id}
              onChange={(e) => setManualForm((prev) => ({ ...prev, user_id: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Amount (Credits)</label>
            <input
              type="number"
              value={manualForm.amount_credits}
              onChange={(e) => setManualForm((prev) => ({ ...prev, amount_credits: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason / Note</label>
            <input
              type="text"
              placeholder="e.g. Promotional bonus or Refund adjustment"
              value={manualForm.reason}
              onChange={(e) => setManualForm((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>

          <button
            onClick={handleManualAction}
            className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition-all ${
              manualType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Confirm {manualType === 'credit' ? 'Credit' : 'Debit'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
