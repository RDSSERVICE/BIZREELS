import React from 'react';
import { FiCreditCard, FiCheck, FiRefreshCw, FiClock, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorSubscriptionPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCreditCard className="text-pink-400" />
            <span>Vendor Subscription & Billing</span>
          </h2>
          <p className="text-xs text-slate-400">Manage your active business plan, renew membership, and download invoices</p>
        </div>
      </div>

      {/* Current Active Plan */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-500/30">
            Active Plan
          </span>
          <h3 className="text-xl font-black text-white mt-2">Vendor Growth Pro Plan</h3>
          <p className="text-xs text-slate-400 mt-1">Unlimited Product Listings • 10 Boosted Reels / Mo • Priority Lead Placement</p>
        </div>

        <button
          onClick={() => toast.success('Plan renewed for another 12 months!')}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
        >
          <FiRefreshCw size={15} />
          <span>Renew Subscription</span>
        </button>
      </div>

      {/* Upgrade Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <h4 className="font-bold text-sm text-white">Pro Monthly Plan</h4>
          <p className="text-2xl font-black text-white">₹1,999 <span className="text-xs font-normal text-slate-400">/ month</span></p>
          <button onClick={() => toast.success('Upgraded to Pro Monthly!')} className="w-full py-2 bg-slate-800 text-white font-bold text-xs rounded-xl">Switch to Monthly</button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <h4 className="font-bold text-sm text-white">Enterprise Annual Plan</h4>
          <p className="text-2xl font-black text-white">₹18,999 <span className="text-xs font-normal text-slate-400">/ year</span></p>
          <button onClick={() => toast.success('Upgraded to Enterprise Annual!')} className="w-full py-2 bg-pink-600 text-white font-bold text-xs rounded-xl">Upgrade Annual (Save 20%)</button>
        </div>
      </div>
    </div>
  );
}
