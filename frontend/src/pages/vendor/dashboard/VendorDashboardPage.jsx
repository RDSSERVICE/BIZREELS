import React from 'react';
import { useSelector } from 'react-redux';
import {
  FiPackage, FiTool, FiVideo, FiEye, FiUsers, FiInbox,
  FiShoppingCart, FiDollarSign, FiZap, FiGrid, FiShield
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
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

  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};
  const currentTier = vendorProfile.verificationStatus || 'unverified';

  const getTierInfo = (tier) => {
    switch (tier) {
      case 'premium_verified':
        return { icon: '🔵', label: 'Premium Verified (Future)', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'verified_vendor':
        return { icon: '🟢', label: 'Verified Vendor (BATCH)', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'partially_verified':
        return { icon: '🟡', label: 'Partially Verified', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      default:
        return { icon: '⚪', label: 'Unverified Vendor', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  const badgeInfo = getTierInfo(currentTier);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Verification Status & Dialogue Banner */}
      <div className="glass rounded-2xl p-4 sm:p-5 border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{badgeInfo.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeInfo.color}`}>
                {badgeInfo.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Verify your business to get more leads, higher boost ranking in reels, and maximum buyer trust!
            </p>
          </div>
        </div>
        <Link
          to="/vendor/verification"
          className="px-4 py-2 rounded-xl gradient-brand text-white text-xs font-bold shadow-premium hover:opacity-90 transition flex-shrink-0 flex items-center gap-1.5"
        >
          <FiShield size={15} />
          <span>Open Verification Menu</span>
        </Link>
      </div>

      {/* REQUIREMENT: REELS & IMAGE POST SUBSCRIPTION BANNER */}
      <div className="glass rounded-3xl p-6 border border-brand-purple/20 shadow-card bg-gradient-to-r from-brand-purple/10 via-surface to-brand-orange/10 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
              <FiVideo className="text-brand-purple" /> Showcase Business with Video Reels & Image Posts
            </h3>
            <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
              Create and publish engaging reels or image posts to showcase your products, services, offers, and business to potential customers.
              The Free Plan allows you to publish a limited number of reels and image posts with standard visibility.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-text-primary">
              <div>• Publish more reels & images</div>
              <div>• Increase content visibility</div>
              <div>• Access reel & post boost features</div>
              <div>• Reach larger target audience</div>
            </div>
          </div>
          <Link
            to="/vendor/subscription"
            className="px-5 py-3 gradient-brand text-white font-bold text-xs rounded-2xl shadow-premium hover:opacity-90 transition flex-shrink-0 flex items-center gap-2"
          >
            <FiZap /> SUBSCRIPTION PLAN SHOW
          </Link>
        </div>
      </div>

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
            <span>1. POST REELS/IMAGE</span>
          </Link>
          <Link
            to="/vendor/boost"
            className="px-4 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiZap size={16} />
            <span>2. BOOST POST</span>
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
