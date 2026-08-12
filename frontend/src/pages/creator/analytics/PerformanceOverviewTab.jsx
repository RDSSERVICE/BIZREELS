import React from 'react';
import { FiVideo, FiUsers, FiTrendingUp } from 'react-icons/fi';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';

export default function PerformanceOverviewTab({ stats = {} }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Projects"
          value={String(stats.totalProjects ?? 0)}
          icon={FiVideo}
          color="purple"
          trend={stats.projectsTrend}
        />
        <AdminStatCard
          label="Active Clients"
          value={String(stats.activeClients ?? 0)}
          icon={FiUsers}
          color="blue"
        />
        <AdminStatCard
          label="Avg Rating"
          value={`${stats.rating ?? '0.0'} ★`}
          icon={FiTrendingUp}
          color="amber"
          trend={stats.ratingTrend}
        />
        <AdminStatCard
          label="Pending Requests"
          value={String(stats.pendingRequests ?? 0)}
          icon={FiTrendingUp}
          color="orange"
          trend={stats.pendingRequestsTrend}
        />
      </div>
      <div className="glass rounded-2xl p-6 border border-white/50">
        <h3 className="text-sm font-bold text-text-primary font-display mb-2">Performance Summary</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Your creator workspace is performing well! You have completed or are working on <strong>{stats.totalProjects ?? 0} projects</strong> with <strong>{stats.activeClients ?? 0} active brand clients</strong>. Keep maintaining a high rating of <strong>{stats.rating ?? '0.0'} ★</strong> to attract more high-budget offers.
        </p>
      </div>
    </div>
  );
}
