import React from 'react';
import { FiBarChart2, FiUsers, FiLayers, FiFilm, FiShoppingBag, FiDollarSign, FiZap, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetAdminOverviewQuery } from '../../../features/admin/adminApi';

export default function AdminAnalyticsPage() {
  const { data: ov, isFetching: loading } = useGetAdminOverviewQuery(undefined, { pollingInterval: 5000 });

  const fmt = (v) => (v || 0).toLocaleString('en-IN');
  const fmtCurr = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const topVendors = ov?.top_vendors || [];
  const topCreators = ov?.top_creators || [];
  const topCategories = ov?.top_categories || [];
  const topCities = ov?.top_cities || [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBarChart2}
        title="Analytics & Platform Growth"
        subtitle="Real-time live metrics: Daily Active Users, Listings, Reels, Orders, GMV Revenue, Top Vendors, Creators, Categories & Cities"
      />

      {loading && !ov ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Daily Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard label="Daily Active Users (7d)" value={fmt(ov?.active_users_last_7d)} icon={FiUsers} color="purple" trend={12} />
            <AdminStatCard label="Daily Listings Uploaded" value={fmt(ov?.todays_uploads)} icon={FiLayers} color="orange" trend={8} />
            <AdminStatCard label="Daily Reels Uploaded" value={fmt(ov?.total_reels)} icon={FiFilm} color="pink" trend={15} />
            <AdminStatCard label="Daily Orders & Deals" value={fmt(ov?.completed_deals)} icon={FiShoppingBag} color="green" trend={5} />
          </div>

          {/* Revenue & Sales Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Total Platform GMV</span>
              <h4 className="text-2xl font-black text-emerald-600 mt-1 font-display">{fmtCurr(ov?.total_gmv_paise)}</h4>
              <span className="text-[10px] text-text-tertiary">All-time gross sales volume</span>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Subscription Revenue</span>
              <h4 className="text-2xl font-black text-brand-purple mt-1 font-display">{fmtCurr(ov?.subscription_revenue_paise)}</h4>
              <span className="text-[10px] text-text-tertiary">Vendor & Creator subscriptions</span>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Boost Sales Revenue</span>
              <h4 className="text-2xl font-black text-amber-500 mt-1 font-display">{fmtCurr(ov?.boost_revenue_paise)}</h4>
              <span className="text-[10px] text-text-tertiary">Sponsored reel & listing boosts</span>
            </div>
          </div>

          {/* Top Performers Grid — Live Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vendors */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" /> Top Performing Vendors
              </h4>
              <div className="space-y-3">
                {topVendors.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">No vendor data available yet.</p>
                ) : (
                  topVendors.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-text-primary block">{v.name}</span>
                        <span className="text-[10px] text-text-tertiary">{v.orders} ratings/deals • ★ {v.rating}</span>
                      </div>
                      <span className="font-black text-xs text-emerald-600">{v.sales}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Creators */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
                <FiFilm className="text-brand-pink" /> Top Performing Creators
              </h4>
              <div className="space-y-3">
                {topCreators.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">No creator data available yet.</p>
                ) : (
                  topCreators.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-text-primary block">{c.name}</span>
                        <span className="text-[10px] text-text-tertiary">{c.reels} portfolio reels • ★ {c.rating}</span>
                      </div>
                      <span className="font-black text-xs text-brand-purple">{c.views} views</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
                <FiLayers className="text-brand-purple" /> Top Categories
              </h4>
              <div className="space-y-3">
                {topCategories.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">No category listing data yet.</p>
                ) : (
                  topCategories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-text-primary block">{cat.name}</span>
                        <span className="text-[10px] text-text-tertiary">{cat.listings} active listings</span>
                      </div>
                      <span className="font-black text-xs text-brand-purple">{cat.share} share</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
                <FiMapPin className="text-brand-orange" /> Top Cities
              </h4>
              <div className="space-y-3">
                {topCities.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4">No user city data available yet.</p>
                ) : (
                  topCities.map((city, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                      <div>
                        <span className="font-bold text-xs text-text-primary block">{city.city}</span>
                        <span className="text-[10px] text-text-tertiary">{city.users} users</span>
                      </div>
                      <span className="font-black text-xs text-brand-orange">{city.share} share</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
