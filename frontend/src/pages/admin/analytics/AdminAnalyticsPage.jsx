import React, { useState } from 'react';
import {
  FiBarChart2,
  FiUsers,
  FiLayers,
  FiFilm,
  FiShoppingBag,
  FiDollarSign,
  FiZap,
  FiMapPin,
  FiTrendingUp,
  FiEye,
  FiVideo,
  FiPackage,
  FiStar,
  FiActivity,
  FiArrowUpRight,
  FiCheckCircle,
  FiHeart
} from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetAdminOverviewQuery } from '../../../features/admin/adminApi';

export default function AdminAnalyticsPage() {
  const { data: ov, isFetching: loading, refetch } = useGetAdminOverviewQuery(undefined, { pollingInterval: 30000 });
  const [contentTab, setContentTab] = useState('reels'); // 'reels' | 'listings'

  const fmt = (v) => (v || 0).toLocaleString('en-IN');
  const fmtCurr = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const topVendors = ov?.top_vendors || [];
  const topCreators = ov?.top_creators || [];
  const topCategories = ov?.top_categories || [];
  const topCities = ov?.top_cities || [];
  const topViewedReels = ov?.top_viewed_reels || [];
  const topViewedListings = ov?.top_viewed_listings || [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12 font-sans">
      <AdminPageHeader
        icon={FiBarChart2}
        title="Analytics & Platform Growth"
        subtitle="Real-time live traffic, content views, active users, GMV revenue, top creators, vendors, and market distribution."
      />

      {loading && !ov ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Section 1: Views & Traffic Live Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <FiActivity className="text-brand-purple" /> Traffic & Engagement Overview
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Polling Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatCard
                label="Total Platform Views"
                value={fmt(ov?.total_views)}
                icon={FiEye}
                color="purple"
                trend={ov?.todays_views_trend}
              />
              <AdminStatCard
                label="Daily Active Users (7d)"
                value={fmt(ov?.active_users_last_7d)}
                icon={FiUsers}
                color="blue"
                trend={ov?.active_users_trend}
              />
              <AdminStatCard
                label="Daily Reels Uploaded"
                value={fmt(ov?.todays_reels)}
                icon={FiFilm}
                color="pink"
                trend={ov?.todays_reels_trend}
              />
              <AdminStatCard
                label="Daily Orders & Deals"
                value={fmt(ov?.todays_deals)}
                icon={FiShoppingBag}
                color="green"
                trend={ov?.todays_deals_trend}
              />
            </div>
          </div>

          {/* Section 2: Views Breakdown & Financial Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Reel Views Mini Card */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Reel Video Views</span>
                <FiFilm className="text-brand-purple w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-brand-purple mt-1 font-display">{fmt(ov?.total_reel_views)}</h4>
              <span className="text-[10px] text-text-tertiary">All-time short video impressions</span>
            </div>

            {/* Listing Views Mini Card */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Listing Views</span>
                <FiLayers className="text-blue-500 w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-blue-600 mt-1 font-display">{fmt(ov?.total_listing_views)}</h4>
              <span className="text-[10px] text-text-tertiary">Product & catalog page views</span>
            </div>

            {/* Platform GMV */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Total Platform GMV</span>
                <FiDollarSign className="text-emerald-500 w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-emerald-600 mt-1 font-display">{fmtCurr(ov?.total_gmv_paise)}</h4>
              <span className="text-[10px] text-text-tertiary">All-time gross sales volume</span>
            </div>

            {/* Subscription Revenue */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-card bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Subscription & Boosts</span>
                <FiZap className="text-amber-500 w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-amber-500 mt-1 font-display">
                {fmtCurr((ov?.subscription_revenue_paise || 0) + (ov?.boost_revenue_paise || 0))}
              </h4>
              <span className="text-[10px] text-text-tertiary">Plan fees & sponsored promotions</span>
            </div>
          </div>

          {/* Section 3: Most Viewed Content Showcase */}
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-glass space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h4 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <FiEye className="text-brand-pink" /> Content Views Leaderboard
                </h4>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Track top performing video reels and product listings by total user views and audience reach
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center bg-surface-secondary p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setContentTab('reels')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    contentTab === 'reels'
                      ? 'bg-white shadow-xs text-brand-purple'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FiFilm className="w-3.5 h-3.5" /> Top Reels
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab('listings')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    contentTab === 'listings'
                      ? 'bg-white shadow-xs text-brand-purple'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <FiPackage className="w-3.5 h-3.5" /> Top Products
                </button>
              </div>
            </div>

            {/* Content Display */}
            {contentTab === 'reels' ? (
              topViewedReels.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-tertiary">
                  <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No reel view records found yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topViewedReels.map((reel, idx) => (
                    <div
                      key={reel._id || idx}
                      className="bg-surface-secondary/70 hover:bg-surface-secondary rounded-xl p-3.5 border border-border flex items-center gap-3.5 transition-all group"
                    >
                      <div className="w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative flex items-center justify-center border border-white/20">
                        {reel.thumbnailUrl ? (
                          <img src={reel.thumbnailUrl} alt={reel.caption} className="w-full h-full object-cover" />
                        ) : (
                          <FiVideo className="text-slate-400 w-5 h-5" />
                        )}
                        <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] font-black text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-text-primary block truncate group-hover:text-brand-purple transition-colors">
                          {reel.caption || 'Untitled Reel'}
                        </span>
                        <span className="text-[10px] text-text-tertiary block truncate mt-0.5">
                          By {reel.creatorName} • {reel.category}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-md">
                            <FiEye className="w-3 h-3" /> {reel.formattedViews} views
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-tertiary">
                            <FiHeart className="w-2.5 h-2.5 text-rose-500" /> {reel.likesCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              topViewedListings.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-tertiary">
                  <FiPackage className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No product view records found yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topViewedListings.map((listing, idx) => (
                    <div
                      key={listing._id || idx}
                      className="bg-surface-secondary/70 hover:bg-surface-secondary rounded-xl p-3.5 border border-border flex items-center gap-3.5 transition-all group"
                    >
                      <div className="w-12 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 relative flex items-center justify-center border border-border">
                        {listing.image ? (
                          <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <FiPackage className="text-slate-400 w-5 h-5" />
                        )}
                        <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[9px] font-black text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-text-primary block truncate group-hover:text-brand-purple transition-colors">
                          {listing.title || 'Untitled Product'}
                        </span>
                        <span className="text-[10px] text-text-tertiary block truncate mt-0.5">
                          By {listing.vendorName} • ₹{(listing.price || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            <FiEye className="w-3 h-3" /> {listing.formattedViews} views
                          </span>
                          <span className="text-[10px] font-bold text-text-tertiary">
                            {listing.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Section 4: Top Performers & Market Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Creators (with Views) */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiFilm className="text-brand-pink" /> Top Performing Creators
                </span>
                <span className="text-[10px] font-bold text-brand-purple">Ranked by Views</span>
              </h4>
              <div className="space-y-3">
                {topCreators.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-6">No creator data available yet.</p>
                ) : (
                  topCreators.map((c, i) => (
                    <div key={c._id || i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl hover:bg-surface-secondary/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-bold text-xs shrink-0">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (c.name || 'C')[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-text-primary block truncate">{c.name}</span>
                          <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                            {c.reels} portfolio reels • <FiStar className="text-amber-500 w-3 h-3 inline fill-amber-500" /> {c.rating}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-brand-purple bg-brand-purple/10 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <FiEye className="w-3 h-3" /> {c.views} views
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Vendors */}
            <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-500" /> Top Performing Vendors
                </span>
                <span className="text-[10px] font-bold text-emerald-600">Ranked by Sales</span>
              </h4>
              <div className="space-y-3">
                {topVendors.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-6">No vendor data available yet.</p>
                ) : (
                  topVendors.map((v, i) => (
                    <div key={v._id || i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl hover:bg-surface-secondary/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {v.avatar ? (
                            <img src={v.avatar} alt={v.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (v.name || 'V')[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-text-primary block truncate">{v.name}</span>
                          <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                            {v.orders} deals/ratings • <FiStar className="text-amber-500 w-3 h-3 inline fill-amber-500" /> {v.rating}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        {v.sales}
                      </span>
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
                  <p className="text-xs text-text-tertiary text-center py-6">No category listing data yet.</p>
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
                  <p className="text-xs text-text-tertiary text-center py-6">No user city data available yet.</p>
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
