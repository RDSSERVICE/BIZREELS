import React, { useState } from 'react';
import { FiZap, FiPlus, FiClock, FiRefreshCw, FiCheck, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorReelBoostPage() {
  const [activeBoosts, setActiveBoosts] = useState([
    { id: 'b1', reelTitle: 'Hot Summer Fashion Collection', plan: 'Gold Boost (7 Days)', remainingDays: 5, status: 'Active', cost: 1499 }
  ]);

  const [boostHistory, setBoostHistory] = useState([
    { id: 'b0', reelTitle: 'Electronics Mega Sale Promo', plan: 'Silver Boost (3 Days)', date: '2026-06-10', cost: 699, status: 'Completed' }
  ]);

  const handleBuyBoost = (planName, cost) => {
    const newB = {
      id: Date.now().toString(),
      reelTitle: 'Selected Reel Promotion',
      plan: planName,
      remainingDays: planName.includes('7') ? 7 : planName.includes('30') ? 30 : 3,
      status: 'Active',
      cost
    };
    setActiveBoosts([newB, ...activeBoosts]);
    toast.success(`Purchased ${planName}! Reel is now boosted to top feed views.`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiZap className="text-amber-400" />
            <span>Reel Boost Revenue Module</span>
          </h2>
          <p className="text-xs text-slate-400">Boost your reels to reach 10x more customers in your city & maximize sales leads</p>
        </div>
      </div>

      {/* Active Boosts */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Active Reel Boosts</h3>
        {activeBoosts.map((b) => (
          <div key={b.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {b.plan}
              </span>
              <h4 className="font-bold text-xs text-white mt-1">{b.reelTitle}</h4>
              <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <FiClock size={12} /> {b.remainingDays} days remaining
              </p>
            </div>

            <button
              onClick={() => toast.success('Boost renewed for +7 days!')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <FiRefreshCw size={14} />
              <span>Renew Boost</span>
            </button>
          </div>
        ))}
      </div>

      {/* Boost Pricing Packages */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Buy New Reel Boost Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Silver Boost</h4>
              <p className="text-2xl font-black text-white mt-2">₹699 <span className="text-xs font-medium text-slate-400">/ 3 Days</span></p>
              <ul className="text-xs text-slate-400 mt-3 space-y-2">
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> 3x Extra Feed Impressions</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> City Location Tag Highlight</li>
              </ul>
            </div>
            <button onClick={() => handleBuyBoost('Silver Boost (3 Days)', 699)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl">Buy 3-Day Boost</button>
          </div>

          <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col justify-between relative overflow-hidden">
            <span className="absolute top-3 right-3 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Popular</span>
            <div>
              <h4 className="text-sm font-bold text-indigo-300">Gold Boost</h4>
              <p className="text-2xl font-black text-white mt-2">₹1,499 <span className="text-xs font-medium text-slate-400">/ 7 Days</span></p>
              <ul className="text-xs text-slate-300 mt-3 space-y-2">
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> 10x Feed Impressions</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Direct WhatsApp Lead Button</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Top Search Placement</li>
              </ul>
            </div>
            <button onClick={() => handleBuyBoost('Gold Boost (7 Days)', 1499)} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-lg">Buy 7-Day Boost</button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">Platinum Boost</h4>
              <p className="text-2xl font-black text-white mt-2">₹4,999 <span className="text-xs font-medium text-slate-400">/ 30 Days</span></p>
              <ul className="text-xs text-slate-400 mt-3 space-y-2">
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Month-long Top Reel Boost</li>
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Dedicated Lead Collector</li>
              </ul>
            </div>
            <button onClick={() => handleBuyBoost('Platinum Boost (30 Days)', 4999)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl">Buy 30-Day Boost</button>
          </div>
        </div>
      </div>
    </div>
  );
}
