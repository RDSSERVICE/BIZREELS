import React from 'react';
import { FiPieChart, FiEye, FiPackage, FiTool, FiMousePointer, FiPhone, FiMessageCircle, FiUserCheck, FiUsers } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetVendorAnalyticsQuery } from '../../../features/vendor/vendorApi';

export default function VendorAnalyticsPage() {
  const { data, isFetching } = useGetVendorAnalyticsQuery(undefined, { pollingInterval: 5000 });

  const analytics = data || {};

  const metrics = [
    { label: 'Reel Views', value: (analytics.reelViews || 0).toLocaleString(), icon: FiEye, color: 'pink' },
    { label: 'Product Views', value: (analytics.productViews || 0).toLocaleString(), icon: FiPackage, color: 'purple' },
    { label: 'Service Views', value: (analytics.serviceViews || 0).toLocaleString(), icon: FiTool, color: 'blue' },
    { label: 'Clicks on Offers', value: (analytics.offerClicks || 0).toLocaleString(), icon: FiMousePointer, color: 'amber' },
    { label: 'Direct Phone Calls', value: (analytics.phoneCalls || 0).toLocaleString(), icon: FiPhone, color: 'green' },
    { label: 'WhatsApp Clicks', value: (analytics.whatsappClicks || 0).toLocaleString(), icon: FiMessageCircle, color: 'green' },
    { label: 'Profile Visits', value: (analytics.profileVisits || 0).toLocaleString(), icon: FiUserCheck, color: 'cyan' },
    { label: 'Shop Followers', value: (analytics.followers || 0).toLocaleString(), icon: FiUsers, color: 'rose' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPieChart}
        title="Vendor Analytics & Insights"
        subtitle="Track reel views, product clicks, phone calls, WhatsApp leads, and profile visits"
      />

      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m, idx) => (
            <AdminStatCard
              key={idx}
              label={m.label}
              value={String(m.value)}
              icon={m.icon}
              color={m.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
