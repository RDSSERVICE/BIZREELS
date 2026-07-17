import React, { useState } from 'react';
import { useGetTransactionsQuery, useRechargeWalletMutation } from './walletApi';
import { FiTrendingUp, FiPlus, FiArrowDownLeft, FiArrowUpRight, FiDollarSign, FiInfo } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const WalletTab = ({ user, refetchUser }) => {
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isRechargingModal, setIsRechargingModal] = useState(false);

  // Queries & Mutations
  const { data: transactionsRes, isLoading: isTransactionsLoading, refetch: refetchTransactions } = useGetTransactionsQuery();
  const [rechargeWallet, { isLoading: isRecharging }] = useRechargeWalletMutation();

  const transactions = transactionsRes?.data || [];

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      return toast.error('Please enter a valid amount.');
    }
    try {
      await rechargeWallet({ amount: parseFloat(rechargeAmount) }).unwrap();
      toast.success(`Successfully deposited ₹${rechargeAmount}!`);
      setIsRechargingModal(false);
      setRechargeAmount('');
      if (refetchUser) refetchUser();
      refetchTransactions();
    } catch (err) {
      toast.error('Recharge failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Wallet Balance Card */}
      <div className="gradient-purple p-6 rounded-2xl text-white shadow-premium flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <FiDollarSign className="w-64 h-64" />
        </div>
        <div className="flex flex-col gap-1.5 z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-purple-100">Wallet Balance</span>
          <h2 className="text-3xl font-black font-display tracking-tight">₹{user?.walletBalance || 0}</h2>
          <p className="text-[10px] text-brand-purple-200 mt-1">Use this balance to purchase plans or boost your Reels instantly.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRechargingModal(true)}
          className="px-5 py-3 bg-white text-brand-purple text-xs font-black rounded-xl hover:bg-slate-50 transition-all shadow-md flex items-center gap-2 z-10 cursor-pointer"
        >
          <FiPlus className="w-4 h-4" /> Deposit Funds
        </button>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider px-1">Ledger / Transactions History</h4>
        {isTransactionsLoading ? (
          <div className="py-12 flex justify-center"><Loader /></div>
        ) : transactions.length === 0 ? (
          <div className="glass p-12 text-center text-slate-500 rounded-2xl border border-white/50 shadow-glass flex flex-col items-center gap-2">
            <FiInfo className="w-6 h-6 text-brand-purple/50" />
            <p className="text-xs font-semibold">No recent transactions recorded.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/50 shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {transactions.map((tx) => {
                    const isDeposit = tx.type === 'deposit' || tx.type === 'credit';
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-slate-500">{tx._id}</td>
                        <td className="p-4">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 w-max shadow-sm
                            ${isDeposit ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
                          `}>
                            {isDeposit ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-brand-navy">{tx.description || 'Wallet Recharge'}</td>
                        <td className={`p-4 text-right font-black ${isDeposit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isDeposit ? '+' : '-'}₹{tx.amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      <AnimatePresence>
        {isRechargingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsRechargingModal(false)} />
            <div className="bg-white rounded-2xl shadow-modal border border-slate-100 w-full max-w-md p-6 z-10 relative flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-brand-navy font-display flex items-center gap-2">
                  <FiPlus className="w-5 h-5 text-brand-purple" /> Recharge Wallet Balance
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRechargingModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleRecharge} className="flex flex-col gap-4">
                <Input
                  label="Enter Deposit Amount (₹) *"
                  type="number"
                  placeholder="e.g. 500"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  required
                />
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-[10px] text-slate-500 leading-relaxed">
                  🔒 Secure transaction payment processor simulation. The amount will be instantly credited to your simulated wallet.
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRechargingModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isRecharging}
                    variant="primary"
                    className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                  >
                    {isRecharging ? 'Processing...' : 'Confirm Deposit'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletTab;
