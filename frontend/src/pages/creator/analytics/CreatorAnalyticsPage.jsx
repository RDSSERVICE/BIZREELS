import React, { useState } from 'react';
import { FiBarChart2, FiEye, FiDollarSign, FiVideo } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { useGetCreatorDashboardQuery } from '../../../features/creator/creatorApi';
import PerformanceOverviewTab from './PerformanceOverviewTab';
import PortfolioAnalyticsTab from './PortfolioAnalyticsTab';
import EarningsBreakdownTab from './EarningsBreakdownTab';

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
          {activeTab === 'overview' && <PerformanceOverviewTab stats={stats} />}
          {activeTab === 'portfolio' && <PortfolioAnalyticsTab stats={stats} />}
          {activeTab === 'earnings' && <EarningsBreakdownTab stats={stats} />}
        </>
      )}
    </div>
  );
}

