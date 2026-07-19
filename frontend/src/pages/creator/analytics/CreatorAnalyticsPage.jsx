import React, { useState } from 'react';
import { FiBarChart2, FiEye, FiUsers, FiDollarSign, FiVideo, FiTrendingUp } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { useGetCreatorDashboardQuery } from '../../../features/creator/creatorApi';

const TABS = [
  { key: 'overview', label: 'Performance Overview', icon: FiBarChart2 },
  { key: 'portfolio', label: 'Portfolio Analytics', icon: FiVideo },
  { key: 'earnings', label: 'Earnings Breakdown', icon: FiDollarSign },
];

export default function CreatorAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isFetching } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 5000 });

  const stats = data?.data || data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <AdminPageHeader
        icon={FiBarChart2}
        title="Creator Analytics"
        subtitle="Real-time analytics for portfolio views, project engagement, and earnings trends"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminStatCard label="Portfolio Views" value={(stats.portfolioViews ?? 0).toLocaleString()} icon={FiEye} color="cyan" trend={18} />
            <AdminStatCard label="Total Projects" value={String(stats.totalProjects ?? 0)} icon={FiVideo} color="purple" trend={12} />
            <AdminStatCard label="Total Earnings" value={`₹${(stats.totalEarnings ?? 0).toLocaleString('en-IN')}`} icon={FiDollarSign} color="green" trend={22} />
            <AdminStatCard label="Active Clients" value={String(stats.activeClients ?? 0)} icon={FiUsers} color="blue" />
            <AdminStatCard label="Avg Rating" value={`${stats.rating ?? '0.0'} ★`} icon={FiTrendingUp} color="amber" />
            <AdminStatCard label="Pending Requests" value={String(stats.pendingRequests ?? 0)} icon={FiTrendingUp} color="orange" />
          </div>

          {activeTab === 'earnings' && (
            <div className="glass rounded-2xl p-6 border border-white/50 space-y-4">
              <h3 className="text-sm font-bold text-text-primary font-display">Earnings Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-secondary p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">This Month</span>
                  <span className="text-xl font-black text-emerald-600 font-display">₹{((stats.monthlyEarnings ?? 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-surface-secondary p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Last Month</span>
                  <span className="text-xl font-black text-text-primary font-display">₹{((stats.lastMonthEarnings ?? 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-surface-secondary p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Lifetime Total</span>
                  <span className="text-xl font-black text-brand-purple font-display">₹{((stats.totalEarnings ?? 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="glass rounded-2xl p-6 border border-white/50 space-y-4">
              <h3 className="text-sm font-bold text-text-primary font-display">Portfolio Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-secondary p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Portfolio Reels</span>
                  <span className="text-xl font-black text-brand-purple font-display">{stats.portfolioReels ?? 0}</span>
                </div>
                <div className="bg-surface-secondary p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase block">Portfolio Images</span>
                  <span className="text-xl font-black text-brand-orange font-display">{stats.portfolioImages ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
