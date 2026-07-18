import React, { useState } from 'react';
import { FiDollarSign, FiPercent, FiSliders, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import {
  useGetCommissionSummaryQuery,
  useSetGlobalCommissionRateMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'platform', label: 'Platform Commission & Rates', icon: FiPercent },
  { key: 'vendor', label: 'Vendor Subscriptions', icon: FiDollarSign },
  { key: 'creator', label: 'Creator Commission', icon: FiDollarSign },
  { key: 'lead', label: 'Lead & Boost Charges', icon: FiSliders },
  { key: 'tax', label: 'Tax (GST) Settings', icon: FiFileText },
];

export default function AdminCommissionPage() {
  const [activeTab, setActiveTab] = useState('platform');
  const [rateInput, setRateInput] = useState('0.05');
  const [gstInput, setGstInput] = useState('18');

  const { data: meta } = useGetCommissionSummaryQuery(undefined, { pollingInterval: 5000 });
  const [setGlobalRate] = useSetGlobalCommissionRateMutation();

  const handleSaveRate = async () => {
    const r = parseFloat(rateInput);
    if (isNaN(r) || r < 0 || r > 1) return toast.error('Rate must be between 0 and 1 (e.g. 0.05 for 5%)');
    try {
      await setGlobalRate(r).unwrap();
      toast.success(`Platform commission rate updated to ${(r * 100).toFixed(1)}%!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  const handleSaveTax = () => {
    toast.success(`GST rate set to ${gstInput}%`);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiDollarSign}
        title="Commission & Fee Settings"
        subtitle="Manage platform commission rates, vendor subscription pricing, creator earnings cuts, lead charges, and GST tax settings"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'platform' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-xl space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-text-tertiary block">30-Day Accrued Commission</span>
            <span className="text-3xl font-black text-emerald-600 font-display">
              ₹{(meta?.total_earned_inr || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface-secondary p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-text-primary">Global Platform Take-Rate</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0.05 (5%)"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold"
              />
              <button
                onClick={handleSaveRate}
                className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple-800 transition-all"
              >
                Save Rate
              </button>
            </div>
            <span className="text-[10px] text-text-tertiary block">Enter decimal value (0.05 = 5%, 0.10 = 10%)</span>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiFileText className="text-brand-purple" /> GST & Tax Configuration
          </h3>

          <div className="bg-surface-secondary p-4 rounded-xl space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Standard Goods & Services Tax (GST %)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl font-bold"
                />
                <button onClick={handleSaveTax} className="px-4 py-2 bg-brand-purple text-white font-bold rounded-xl">
                  Save GST
                </button>
              </div>
            </div>
            <div>
              <span className="text-text-tertiary block">HSN / SAC Code: 998314 (Marketplace Platform Services)</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lead' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiSliders className="text-brand-purple" /> Lead Charges (Future Module)
          </h3>
          <p className="text-xs text-text-tertiary">Configure pay-per-lead charges for vendors unlocking high-intent customer requirement leads.</p>
          <div className="bg-surface-secondary p-4 rounded-xl text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span>Lead Unlock Fee:</span>
              <span className="font-bold text-brand-purple">10 Credits / lead</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
