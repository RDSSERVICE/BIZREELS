import React from 'react';
import { FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatorSubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiCreditCard className="text-purple-400" />
          <span>Creator Membership Subscription</span>
        </h2>
        <p className="text-xs text-slate-400">Unlock zero-commission creator payouts, featured vendor marketplace placement, and AI tools</p>
      </div>

      <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 p-6 rounded-3xl shadow-2xl flex justify-between items-center">
        <div>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold uppercase px-2.5 py-1 rounded-full border border-purple-500/30">
            Active Plan
          </span>
          <h3 className="text-xl font-black text-white mt-2">Creator Pro Badge</h3>
          <p className="text-xs text-slate-400 mt-0.5">Zero Commission on Hire Deals • Top Marketplace Placement</p>
        </div>

        <button onClick={() => toast.success('Creator membership renewed!')} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg">
          Renew Pro Plan
        </button>
      </div>
    </div>
  );
}
