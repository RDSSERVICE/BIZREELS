import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FiDollarSign, FiPercent, FiTrendingUp } from 'react-icons/fi';
import { useGetCommissionAnalyticsQuery } from '../../../../features/admin/adminApi';

export default function CommissionAnalytics() {
  const [periodDays, setPeriodDays] = useState(30);
  const { data, isLoading } = useGetCommissionAnalyticsQuery({ period_days: periodDays }, { pollingInterval: 10000 });

  const totalEarnedInr = data?.total_earned_inr || 0;
  const accruedStats = data?.stats?.accrued || { total_paise: 0, count: 0 };
  const paidOutStats = data?.stats?.paid_out || { total_paise: 0, count: 0 };

  const cards = [
    {
      label: 'Accrued Commissions',
      value: `₹${Math.round((accruedStats.total_paise || 0) / 100).toLocaleString('en-IN')}`,
      sub: `${accruedStats.count || 0} pending orders`,
      icon: FiDollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Paid Commissions',
      value: `₹${Math.round((paidOutStats.total_paise || 0) / 100).toLocaleString('en-IN')}`,
      sub: `${paidOutStats.count || 0} vendor payments`,
      icon: FiDollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Platform Commission Revenue',
      value: `₹${totalEarnedInr.toLocaleString('en-IN')}`,
      sub: 'Platform fee earnings',
      icon: FiTrendingUp,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple/10',
    },
  ];

  const trendData = data?.trend || [];

  return (
    <div className="space-y-6 text-xs animate-fade-in font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Commission Overview</h2>
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(parseInt(e.target.value))}
          className="px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
          <option value={365}>Last Year</option>
        </select>
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs transition-all hover:border-[#1a1a1a] group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className={`text-2xl font-black mt-1.5 block ${card.color === 'text-brand-purple' ? 'text-[#1a1a1a]' : card.color}`}>
                  {isLoading ? '...' : card.value}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{card.sub}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] text-[#d99a3d] group-hover:scale-105 transition-transform">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
        <h3 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">Commission Revenue Trend</h3>
        <div className="h-72 w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3dccb" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e3dccb" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#e3dccb" />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #e3dccb', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="commission" name="Fee Revenue (₹)" stroke="#d99a3d" strokeWidth={3} dot={{ r: 4, fill: '#d99a3d' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 font-bold">No trend data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
