import React, { useState } from 'react';
import { FiDollarSign, FiArrowUpRight, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatorWalletPage() {
  const [balance, setBalance] = useState(42500);

  const [payouts, setPayouts] = useState([
    { id: 'p-1', vendor: 'Trends Fashion Store', project: '3 Promo Reels Shoot', amount: 3500, date: '2026-07-15', status: 'Completed' },
    { id: 'p-2', vendor: 'Sony Center Bandra', project: 'OLED TV Video Commercial', amount: 5000, date: '2026-07-10', status: 'Completed' }
  ]);

  const handleWithdraw = () => {
    toast.success('Payout withdrawal request for ₹42,500 submitted to bank UPI!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiDollarSign className="text-emerald-400" />
            <span>Creator Earnings & Payout Wallet</span>
          </h2>
          <p className="text-xs text-slate-400">Withdraw shoot earnings directly to your bank account or UPI ID</p>
        </div>

        <button onClick={handleWithdraw} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg">
          Withdraw to Bank / UPI
        </button>
      </div>

      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-6 rounded-3xl shadow-2xl">
        <span className="text-xs font-bold text-slate-400">Total Creator Earnings</span>
        <h3 className="text-3xl font-black text-white mt-1">₹{balance.toLocaleString()}</h3>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Project Earnings History</h3>
        <div className="space-y-3">
          {payouts.map((p) => (
            <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-white">{p.project}</h4>
                <p className="text-[11px] text-slate-400">Client: {p.vendor} ({p.date})</p>
              </div>
              <span className="font-black text-sm text-emerald-400">+₹{p.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
