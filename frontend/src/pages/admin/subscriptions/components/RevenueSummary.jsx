import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { FiDollarSign, FiUsers, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { useGetSubscriptionRevenueQuery } from '../../../../features/admin/adminApi';

export default function RevenueSummary() {
  const { data: rev, isLoading } = useGetSubscriptionRevenueQuery(undefined, { pollingInterval: 10000 });

  const cards = [
    {
      label: 'Monthly Revenue',
      value: `₹${rev?.monthly_revenue?.toLocaleString('en-IN') || '0'}`,
      sub: `${rev?.monthly_transactions || 0} subscriptions paid`,
      icon: FiDollarSign,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple/10',
    },
    {
      label: 'Active Subscribers',
      value: rev?.active_subscribers?.toLocaleString('en-IN') || '0',
      sub: `${rev?.expired_subscribers || 0} expired subscribers`,
      icon: FiUsers,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Renewal Conversion',
      value: `${rev?.renewal_rate || 0}%`,
      sub: 'Lifetime renewal rate',
      icon: FiTrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Cancellation Rate',
      value: `${rev?.cancellation_rate || 0}%`,
      sub: 'Active churn / revokes',
      icon: FiCheckCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  const trendData = rev?.monthly_trend || [];
  const planData = rev?.top_plans || [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57', '#a4de79'];

  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass rounded-2xl p-5 border border-white/50 transition-all hover:border-brand-purple/30 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className={`text-2xl font-black mt-1 font-display block ${card.color}`}>
                  {isLoading ? '...' : card.value}
                </span>
                <span className="text-[10px] text-text-tertiary">{card.sub}</span>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg} group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/50 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Revenue Trend (Last 6 Months)</h3>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ background: '#1F2937', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-tertiary">No trend data available</div>
            )}
          </div>
        </div>

        {/* Plan distribution bar chart */}
        <div className="glass rounded-2xl p-5 border border-white/50 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Popular Plans Distribution</h3>
          <div className="h-64 w-full">
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ background: '#1F2937', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '10px' }}
                  />
                  <Bar dataKey="count" name="Active Members" radius={[8, 8, 0, 0]}>
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-text-tertiary">No plan distribution data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
