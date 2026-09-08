import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiUserCheck, FiFilm, FiLayers, FiVideo, FiUpload,
  FiZap, FiShield, FiAlertTriangle, FiShoppingBag,
  FiCreditCard, FiTrendingUp, FiArrowRight, FiGrid, FiRefreshCw,
  FiEye, FiMapPin, FiAward, FiCheckCircle, FiActivity, FiTag
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import AdminPageHeader from '../../features/admin/components/AdminPageHeader';
import { useGetAdminOverviewQuery } from '../../features/admin/adminApi';

const QUICK_ACTIONS = [
  { label: 'Manage Users', path: '/admin/customers', icon: FiUsers, desc: 'Customers, vendors & creators', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'KYC Verification', path: '/admin/kyc', icon: FiShield, desc: 'Queue & pending approvals', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Content Reports', path: '/admin/reports', icon: FiAlertTriangle, desc: 'User & content moderation', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { label: 'Manage Listings', path: '/admin/listings', icon: FiLayers, desc: 'Product & service listings', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Orders & Deals', path: '/admin/orders', icon: FiShoppingBag, desc: 'Transactions & orders', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Platform Analytics', path: '/admin/analytics', icon: FiTrendingUp, desc: 'Deep engagement analytics', color: 'bg-blue-50 text-blue-700 border-blue-200' },
];

/**
 * AdminDashboard — Rich, high-density Bento-Brutalism Admin Dashboard
 */
export default function AdminDashboard() {
  const { data: rawOv, isFetching: loading, error, refetch } = useGetAdminOverviewQuery(undefined, {
    pollingInterval: 120000,
  });

  // Normalize data in case backend wrapped or un-nested it
  const ov = rawOv?.data || rawOv;

  const fmt = (v) => (v || 0).toLocaleString('en-IN');
  const fmtCurrency = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* Page Header with Real-Time Pulse and Refresh */}
      <AdminPageHeader
        icon={FiGrid}
        title="Admin Dashboard"
        subtitle="Real-time control center for BizReels platform health, KPIs & metrics"
      >
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-slate-600">Live System</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-[#1a1a1a] bg-white hover:bg-[#f8f4ec] active:scale-95 transition-all border border-[#e3dccb] shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh overview metrics"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d99a3d]' : 'text-slate-500'}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* Loading State */}
      {loading && !ov ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-white border border-[#e3dccb] rounded-2xl animate-pulse shadow-2xs" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 bg-white border border-[#e3dccb] rounded-2xl animate-pulse shadow-2xs" />
            ))}
          </div>
        </div>
      ) : ov ? (
        <>
          {/* Real-Time Platform Daily Highlights (Today's velocity) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Listings</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${(ov.todays_listings_trend || 0) >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                  {(ov.todays_listings_trend || 0) >= 0 ? '↑' : '↓'} {Math.abs(ov.todays_listings_trend || 0)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight">{fmt(ov.todays_listings)}</h3>
                <FiLayers className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">New catalog additions</span>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Reels</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${(ov.todays_reels_trend || 0) >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                  {(ov.todays_reels_trend || 0) >= 0 ? '↑' : '↓'} {Math.abs(ov.todays_reels_trend || 0)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight">{fmt(ov.todays_reels)}</h3>
                <FiVideo className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Video submissions</span>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Deals</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${(ov.todays_deals_trend || 0) >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                  {(ov.todays_deals_trend || 0) >= 0 ? '↑' : '↓'} {Math.abs(ov.todays_deals_trend || 0)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{fmt(ov.todays_deals)}</h3>
                <FiShoppingBag className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">B2B closed orders</span>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Views</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${(ov.todays_views_trend || 0) >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                  {(ov.todays_views_trend || 0) >= 0 ? '↑' : '↓'} {Math.abs(ov.todays_views_trend || 0)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight">{fmt(ov.todays_views)}</h3>
                <FiEye className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Listings & reels impressions</span>
            </div>
          </div>

          {/* Primary Core Platform Stat Cards — 13 Bento Cards */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FiActivity className="w-3.5 h-3.5 text-[#d99a3d]" />
                <span>Platform Metrics & KPIs</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Updated automatically</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <AdminStatCard
                label="Total Customers"
                value={fmt(ov.total_customers)}
                icon={FiUsers}
                color="purple"
                testId="stat-customers"
              />
              <AdminStatCard
                label="Total Vendors"
                value={fmt(ov.total_vendors)}
                icon={FiUserCheck}
                color="orange"
                testId="stat-vendors"
              />
              <AdminStatCard
                label="Total Creators"
                value={fmt(ov.total_creators)}
                icon={FiFilm}
                color="pink"
                testId="stat-creators"
              />
              <AdminStatCard
                label="Total Listings"
                value={fmt(ov.total_listings)}
                icon={FiLayers}
                color="blue"
                testId="stat-listings"
              />
              <AdminStatCard
                label="Total Reels"
                value={fmt(ov.total_reels)}
                icon={FiVideo}
                color="violet"
                testId="stat-reels"
              />
              <AdminStatCard
                label="Today's Uploads"
                value={fmt(ov.todays_uploads)}
                icon={FiUpload}
                color="cyan"
                testId="stat-todays-uploads"
              />
              <AdminStatCard
                label="Active Boosts"
                value={fmt(ov.active_boosts)}
                icon={FiZap}
                color="amber"
                testId="stat-active-boosts"
              />
              <AdminStatCard
                label="Total Revenue"
                value={fmtCurrency(ov.total_revenue_paise)}
                icon={FaRupeeSign}
                color="green"
                testId="stat-revenue"
              />
              <AdminStatCard
                label="Pending KYC"
                value={fmt(ov.pending_kyc_count)}
                icon={FiShield}
                color="amber"
                testId="stat-pending-kyc"
              />
              <AdminStatCard
                label="Pending Reports"
                value={fmt(ov.open_reports_count)}
                icon={FiAlertTriangle}
                color="rose"
                testId="stat-reports"
              />
              <AdminStatCard
                label="Total Orders"
                value={fmt(ov.total_orders)}
                icon={FiShoppingBag}
                color="indigo"
                testId="stat-orders"
              />
              <AdminStatCard
                label="Wallet Balances"
                value={fmtCurrency(ov.wallet_balance_paise)}
                icon={FiCreditCard}
                color="teal"
                testId="stat-wallet"
              />
              <AdminStatCard
                label="Subscription Revenue"
                value={fmtCurrency(ov.subscription_revenue_paise)}
                icon={FiTrendingUp}
                color="sky"
                testId="stat-sub-revenue"
              />
            </div>
          </div>

          {/* Platform Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Users (7d)</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                  {ov.active_users_trend ? `${ov.active_users_trend >= 0 ? '+' : ''}${ov.active_users_trend}%` : 'Stable'}
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mt-2 font-display">{fmt(ov.active_users_last_7d)}</h4>
              <div className="mt-3 h-1.5 bg-[#f8f4ec] rounded-full overflow-hidden border border-[#e3dccb]/50">
                <div
                  className="h-full bg-[#1a1a1a] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, ((ov.active_users_last_7d || 0) / (ov.total_users || 1)) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                {Math.round(((ov.active_users_last_7d || 0) / (ov.total_users || 1)) * 100)}% of {fmt(ov.total_users)} total registered users
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Deals</span>
              <h4 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-display">{fmt(ov.completed_deals)}</h4>
              <div className="mt-3 h-1.5 bg-[#f8f4ec] rounded-full overflow-hidden border border-[#e3dccb]/50">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, ((ov.completed_deals || 0) / (ov.total_deals || 1)) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                {fmt(ov.total_deals)} total negotiated deals ({Math.round(((ov.completed_deals || 0) / (ov.total_deals || 1)) * 100)}% fulfillment)
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform GMV</span>
              <h4 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mt-2 font-display">{fmtCurrency(ov.total_gmv_paise)}</h4>
              <div className="mt-3 h-1.5 bg-[#f8f4ec] rounded-full overflow-hidden border border-[#e3dccb]/50">
                <div className="h-full bg-[#d99a3d] rounded-full w-full" />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-medium">All-time gross merchandise transactional volume</span>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FiGrid className="w-3.5 h-3.5 text-[#d99a3d]" />
                <span>Administrative Actions</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs hover:shadow-xs hover:border-[#1a1a1a] hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group"
                  >
                    <div className={`p-2.5 rounded-xl border ${action.color} group-hover:scale-110 transition-transform shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-[#1a1a1a] truncate group-hover:text-[#d99a3d] transition-colors">{action.label}</h4>
                      <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{action.desc}</p>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1a1a1a] group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Platform Breakdown: Top Categories & Top Cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Categories */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiTag className="w-4 h-4 text-[#d99a3d]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Top Categories</h4>
                </div>
                <Link to="/admin/categories" className="text-[10px] font-bold text-[#d99a3d] hover:underline">
                  Manage All →
                </Link>
              </div>

              {ov.top_categories && ov.top_categories.length > 0 ? (
                <div className="space-y-3">
                  {ov.top_categories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#1a1a1a] truncate max-w-[200px]">{cat.name}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <span>{cat.listings} listings</span>
                          <span className="font-bold text-[#1a1a1a]">{cat.share}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#f8f4ec] rounded-full overflow-hidden border border-[#e3dccb]/40">
                        <div
                          className="h-full bg-[#1a1a1a] rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, parseInt(cat.share, 10) || 10))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No category distribution data available yet.</p>
              )}
            </div>

            {/* Top Cities */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-[#d99a3d]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Top User Locations</h4>
                </div>
                <Link to="/admin/locations" className="text-[10px] font-bold text-[#d99a3d] hover:underline">
                  View Locations →
                </Link>
              </div>

              {ov.top_cities && ov.top_cities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ov.top_cities.map((city, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#1a1a1a] block truncate">{city.city}</span>
                        <span className="text-[10px] text-slate-400">{city.users} registered users</span>
                      </div>
                      <span className="text-xs font-black text-[#1a1a1a] bg-white px-2 py-0.5 rounded-md border border-[#e3dccb] shadow-2xs shrink-0">
                        {city.share}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No geographical data registered yet.</p>
              )}
            </div>
          </div>

          {/* Leaderboards: Top Vendors & Top Creators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Vendors */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Top Performing Vendors</h4>
                </div>
                <Link to="/admin/vendors" className="text-[10px] font-bold text-[#d99a3d] hover:underline">
                  All Vendors →
                </Link>
              </div>

              {ov.top_vendors && ov.top_vendors.length > 0 ? (
                <div className="divide-y divide-[#e3dccb]">
                  {ov.top_vendors.map((vendor, idx) => (
                    <div key={vendor._id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center text-xs font-black text-[#1a1a1a] shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1a1a1a] truncate">{vendor.name}</p>
                          <p className="text-[10px] text-slate-400">{vendor.orders || 0} orders • ★ {vendor.rating || '5.0'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600 block">{vendor.sales}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Revenue</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No vendor transaction metrics yet.</p>
              )}
            </div>

            {/* Top Creators */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiFilm className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Top Creators by Impressions</h4>
                </div>
                <Link to="/admin/creators" className="text-[10px] font-bold text-[#d99a3d] hover:underline">
                  All Creators →
                </Link>
              </div>

              {ov.top_creators && ov.top_creators.length > 0 ? (
                <div className="divide-y divide-[#e3dccb]">
                  {ov.top_creators.map((creator, idx) => (
                    <div key={creator._id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center text-xs font-black text-[#1a1a1a] shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1a1a1a] truncate">{creator.name}</p>
                          <p className="text-[10px] text-slate-400">{creator.reels || 0} reels uploaded</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#1a1a1a] block">{creator.views} views</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Impressions</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No creator activity metrics yet.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Enhanced Error / Offline State with Retry Action */
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#e3dccb] shadow-2xs text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <FiAlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1a1a1a]">Unable to Load Dashboard Stats</h3>
            <p className="text-xs text-slate-500">
              {error?.data?.message || error?.error || 'Could not communicate with the BizReels analytics service. Please verify your connection or session.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#2e2e2e] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
            <Link
              to="/admin/app-settings"
              className="px-5 py-2.5 bg-[#f8f4ec] hover:bg-[#ede5d8] text-[#1a1a1a] border border-[#e3dccb] text-xs font-black rounded-xl transition-all shadow-2xs"
            >
              System Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
