import React from 'react';
import { FiVideo, FiClock, FiDollarSign, FiStar, FiEye, FiCheckCircle } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';

export default function CreatorDashboardPage() {
  const stats = [
    { label: 'Total Projects', value: '18', icon: FiVideo, color: 'purple', trend: 12 },
    { label: 'Pending Requests', value: '3', icon: FiClock, color: 'amber', trend: 0 },
    { label: 'Total Earnings', value: '₹42,500', icon: FiDollarSign, color: 'green', trend: 22 },
    { label: 'Rating Reviews', value: '4.9 ★ (24)', icon: FiStar, color: 'pink', trend: 5 },
    { label: 'Portfolio Views', value: '8,920', icon: FiEye, color: 'cyan', trend: 18 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      <AdminPageHeader
        icon={FiVideo}
        title="Creator Dashboard Overview"
        subtitle="Track vendor project requests, earnings, portfolio views, and reviews"
      />

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
    </div>
  );
}
