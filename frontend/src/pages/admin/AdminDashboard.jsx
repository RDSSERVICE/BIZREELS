import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiUserCheck, FiFilm, FiLayers, FiVideo, FiUpload,
  FiZap, FiDollarSign, FiShield, FiAlertTriangle, FiShoppingBag,
  FiCreditCard, FiTrendingUp, FiArrowRight, FiGrid
} from 'react-icons/fi';
import AdminStatCard from '../../features/admin/components/AdminStatCard';
import AdminPageHeader from '../../features/admin/components/AdminPageHeader';
import { useGetAdminOverviewQuery } from '../../features/admin/adminApi';

const QUICK_ACTIONS = [
  { label: 'Manage Users', path: '/admin/customers', icon: FiUsers, color: 'text-brand-purple' },
  { label: 'KYC Queue', path: '/admin/kyc', icon: FiShield, color: 'text-amber-500' },
  { label: 'View Reports', path: '/admin/reports', icon: FiAlertTriangle, color: 'text-rose-500' },
  { label: 'Manage Listings', path: '/admin/listings', icon: FiLayers, color: 'text-brand-orange' },
  { label: 'View Orders', path: '/admin/orders', icon: FiShoppingBag, color: 'text-emerald-500' },
  { label: 'Analytics', path: '/admin/analytics', icon: FiTrendingUp, color: 'text-blue-500' },
];

/**
 * AdminDashboard — Full overview with 13 stat cards + quick actions
 */
export default function AdminDashboard() {
  const { data: ov, isFetching: loading } = useGetAdminOverviewQuery(undefined, {
    pollingInterval: 300000,
  });

  const fmt = (v) => (v || 0).toLocaleString('en-IN');
  const fmtCurrency = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiGrid}
        title="Admin Dashboard"
        subtitle="Real-time overview of your platform metrics and KPIs"
      />

      {loading && !ov ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : ov ? (
        <>
          {/* Primary Stats Grid — 13 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              icon={FiDollarSign}
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
              label="Orders"
              value={fmt(ov.total_orders)}
              icon={FiShoppingBag}
              color="indigo"
              testId="stat-orders"
            />
            <AdminStatCard
              label="Wallet Balance"
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

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    className="glass rounded-2xl p-4 border border-white/50 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex items-center gap-3 group"
                  >
                    <div className={`p-2.5 rounded-xl bg-surface-tertiary ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-text-primary">{action.label}</h4>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-brand-purple group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Active Users / Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Active Users (7d)</span>
              <h4 className="text-2xl font-black text-text-primary mt-1 font-display">{fmt(ov.active_users_last_7d)}</h4>
              <div className="mt-2 h-1 bg-surface-tertiary rounded-full overflow-hidden">
                <div className="h-full gradient-brand rounded-full" style={{ width: `${Math.min(100, (ov.active_users_last_7d / (ov.total_users || 1)) * 100)}%` }} />
              </div>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Completed Deals</span>
              <h4 className="text-2xl font-black text-emerald-600 mt-1 font-display">{fmt(ov.completed_deals)}</h4>
              <span className="text-[10px] text-text-tertiary">of {fmt(ov.total_deals)} total</span>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Platform GMV</span>
              <h4 className="text-2xl font-black text-brand-purple mt-1 font-display">{fmtCurrency(ov.total_gmv_paise)}</h4>
              <span className="text-[10px] text-text-tertiary">all-time gross merchandise value</span>
            </div>
          </div>
        </>
      ) : (
        <div className="glass rounded-2xl p-8 text-center text-text-tertiary text-xs border border-border">
          Unable to load dashboard stats. Check if backend is running.
        </div>
      )}
    </div>
  );
}
