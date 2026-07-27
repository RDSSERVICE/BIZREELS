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
  const { data, isFetching } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 300000 });

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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard label="Total Projects" value={String(stats.totalProjects ?? 0)} icon={FiVideo} color="purple" trend={12} />
                <AdminStatCard label="Active Clients" value={String(stats.activeClients ?? 0)} icon={FiUsers} color="blue" />
                <AdminStatCard label="Avg Rating" value={`${stats.rating ?? '0.0'} ★`} icon={FiTrendingUp} color="amber" />
                <AdminStatCard label="Pending Requests" value={String(stats.pendingRequests ?? 0)} icon={FiTrendingUp} color="orange" />
              </div>
              <div className="glass rounded-2xl p-6 border border-white/50">
                <h3 className="text-sm font-bold text-text-primary font-display mb-2">Performance Summary</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your creator workspace is performing well! You have completed or are working on <strong>{stats.totalProjects ?? 0} projects</strong> with <strong>{stats.activeClients ?? 0} active brand clients</strong>. Keep maintaining a high rating of <strong>{stats.rating ?? '0.0'} ★</strong> to attract more high-budget offers.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AdminStatCard label="Portfolio Views" value={(stats.portfolioViews ?? 0).toLocaleString()} icon={FiEye} color="cyan" trend={18} />
                <AdminStatCard label="Portfolio Reels" value={String(stats.portfolioReels ?? 0)} icon={FiVideo} color="purple" />
                <AdminStatCard label="Portfolio Images" value={String(stats.portfolioImages ?? 0)} icon={FiTrendingUp} color="orange" />
              </div>
              <div className="glass rounded-2xl p-6 border border-white/50">
                <h3 className="text-sm font-bold text-text-primary font-display mb-2">Portfolio Growth</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your portfolio items have received a total of <strong>{(stats.portfolioViews ?? 0).toLocaleString()} views</strong> across <strong>{stats.portfolioReels ?? 0} sample reels</strong> and <strong>{stats.portfolioImages ?? 0} sample shoot images</strong>. Adding new reels regularly helps build engagement and client trust.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AdminStatCard label="Total Earnings" value={`₹${(stats.totalEarnings ?? 0).toLocaleString('en-IN')}`} icon={FiDollarSign} color="green" trend={22} />
                <AdminStatCard label="This Month" value={`₹${(stats.monthlyEarnings ?? 0).toLocaleString('en-IN')}`} icon={FiDollarSign} color="emerald" />
                <AdminStatCard label="Last Month" value={`₹${(stats.lastMonthEarnings ?? 0).toLocaleString('en-IN')}`} icon={FiDollarSign} color="blue" />
              </div>
              <div className="glass rounded-2xl p-6 border border-white/50">
                <h3 className="text-sm font-bold text-text-primary font-display mb-2">Earnings Report</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Your lifetime creator earnings are <strong>₹{(stats.totalEarnings ?? 0).toLocaleString('en-IN')}</strong>. This month you earned <strong>₹{(stats.monthlyEarnings ?? 0).toLocaleString('en-IN')}</strong> compared to <strong>₹{(stats.lastMonthEarnings ?? 0).toLocaleString('en-IN')}</strong> last month.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
