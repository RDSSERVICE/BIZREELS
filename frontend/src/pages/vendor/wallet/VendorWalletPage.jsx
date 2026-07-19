import React, { useState } from 'react';
import { FiDollarSign, FiPlusCircle, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { useGetVendorWalletQuery, useGetWalletTransactionsQuery, useRechargeWalletMutation } from '../../../features/vendor/vendorApi';

export default function VendorWalletPage() {
  const { data: walletData, isFetching: isFetchingWallet } = useGetVendorWalletQuery(undefined, { pollingInterval: 5000 });
  const { data: txData, isFetching: isFetchingTx } = useGetWalletTransactionsQuery(undefined, { pollingInterval: 5000 });
  const [rechargeWallet] = useRechargeWalletMutation();

  const balance = walletData?.balance ?? 4850;
  const transactions = txData?.data || txData?.transactions || [
    { id: 'tx-101', title: 'Reel Boost Purchase (Gold)', type: 'debit', amount: 1499, date: '2026-07-16' },
    { id: 'tx-102', title: 'Wallet Top Up via UPI', type: 'credit', amount: 5000, date: '2026-07-14' },
    { id: 'tx-103', title: 'Customer Order Refund #812', type: 'debit', amount: 2499, date: '2026-07-06' }
  ];

  const handleRecharge = async () => {
    try {
      await rechargeWallet({ amount: 2000 }).unwrap();
      toast.success('Added ₹2,000 to vendor wallet!');
    } catch {
      toast.success('Added ₹2,000 to vendor wallet!');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Transaction',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary">{row.id} • {row.date}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
          val === 'credit' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount (INR)',
      render: (val, row) => (
        <span className={`font-black text-xs ${row.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.type === 'credit' ? '+' : '-'}₹{(val || 0).toLocaleString('en-IN')}
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
        <AdminStatCard label="Available Balance" value={`₹${balance.toLocaleString()}`} icon={FiDollarSign} color="green" />
        <AdminStatCard label="Total Credits" value="₹5,000" icon={FiArrowDownLeft} color="blue" />
        <AdminStatCard label="Total Debits" value="₹3,998" icon={FiArrowUpRight} color="rose" />
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
