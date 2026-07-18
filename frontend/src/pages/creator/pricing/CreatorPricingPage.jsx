import React, { useState } from 'react';
import { FiDollarSign, FiSave, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatorPricingPage() {
  const [reel1, setReel1] = useState('500');
  const [reel3, setReel3] = useState('1200');
  const [reel10, setReel10] = useState('3500');
  const [hourlyRate, setHourlyRate] = useState('1000');
  const [dayRate, setDayRate] = useState('6000');

  const handleSavePricing = (e) => {
    e.preventDefault();
    toast.success('Creator pricing rates updated!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiDollarSign className="text-emerald-400" />
          <span>Creator Pricing Tiers & Packages</span>
        </h2>
        <p className="text-xs text-slate-400">Set your reel bundle prices and hourly / day-wise shoot rates</p>
      </div>

      <form onSubmit={handleSavePricing} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Reel Promotion Bundles</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">1 Reel Package (₹)</label>
            <input
              type="number"
              value={reel1}
              onChange={(e) => setReel1(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">3 Reels Package (₹)</label>
            <input
              type="number"
              value={reel3}
              onChange={(e) => setReel3(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">10 Reels Package (₹)</label>
            <input
              type="number"
              value={reel10}
              onChange={(e) => setReel10(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 pt-2">Hourly / Day-wise Shoot Pricing</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hourly Shoot Rate (₹)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Day Shoot Rate (₹)</label>
            <input
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        <button type="submit" className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl shadow-lg">
          Save Pricing Settings
        </button>
      </form>
    </div>
  );
}
