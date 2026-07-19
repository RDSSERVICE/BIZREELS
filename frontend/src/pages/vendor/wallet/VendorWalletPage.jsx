import React from 'react';
import { FiDollarSign, FiPlusCircle, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { useGetVendorWalletQuery, useGetWalletTransactionsQuery, useRechargeWalletMutation } from '../../../features/vendor/vendorApi';

export default function VendorWalletPage() {
  const { data: walletData } = useGetVendorWalletQuery(undefined, { pollingInterval: 5000 });
  const { data: txData, isFetching: isFetchingTx } = useGetWalletTransactionsQuery(undefined, { pollingInterval: 5000 });
  const [rechargeWallet] = useRechargeWalletMutation();

  const balance = walletData?.balance ?? walletData?.walletBalance ?? 0;
  const transactions = Array.isArray(txData?.transactions) ? txData.transactions : Array.isArray(txData?.data) ? txData.data : Array.isArray(txData?.items) ? txData.items : Array.isArray(txData) ? txData : [];

  const totalCredits = transactions
    .filter((tx) => tx.type === 'credit' || tx.type === 'deposit')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const totalDebits = transactions
    .filter((tx) => tx.type === 'debit' || tx.type === 'payment' || tx.type === 'purchase')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const handleRecharge = async () => {
    try {
      await rechargeWallet({ amount: 2000 }).unwrap();
      toast.success('Added ₹2,000 to vendor wallet!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to recharge wallet');
    }
  };

  const columns = [
    {
      key: 'description',
      label: 'Transaction',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || row.title || 'Wallet Activity'}</span>
          <span className="text-[10px] text-text-tertiary">{row._id || row.id} • {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : row.date || 'Recent'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
          val === 'credit' || val === 'deposit' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
        }`}>
          {val || 'credit'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (INR)',
      render: (val, row) => (
        <span className={`font-black text-xs ${row.type === 'credit' || row.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.type === 'credit' || row.type === 'deposit' ? '+' : '-'}₹{(val || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiDollarSign}
        title="Vendor Wallet & Balance"
        subtitle="Preload balance for reel boosts, ads, and manage order payouts & refunds"
      >
        <button
          onClick={handleRecharge}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlusCircle size={16} /> Recharge Wallet (+₹2,000)
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Available Balance" value={`₹${balance.toLocaleString('en-IN')}`} icon={FiDollarSign} color="green" />
        <AdminStatCard label="Total Credits" value={`₹${totalCredits.toLocaleString('en-IN')}`} icon={FiArrowDownLeft} color="blue" />
        <AdminStatCard label="Total Debits" value={`₹${totalDebits.toLocaleString('en-IN')}`} icon={FiArrowUpRight} color="rose" />
      </div>

      <AdminDataTable
        columns={columns}
        data={transactions}
        loading={isFetchingTx}
        searchPlaceholder="Search transactions..."
        emptyMessage="No wallet transactions found."
        testId="vendor-wallet-table"
      />
    </div>
  );
}
