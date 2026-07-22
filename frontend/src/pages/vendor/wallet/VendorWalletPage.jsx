import React, { useState } from 'react';
import { FiDollarSign, FiPlusCircle, FiArrowUpRight, FiArrowDownLeft, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import { useGetVendorWalletQuery, useGetWalletTransactionsQuery, useRechargeWalletMutation } from '../../../features/vendor/vendorApi';
import { api } from '../../../lib/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function VendorWalletPage() {
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, { pollingInterval: 5000 });
  const { data: txData, isFetching: isFetchingTx, refetch: refetchTx } = useGetWalletTransactionsQuery(undefined, { pollingInterval: 5000 });
  const [rechargeWallet] = useRechargeWalletMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);

  const balance = walletData?.balance ?? walletData?.walletBalance ?? 0;
  const transactions = Array.isArray(txData?.transactions) ? txData.transactions : Array.isArray(txData?.data) ? txData.data : Array.isArray(txData?.items) ? txData.items : Array.isArray(txData) ? txData : [];

  const totalCredits = transactions
    .filter((tx) => tx.type === 'credit' || tx.type === 'deposit')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const totalDebits = transactions
    .filter((tx) => tx.type === 'debit' || tx.type === 'payment' || tx.type === 'purchase')
    .reduce((acc, tx) => acc + (tx.amount || 0), 0);

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      // 1. Try Razorpay Order endpoint first
      const res = await api.post('/v1/payments/order', { amountPaise: numAmount * 100, purpose: 'wallet_topup' }).catch(() => null);

      if (res?.data?.ok && res?.data?.razorpay_order_id) {
        const sdkLoaded = await loadRazorpayScript();
        if (sdkLoaded && window.Razorpay) {
          const options = {
            key: res.data.key_id || 'rzp_test_mockKey',
            amount: res.data.amount_paise,
            currency: 'INR',
            name: 'BizReels Wallet Topup',
            description: `Recharge ₹${numAmount}`,
            order_id: res.data.razorpay_order_id,
            handler: async (response) => {
              try {
                await api.post('/v1/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                toast.success(`Razorpay Payment Successful! Added ₹${numAmount.toLocaleString('en-IN')} to wallet.`);
                setIsModalOpen(false);
                if (refetchWallet) refetchWallet();
                if (refetchTx) refetchTx();
              } catch (err) {
                toast.error('Payment verification failed');
              }
            },
            modal: { ondismiss: () => setLoading(false) },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          setLoading(false);
          return;
        }
      }

      // 2. Direct fallback recharge mutation
      await rechargeWallet({ amount: numAmount }).unwrap();
      toast.success(`Successfully recharged ₹${numAmount.toLocaleString('en-IN')}!`);
      setIsModalOpen(false);
      if (refetchWallet) refetchWallet();
      if (refetchTx) refetchTx();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to recharge wallet');
    } finally {
      setLoading(false);
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
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlusCircle size={16} /> Recharge Wallet
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-2xl max-w-md w-full space-y-5 bg-surface relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <FiDollarSign className="text-emerald-500" size={18} />
                Recharge Vendor Wallet
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                  Select or Enter Amount (₹)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['500', '1000', '2500'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        amount === preset
                          ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                          : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                      }`}
                    >
                      ₹{Number(preset).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="10"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div className="p-3 bg-brand-purple/5 border border-brand-purple/20 rounded-xl text-xs text-text-secondary flex items-center justify-between">
                <span>Payment Gateway</span>
                <span className="font-extrabold text-brand-purple flex items-center gap-1">
                  <FiCheck size={14} /> Razorpay Secured
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-text-tertiary hover:text-text-primary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 gradient-brand text-white text-xs font-bold rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString('en-IN')} via Razorpay`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
