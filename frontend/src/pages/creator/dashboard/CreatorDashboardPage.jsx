import React from 'react';
import { Link } from 'react-router-dom';
import { FiVideo, FiClock, FiDollarSign, FiStar, FiEye, FiShield } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import ActiveOffersPanel from '../../../components/offers/ActiveOffersPanel';
import { useGetCreatorDashboardQuery } from '../../../features/creator/creatorApi';

export default function CreatorDashboardPage() {
  const { data, isFetching } = useGetCreatorDashboardQuery(undefined, { pollingInterval: 300000 });

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

      {/* Active Special Offers & Deals */}
      <ActiveOffersPanel role="creator" />

      {/* Creator Verification Status Card */}
      <div className="glass rounded-3xl p-6 border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
            <FiShield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary font-display">Creator Identity Verification Center</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {statsData.verificationStatus || '⚪ Get Verified'}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">Verify your Mobile, WhatsApp, Aadhaar, PAN & Payout details to unlock 5x more brand offers & verified badge.</p>
          </div>
        </div>
        <Link
          to="/creator/verification"
          className="px-4 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex-shrink-0"
        >
          Open Verification Center →
        </Link>
      </div>
    </div>
  );
}
