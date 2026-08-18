import React, { useState } from 'react';
import { FiPlusCircle, FiArrowUpRight, FiArrowDownLeft, FiX, FiCheck } from 'react-icons/fi';
import { TbCurrencyRupee } from 'react-icons/tb';
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
  const { data: walletData, refetch: refetchWallet } = useGetVendorWalletQuery(undefined, { pollingInterval: 300000 });
  const { data: txData, isFetching: isFetchingTx, refetch: refetchTx } = useGetWalletTransactionsQuery(undefined, { pollingInterval: 300000 });
  const [rechargeWallet] = useRechargeWalletMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);

  const balance = walletData?.data?.balance ?? walletData?.data?.walletBalance ?? walletData?.balance ?? walletData?.walletBalance ?? 0;
  const rawTx = txData?.data || txData || [];
  const transactions = Array.isArray(rawTx) ? rawTx : rawTx.transactions || [];

  const totalCredits = transactions.filter(t => t.type === 'credit' || t.type === 'deposit').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalDebits = transactions.filter(t => t.type === 'debit' || t.type === 'withdrawal').reduce((acc, t) => acc + (t.amount || 0), 0);

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateway. Please check internet connection.');
        setLoading(false);
        return;
      }

      const res = await rechargeWallet({ amount: numAmount }).unwrap();
      const orderData = res.data || res;

      if (!orderData?.id || !orderData?.key) {
        toast.error('Payment initialization failed.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BizReels Vendor Wallet',
        description: `Wallet Recharge of ₹${numAmount}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            await api.post('/v1/vendor/wallet/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Successfully recharged ₹${numAmount} to your wallet!`);
            setIsModalOpen(false);
            if (typeof refetchWallet === 'function') refetchWallet();
            if (typeof refetchTx === 'function') refetchTx();
          } catch (verifyErr) {
            toast.error('Payment verification failed. Please contact support if amount was deducted.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled.');
            setLoading(false);
          },
        },
        theme: {
          color: '#241b15',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initiate recharge');
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Date & Time',
      render: (val, row) => {
        const rawDate = val || row?.created_at || row?.createdAt || row?.date || row?.timestamp;
        if (!rawDate) return <span className="text-slate-400 font-medium text-xs">N/A</span>;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return <span className="text-slate-400 font-medium text-xs">N/A</span>;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[#1a1a1a]">
              {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (val, row) => {
        const desc = val || row?.description || row?.admin_remarks || row?.meta?.plan_name || row?.title || row?.type || 'Transaction';
        const refId = row?.reference_id || row?.referenceId || row?.paymentId || row?.payment_id;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-xs text-[#1a1a1a]">{desc}</span>
            {refId && <span className="text-[10px] text-slate-400">Ref: {refId}</span>}
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (val, row) => {
        const typeStr = (val || row?.type || row?.credit_debit || 'debit').toLowerCase();
        const isCredit = typeStr === 'credit' || typeStr === 'deposit' || typeStr === 'recharge' || typeStr === 'referral_bonus' || row?.credit_debit === 'credit';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            isCredit
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {isCredit ? 'Credit' : 'Debit'}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount (INR)',
      render: (val, row) => {
        const amt = typeof val === 'number' ? val : (typeof row?.amount === 'number' ? row.amount : 0);
        const typeStr = (row?.type || row?.credit_debit || '').toLowerCase();
        const isCredit = typeStr === 'credit' || typeStr === 'deposit' || typeStr === 'recharge' || typeStr === 'referral_bonus' || row?.credit_debit === 'credit';
        return (
          <span className={`font-black text-xs ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isCredit ? '+' : '-'}₹{Math.abs(amt).toLocaleString('en-IN')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans p-2 sm:p-4 animate-fade-in">
      <AdminPageHeader
        icon={TbCurrencyRupee}
        title="Vendor Wallet & Balance"
        subtitle="Preload balance for reel boosts, ads, and manage order payouts & refunds"
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none"
        >
          <FiPlusCircle size={16} /> Recharge Wallet
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Available Balance" value={`₹${balance.toLocaleString('en-IN')}`} icon={TbCurrencyRupee} color="green" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#241b15] shadow-2xl max-w-md w-full space-y-4 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0 shadow-xs">
                  <TbCurrencyRupee size={18} />
                </div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide">
                  RECHARGE VENDOR WALLET
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition cursor-pointer border-none bg-transparent"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Select or Enter Amount (₹)
                </label>
                
                {/* Preset Amount Badges */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['500', '1000', '2500'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        amount === preset
                          ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                          : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb] hover:bg-white'
                      }`}
                    >
                      ₹{Number(preset).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="relative flex items-center bg-[#f8f4ec] rounded-xl border border-[#e3dccb] px-3.5 py-2.5 focus-within:border-[#d99a3d] focus-within:ring-1 focus-within:ring-[#d99a3d]/20 transition-all">
                  <span className="font-black text-[#d99a3d] text-sm mr-2">₹</span>
                  <input
                    type="number"
                    min="10"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-transparent text-sm font-black text-[#1a1a1a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Secured Gateway Pill */}
              <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between">
                <span>Payment Gateway</span>
                <span className="font-black text-[#1a1a1a] bg-white px-2.5 py-1 rounded-md border border-[#e3dccb] flex items-center gap-1">
                  <FiCheck size={14} className="text-emerald-600" /> Razorpay Secured
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-[#1a1a1a] transition cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer border-none"
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
