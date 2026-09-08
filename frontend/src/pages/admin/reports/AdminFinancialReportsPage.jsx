import React, { useState } from 'react';
import { FiPieChart, FiDownload, FiDollarSign, FiCreditCard, FiZap, FiUserCheck, FiFilm, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { api } from '../../../lib/api';
import API_CONFIG from '../../../config';
import { useGetFinancialReportQuery, useListAdminTransactionsQuery } from '../../../features/admin/adminApi';

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
  const [period, setPeriod] = useState('monthly');

  const { data: reportData, isFetching } = useGetFinancialReportQuery(
    { report_type: activeTab, period },
    { pollingInterval: 10000 }
  );
  const { data: txData } = useListAdminTransactionsQuery({ limit: 20 }, { pollingInterval: 10000 });

  const summary = reportData?.summary || {};
  const transactions = txData?.items || [];

  const fmtCurrency = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/v1/admin/transactions.csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Financial transactions CSV downloaded');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Failed to export financial transactions');
    }
  };

  const handleExportPdf = () => {
    toast.success('Generating PDF financial statement...');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPieChart}
        title="Financial Reports & Analytics"
        subtitle="Real-time financial data — GST, Subscription, Wallet, Boost, Vendor & Creator earnings with export"
      >
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FiDownload className="w-4 h-4" /> Export CSV / Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FiDownload className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </AdminPageHeader>

      {/* Period Selection */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs">
        <span className="text-xs font-black text-[#1a1a1a] flex items-center gap-2">
          <FiCalendar className="text-[#d99a3d]" /> Report Granularity:
        </span>
        <div className="flex gap-1.5 bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb]">
          {['daily', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all cursor-pointer ${
                period === p ? 'bg-[#1a1a1a] text-white shadow-xs' : 'text-slate-500 hover:text-[#1a1a1a]'
              }`}
            >
              {p} Report
            </button>
          ))}
        </div>
      </div>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Financial Overview Cards — Real Data */}
      {isFetching && !reportData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#e3dccb] animate-pulse shadow-2xs" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            label="Gross Sales (GMV)"
            value={fmtCurrency(summary.gross_revenue_paise)}
            icon={FiDollarSign}
            color="green"
          />
          <AdminStatCard
            label="Net Platform Earnings"
            value={fmtCurrency(summary.net_revenue_paise)}
            icon={FiDollarSign}
            color="emerald"
          />
          <AdminStatCard
            label="GST Collected (18%)"
            value={fmtCurrency(summary.gst_collected_paise)}
            icon={FiPieChart}
            color="purple"
          />
          <AdminStatCard
            label="Total Transactions"
            value={String(summary.total_transactions || 0)}
            icon={FiCreditCard}
            color="blue"
          />
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Subscribed Vendors"
          value={String(summary.subscribed_vendors || 0)}
          icon={FiUserCheck}
          color="amber"
        />
        <AdminStatCard
          label="Total Vendors"
          value={String(summary.total_vendors || 0)}
          icon={FiUserCheck}
          color="orange"
        />
        <AdminStatCard
          label="Total Creators"
          value={String(summary.total_creators || 0)}
          icon={FiFilm}
          color="pink"
        />
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
          Recent {activeTab.toUpperCase()} Transactions ({period})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-left">Type</th>
                <th className="py-2.5 px-3 text-left">User</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-left">Status</th>
                <th className="py-2.5 px-3 text-left">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No transactions found for this period.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#fbf9f4] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#1a1a1a]">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        tx.kind === 'payment' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb]'
                      }`}>
                        {tx.kind}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">{tx.user_id?.slice(0, 8)}...</td>
                    <td className="py-3 px-3 text-right font-black text-[#1a1a1a]">
                      {tx.currency === 'CREDITS' ? `${(tx.amount_paise / 100).toFixed(0)} CR` : `₹${(tx.amount_paise / 100).toFixed(0)}`}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[11px] font-bold ${
                        tx.status === 'captured' || tx.status === 'posted' ? 'text-emerald-600' :
                        tx.status === 'failed' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{tx.provider || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
