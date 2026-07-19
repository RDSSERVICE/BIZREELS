import React from 'react';
import { FiVideo, FiClock, FiDollarSign, FiStar, FiEye } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetCreatorDashboardQuery } from '../../../features/creator/creatorApi';

export default function CreatorDashboardPage() {
  const { data, isFetching } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 5000 });

  const statsData = data?.data || data || {};

  const stats = [
    { label: 'Total Projects', value: String(statsData.totalProjects ?? 0), icon: FiVideo, color: 'purple', trend: 12 },
    { label: 'Pending Requests', value: String(statsData.pendingRequests ?? 0), icon: FiClock, color: 'amber', trend: 0 },
    { label: 'Total Earnings', value: `₹${(statsData.totalEarnings ?? 0).toLocaleString('en-IN')}`, icon: FiDollarSign, color: 'green', trend: 22 },
    { label: 'Rating Reviews', value: `${statsData.rating ?? '0.0'} ★ (${statsData.reviewCount ?? 0})`, icon: FiStar, color: 'pink', trend: 5 },
    { label: 'Portfolio Views', value: (statsData.portfolioViews ?? 0).toLocaleString(), icon: FiEye, color: 'cyan', trend: 18 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <AdminPageHeader
        icon={FiVideo}
        title="Creator Dashboard Overview"
        subtitle="Track vendor project requests, earnings, portfolio views, and reviews"
      />

      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s, idx) => (
            <AdminStatCard
              key={idx}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
              trend={s.trend}
            />
          ))}
        </div>
      )}
    </div>
  );
}
