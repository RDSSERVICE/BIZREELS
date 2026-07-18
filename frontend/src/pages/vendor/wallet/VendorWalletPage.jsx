import React, { useState } from 'react';
import { FiDollarSign, FiPlusCircle, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorWalletPage() {
  const [balance, setBalance] = useState(4850);

  const [transactions, setTransactions] = useState([
    { id: 'tx-101', title: 'Reel Boost Purchase (Gold)', type: 'debit', amount: 1499, date: '2026-07-16' },
    { id: 'tx-102', title: 'Wallet Top Up via UPI', type: 'credit', amount: 5000, date: '2026-07-14' },
    { id: 'tx-103', title: 'Customer Order Refund #812', type: 'debit', amount: 2499, date: '2026-07-06' }
  ]);

  const handleRecharge = () => {
    setBalance(balance + 2000);
    setTransactions([
      { id: `tx-${Date.now()}`, title: 'Wallet Quick Top Up', type: 'credit', amount: 2000, date: 'Just now' },
      ...transactions
    ]);
    toast.success('Added ₹2,000 to vendor wallet!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiDollarSign className="text-emerald-400" />
            <span>Vendor Wallet & Payout Balance</span>
          </h2>
          <p className="text-xs text-slate-400">Preload balance for reel boosts, ads, and manage order payout refunds</p>
        </div>

        <button
          onClick={handleRecharge}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
        >
          <FiPlusCircle size={16} />
          <span>Recharge Wallet (+₹2,000)</span>
        </button>
      </div>

      {/* Balance Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl shadow-2xl">
        <span className="text-xs font-bold text-slate-400">Available Wallet Balance</span>
        <h3 className="text-3xl font-black text-white mt-1">₹{balance.toLocaleString()}</h3>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Recent Wallet Transactions</h3>
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-white">{t.title}</h4>
                <span className="text-[10px] text-slate-500">{t.id} • {t.date}</span>
              </div>
              <span className={`font-black text-sm ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
