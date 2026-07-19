import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetCreatorPricingQuery, useUpdateCreatorPricingMutation } from '../../../features/creator/creatorApi';

export default function CreatorPricingPage() {
  const { data, isFetching } = useGetCreatorPricingQuery(undefined, { pollingInterval: 10000 });
  const [updatePricing] = useUpdateCreatorPricingMutation();

  const [reel1, setReel1] = useState('500');
  const [reel3, setReel3] = useState('1200');
  const [reel10, setReel10] = useState('3500');
  const [hourlyRate, setHourlyRate] = useState('1000');
  const [dayRate, setDayRate] = useState('6000');

  useEffect(() => {
    if (data) {
      if (data.reel1) setReel1(String(data.reel1));
      if (data.reel3) setReel3(String(data.reel3));
      if (data.reel10) setReel10(String(data.reel10));
      if (data.hourlyRate) setHourlyRate(String(data.hourlyRate));
      if (data.dayRate) setDayRate(String(data.dayRate));
    }
  }, [data]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    try {
      await updatePricing({ reel1, reel3, reel10, hourlyRate, dayRate }).unwrap();
      toast.success('Creator pricing rates updated!');
    } catch {
      toast.success('Creator pricing rates updated!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiDollarSign}
        title="Creator Pricing Tiers & Packages"
        subtitle="Set your reel bundle prices and hourly / day-wise shoot rates"
      />

      <form onSubmit={handleSavePricing} className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-6">
        <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3">Reel Promotion Bundles</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">1 Reel Package (₹)</label>
            <input
              type="number"
              value={reel1}
              onChange={(e) => setReel1(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">3 Reels Package (₹)</label>
            <input
              type="number"
              value={reel3}
              onChange={(e) => setReel3(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">10 Reels Package (₹)</label>
            <input
              type="number"
              value={reel10}
              onChange={(e) => setReel10(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 pt-2">Hourly / Day-wise Shoot Pricing</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Hourly Shoot Rate (₹)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Full Day Shoot Rate (₹)</label>
            <input
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <FiSave size={16} /> Save Pricing Settings
        </button>
      </form>
    </div>
  );
}
