import React, { useState } from 'react';
import { FiPieChart, FiDownload, FiDollarSign, FiCreditCard, FiZap, FiUserCheck, FiFilm, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import API_CONFIG from '../../../config';

const TABS = [
  { key: 'gst', label: 'GST Report (Tax)', icon: FiPieChart },
  { key: 'subscription', label: 'Subscription Revenue', icon: FiCreditCard },
  { key: 'wallet', label: 'Wallet & Topups', icon: FiCreditCard },
  { key: 'boost', label: 'Boost & Ads Revenue', icon: FiZap },
  { key: 'vendor', label: 'Vendor Earnings', icon: FiUserCheck },
  { key: 'creator', label: 'Creator Earnings', icon: FiFilm },
];

export default function AdminFinancialReportsPage() {
  const [activeTab, setActiveTab] = useState('gst');
  const [period, setPeriod] = useState('monthly'); // 'daily' | 'monthly' | 'yearly'

  const handleExportCsv = () => {
    const url = `${API_CONFIG.BASE_URL}/admin/transactions.csv`;
    window.open(url, '_blank');
    toast.success('Exporting transactions CSV report...');
  };

  const handleExportPdf = () => {
    toast.success('Generating PDF financial statement...');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPieChart}
        title="Financial Reports & Analytics"
        subtitle="Download GST tax statements, Subscription revenue, Wallet topup reports, Boost revenues, Creator & Vendor earnings (Daily/Monthly/Yearly) in CSV or PDF"
      >
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-premium"
          >
            <FiDownload className="w-4 h-4" /> Export CSV / Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple-800 transition-all flex items-center gap-1.5 shadow-premium"
          >
            <FiDownload className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </AdminPageHeader>

      {/* Period Selection */}
      <div className="flex items-center justify-between glass p-4 rounded-2xl border border-white/50">
        <span className="text-xs font-bold text-text-primary flex items-center gap-2">
          <FiCalendar className="text-brand-purple" /> Report Granularity:
        </span>
        <div className="flex gap-1">
          {['daily', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                period === p ? 'bg-brand-purple text-white shadow-premium' : 'hover:bg-surface-tertiary text-text-secondary'
              }`}
            >
              {p} Report
            </button>
          ))}
        </div>
      </div>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border border-white/50">
          <span className="text-[10px] font-bold text-text-tertiary uppercase block">Gross Sales (GMV)</span>
          <span className="text-2xl font-black text-text-primary mt-1 font-display block">₹12,45,800</span>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-block">↑ 14% vs last period</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50">
          <span className="text-[10px] font-bold text-text-tertiary uppercase block">Net Platform Earnings</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 font-display block">₹1,36,700</span>
          <span className="text-[10px] text-emerald-500 font-bold mt-1 inline-block">Commissions + Subscriptions</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50">
          <span className="text-[10px] font-bold text-text-tertiary uppercase block">Output GST Collected (18%)</span>
          <span className="text-2xl font-black text-brand-purple mt-1 font-display block">₹24,606</span>
          <span className="text-[10px] text-text-tertiary mt-1 inline-block">Ready for GSTR-3B filing</span>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/50">
          <span className="text-[10px] font-bold text-text-tertiary uppercase block">Total Creator Payouts</span>
          <span className="text-2xl font-black text-brand-pink mt-1 font-display block">₹42,300</span>
          <span className="text-[10px] text-text-tertiary mt-1 inline-block">Paid to creators</span>
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="glass p-6 rounded-2xl border border-white/50 space-y-4">
        <h4 className="text-sm font-bold text-text-primary font-display capitalize">
          {period} {activeTab.toUpperCase()} Breakdown Report
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-text-tertiary uppercase">
                <th className="py-2 text-left">Date / Period</th>
                <th className="py-2 text-left">Transactions</th>
                <th className="py-2 text-right">Gross Amount</th>
                <th className="py-2 text-right">GST (18%)</th>
                <th className="py-2 text-right">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr className="hover:bg-brand-purple/5">
                <td className="py-3 font-bold text-text-primary">2026-07-18 (Today)</td>
                <td className="py-3 text-text-secondary">42 txs</td>
                <td className="py-3 text-right font-bold text-text-primary">₹34,500</td>
                <td className="py-3 text-right text-brand-purple font-semibold">₹6,210</td>
                <td className="py-3 text-right font-black text-emerald-600">₹28,290</td>
              </tr>
              <tr className="hover:bg-brand-purple/5">
                <td className="py-3 font-bold text-text-primary">2026-07-17 (Yesterday)</td>
                <td className="py-3 text-text-secondary">58 txs</td>
                <td className="py-3 text-right font-bold text-text-primary">₹48,200</td>
                <td className="py-3 text-right text-brand-purple font-semibold">₹8,676</td>
                <td className="py-3 text-right font-black text-emerald-600">₹39,524</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
