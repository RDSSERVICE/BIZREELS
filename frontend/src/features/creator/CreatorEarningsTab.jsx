import React, { useState } from 'react';
import { FiDollarSign, FiCreditCard, FiArrowUpRight, FiClock, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreatorEarningsTab = ({ user }) => {
  const [earnings, setEarnings] = useState({
    total: 18500,
    pending: 4500,
    available: user?.walletBalance || 5000,
  });

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState(user?.creatorProfile?.upi || '');

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid withdrawal amount.');
    if (amount > earnings.available) return toast.error('Insufficient available balance.');
    if (!upiId) return toast.error('Please enter a valid UPI address.');

    toast.success(`Withdrawal request for ₹${amount} sent to bank account via UPI!`);
    setWithdrawAmount('');
  };

  const paymentHistory = [
    { id: 'pay_001', type: 'Credit (Sponsor Reel)', amount: 5000, date: '2026-07-15', status: 'settled' },
    { id: 'pay_002', type: 'Credit (Direct Hire)', amount: 3500, date: '2026-07-12', status: 'settled' },
    { id: 'pay_003', type: 'Withdrawal (UPI Transfer)', amount: 4000, date: '2026-07-08', status: 'settled' },
    { id: 'pay_004', type: 'Credit (UGC Review)', amount: 1500, date: '2026-07-01', status: 'settled' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Earnings</span>
            <h4 className="text-2xl font-black text-brand-navy mt-1.5 font-display">₹{earnings.total.toLocaleString()}</h4>
          </div>
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl">
            <FiDollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending Clearance</span>
            <h4 className="text-2xl font-black text-brand-orange mt-1.5 font-display">₹{earnings.pending.toLocaleString()}</h4>
          </div>
          <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-2xl">
            <FiClock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Available to Withdraw</span>
            <h4 className="text-2xl font-black text-emerald-500 mt-1.5 font-display">₹{earnings.available.toLocaleString()}</h4>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <FiCreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Withdrawal form */}
        <form onSubmit={handleWithdraw} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <FiArrowUpRight className="text-emerald-500" /> Payout Request (Withdrawal)
          </h4>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Withdrawal Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-[42px]"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">UPI Address (for instant transfer)</label>
              <input
                type="text"
                placeholder="e.g. aditi@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-[42px]"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-brand-purple hover:bg-brand-purple-800 text-white text-xs font-bold rounded-xl shadow-premium transition-all cursor-pointer text-center"
          >
            Submit Withdrawal Request
          </button>
        </form>

        {/* Payment history */}
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">Payout History</h4>
          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-56 pr-1">
            {paymentHistory.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-brand-navy">{item.type}</span>
                  <span className="text-[9px] text-slate-400">{item.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-brand-navy font-display">₹{item.amount}</span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5 flex items-center justify-end gap-0.5">
                    <FiCheck className="w-3 h-3" /> {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorEarningsTab;
