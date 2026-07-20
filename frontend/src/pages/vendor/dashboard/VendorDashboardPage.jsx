import React from 'react';
import {
  FiPackage, FiTool, FiVideo, FiEye, FiUsers, FiInbox,
  FiShoppingCart, FiDollarSign, FiZap, FiGrid
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import {
  useGetVendorDashboardQuery,
  useGetVendorLeadsQuery,
  useGetVendorBoostsQuery,
} from '../../../features/vendor/vendorApi';

export default function VendorDashboardPage() {
  const { data: dashboardRes, isLoading } = useGetVendorDashboardQuery(undefined, { pollingInterval: 300000 });
  const { data: leadsRes } = useGetVendorLeadsQuery(undefined, { pollingInterval: 300000 });
  const { data: boostsRes } = useGetVendorBoostsQuery(undefined, { pollingInterval: 300000 });

  const metrics = dashboardRes?.data || {};
  const leads = Array.isArray(leadsRes?.data) ? leadsRes.data : Array.isArray(leadsRes) ? leadsRes : [];
  const boosts = Array.isArray(boostsRes?.active) ? boostsRes.active : Array.isArray(boostsRes?.data) ? boostsRes.data : [];

  const stats = [
    { label: 'Total Products', value: metrics.activeListings ?? 0, icon: FiPackage, color: 'purple', trend: 14 },
    { label: 'Total Services', value: metrics.totalServices ?? 0, icon: FiTool, color: 'blue', trend: 8 },
    { label: 'Total Reels', value: metrics.totalReels ?? 0, icon: FiVideo, color: 'violet', trend: 20 },
    { label: 'Total Views', value: (metrics.totalViews || 0).toLocaleString(), icon: FiEye, color: 'amber', trend: 18 },
    { label: 'Followers', value: (metrics.followers || 0).toLocaleString(), icon: FiUsers, color: 'green', trend: 12 },
    { label: 'Enquiries', value: metrics.leadEnquiries ?? 0, icon: FiInbox, color: 'cyan', trend: 5 },
    { label: 'Order Requests', value: metrics.totalOrders ?? 0, icon: FiShoppingCart, color: 'indigo', trend: 15 },
    { label: 'Revenue', value: `₹${(metrics.totalSales || 0).toLocaleString()}`, icon: FiDollarSign, color: 'teal', trend: 24 },
    { label: 'Active Boosts', value: `${boosts.length} Reels`, icon: FiZap, color: 'orange', trend: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <AdminPageHeader
        icon={FiGrid}
        title="Vendor Overview Dashboard"
        subtitle="Real-time performance analytics across products, services, reels, and lead conversions"
      >
        <div className="flex items-center gap-2">
          <Link
            to="/vendor/reels"
            className="px-4 py-2.5 rounded-xl bg-brand-purple text-white font-bold text-xs shadow-premium hover:bg-brand-purple/90 transition flex items-center gap-1.5"
          >
            <FiVideo size={16} />
            <span>Create Reel / AI Ad</span>
          </Link>
          <Link
            to="/vendor/boost"
            className="px-4 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiZap size={16} />
            <span>Buy Reel Boost</span>
          </Link>
        </div>
      </AdminPageHeader>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <AdminStatCard
            key={idx}
            label={stat.label}
            value={isLoading ? '...' : stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Quick Action Tables & Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiInbox className="text-brand-orange" />
              <span>Recent Customer Enquiries</span>
            </h3>
            <Link to="/vendor/leads" className="text-xs text-brand-purple font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-4">No recent enquiries received.</p>
            ) : (
              leads.slice(0, 4).map((l, i) => (
                <div key={l._id || i} className="glass p-3.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-text-primary">{l.subject || l.message || 'Inquiry'}</h4>
                    <p className="text-[11px] text-text-tertiary">Customer: {l.customerName || l.customer?.name || 'Buyer'}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold text-[10px] rounded-lg border border-amber-500/20">
                    {l.status || 'New Inquiry'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Boosted Reels Status */}
        <div className="glass rounded-2xl p-5 border border-white/10 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiZap className="text-amber-500" />
              <span>Active Boosted Reels</span>
            </h3>
            <Link to="/vendor/boost" className="text-xs text-brand-purple font-bold hover:underline">
              Manage Boosts
            </Link>
          </div>

          <div className="space-y-3">
            {boosts.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-4">No active boosted reels. Boost a reel for high reach!</p>
            ) : (
              boosts.map((b, i) => (
                <div key={b.id || i} className="glass p-3.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-text-primary">{b.reelTitle || 'Boosted Promo Reel'}</h4>
                    <p className="text-[11px] text-text-tertiary">Plan: {b.plan || 'Boost Package'}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 font-bold text-[10px] rounded-lg border border-emerald-500/20">
                    {b.status || 'Active'} ({b.remainingDays || 7}d left)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
