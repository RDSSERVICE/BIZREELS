import React from 'react';
import { FiDollarSign } from 'react-icons/fi';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';

export default function EarningsBreakdownTab({ stats = {} }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Earnings"
          value={`₹${(stats.totalEarnings ?? 0).toLocaleString('en-IN')}`}
          icon={FiDollarSign}
          color="green"
          trend={stats.earningsTrend}
        />
        <AdminStatCard
          label="This Month"
          value={`₹${(stats.monthlyEarnings ?? 0).toLocaleString('en-IN')}`}
          icon={FiDollarSign}
          color="emerald"
        />
        <AdminStatCard
          label="Last Month"
          value={`₹${(stats.lastMonthEarnings ?? 0).toLocaleString('en-IN')}`}
          icon={FiDollarSign}
          color="blue"
        />
      </div>
      <div className="glass rounded-2xl p-6 border border-white/50">
        <h3 className="text-sm font-bold text-text-primary font-display mb-2">Earnings Report</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your lifetime creator earnings are <strong>₹{(stats.totalEarnings ?? 0).toLocaleString('en-IN')}</strong>. This month you earned <strong>₹{(stats.monthlyEarnings ?? 0).toLocaleString('en-IN')}</strong> compared to <strong>₹{(stats.lastMonthEarnings ?? 0).toLocaleString('en-IN')}</strong> last month.
        </p>
      </div>
    </div>
  );
}
