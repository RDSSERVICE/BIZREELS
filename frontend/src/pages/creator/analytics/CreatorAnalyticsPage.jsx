import React, { useState } from 'react';
import { FiBarChart2, FiEye, FiDollarSign, FiVideo } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import { useGetCreatorDashboardQuery } from '../../../features/creator/creatorApi';
import PerformanceOverviewTab from './PerformanceOverviewTab';
import PortfolioAnalyticsTab from './PortfolioAnalyticsTab';
import EarningsBreakdownTab from './EarningsBreakdownTab';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorAnalyticsPage() {
  const { bi } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isFetching } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 300000 });

  const TABS = [
    { key: 'overview', label: bi('Performance Overview', 'प्रदर्शन अवलोकन'), icon: FiBarChart2 },
    { key: 'portfolio', label: bi('Portfolio Analytics', 'पोर्टफोलियो एनालिटिक्स'), icon: FiVideo },
    { key: 'earnings', label: bi('Earnings Breakdown', 'कमाई का विवरण'), icon: FiDollarSign },
  ];

  const stats = data?.data || data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={FiBarChart2}
        title={bi('Creator Analytics & Performance', 'क्रिएटर एनालिटिक्स और प्रदर्शन (Analytics & Performance)')}
        subtitle={bi('Real-time analytics for portfolio views, project engagement, and earnings trends', 'पोर्टफोलियो दृश्य, प्रोजेक्ट जुड़ाव और कमाई के रुझान का वास्तविक समय एनालिटिक्स')}
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

