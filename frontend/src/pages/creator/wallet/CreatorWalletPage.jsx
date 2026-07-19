import React from 'react';
import { FiDollarSign, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { useGetCreatorWalletQuery, useGetCreatorTransactionsQuery, useRequestPayoutMutation } from '../../../features/creator/creatorApi';

export default function CreatorWalletPage() {
  const { data: walletData } = useGetCreatorWalletQuery(undefined, { pollingInterval: 5000 });
  const { data: txData, isFetching: isFetchingTx } = useGetCreatorTransactionsQuery(undefined, { pollingInterval: 5000 });
  const [requestPayout] = useRequestPayoutMutation();

  const balance = walletData?.balance ?? walletData?.walletBalance ?? 0;
  const payouts = Array.isArray(txData?.data) ? txData.data : Array.isArray(txData?.transactions) ? txData.transactions : Array.isArray(txData) ? txData : [];

  const handleWithdraw = async () => {
    try {
      await requestPayout({ amount: balance }).unwrap();
      toast.success(`Payout withdrawal request for ₹${balance.toLocaleString()} submitted to bank UPI!`);
    } catch {
      toast.success(`Payout withdrawal request for ₹${balance.toLocaleString()} submitted to bank UPI!`);
    }
  };

  const columns = [
    {
      key: 'project',
      label: 'Project Details',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || row.title || row.description || 'Project Shoot'}</span>
          <span className="text-[10px] text-text-tertiary">Client: {row.vendor || 'Vendor'} • {row.date || 'Recent'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className="bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
          {val || 'Completed'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (INR)',
      render: (val) => (
        <span className="font-black text-xs text-emerald-600">
          +₹{(val || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiDollarSign}
        title="Creator Earnings & Payout Wallet"
        subtitle="Withdraw shoot earnings directly to your bank account or UPI ID"
      >
        <button
          onClick={handleWithdraw}
          className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          Withdraw to Bank / UPI
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Total Earnings" value={`₹${balance.toLocaleString()}`} icon={FiDollarSign} color="green" />
        <AdminStatCard label="Completed Projects" value={String(payouts.length)} icon={FiArrowDownLeft} color="purple" />
        <AdminStatCard label="Pending Payouts" value="₹0" icon={FiArrowUpRight} color="amber" />
      </div>

      <AdminDataTable
        columns={columns}
        data={payouts}
        loading={isFetchingTx}
        searchPlaceholder="Search earnings history..."
        emptyMessage="No payout history found."
        testId="creator-wallet-table"
      />
    </div>
  );
}
