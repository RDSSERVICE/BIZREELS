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
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-2">
                <FiActivity className="text-[#d99a3d]" /> Traffic & Engagement Overview
              </h3>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
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
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reel Video Views</span>
                <FiFilm className="text-[#d99a3d] w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-[#1a1a1a] mt-1">{fmt(ov?.total_reel_views)}</h4>
              <span className="text-[10px] text-slate-400 font-medium">All-time short video impressions</span>
            </div>

            {/* Listing Views Mini Card */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Listing Views</span>
                <FiLayers className="text-[#1a1a1a] w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-[#1a1a1a] mt-1">{fmt(ov?.total_listing_views)}</h4>
              <span className="text-[10px] text-slate-400 font-medium">Product & catalog page views</span>
            </div>

            {/* Platform GMV */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Platform GMV</span>
                <FiDollarSign className="text-emerald-600 w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-emerald-600 mt-1">{fmtCurr(ov?.total_gmv_paise)}</h4>
              <span className="text-[10px] text-slate-400 font-medium">All-time gross sales volume</span>
            </div>

            {/* Subscription Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subscription & Boosts</span>
                <FiZap className="text-amber-600 w-4 h-4" />
              </div>
              <h4 className="text-2xl font-black text-[#1a1a1a] mt-1">
                {fmtCurr((ov?.subscription_revenue_paise || 0) + (ov?.boost_revenue_paise || 0))}
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Plan fees & sponsored promotions</span>
            </div>
          </div>

          {/* Section 3: Most Viewed Content Showcase */}
          <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e3dccb] pb-3">
              <div>
                <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                  <FiEye className="text-[#d99a3d]" /> Content Views Leaderboard
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Track top performing video reels and product listings by total user views and reach
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb]">
                <button
                  type="button"
                  onClick={() => setContentTab('reels')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentTab === 'reels'
                      ? 'bg-[#1a1a1a] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#1a1a1a]'
                  }`}
                >
                  <FiFilm className="w-3.5 h-3.5" /> Top Reels
                </button>
                <button
                  type="button"
                  onClick={() => setContentTab('listings')}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    contentTab === 'listings'
                      ? 'bg-[#1a1a1a] text-white shadow-xs'
                      : 'text-slate-500 hover:text-[#1a1a1a]'
                  }`}
                >
                  <FiPackage className="w-3.5 h-3.5" /> Top Products
                </button>
              </div>
            </div>

            {/* Content Display */}
            {contentTab === 'reels' ? (
              topViewedReels.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-bold">
                  <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No reel view records found yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topViewedReels.map((reel, idx) => (
                    <div
                      key={reel._id || idx}
                      className="bg-[#f8f4ec] hover:border-[#1a1a1a] rounded-xl p-3.5 border border-[#e3dccb] flex items-center gap-3.5 transition-all group"
                    >
                      <div className="w-12 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative flex items-center justify-center border border-[#e3dccb]">
                        {reel.thumbnailUrl ? (
                          <img src={reel.thumbnailUrl} alt={reel.caption} className="w-full h-full object-cover" />
                        ) : (
                          <FiVideo className="text-slate-400 w-5 h-5" />
                        )}
                        <span className="absolute top-1 left-1 bg-black/75 text-[9px] font-black text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-xs text-[#1a1a1a] block truncate group-hover:text-[#d99a3d] transition-colors">
                          {reel.caption || 'Untitled Reel'}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5 font-medium">
                          By {reel.creatorName} • {reel.category}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#1a1a1a] bg-white border border-[#e3dccb] px-2 py-0.5 rounded-md">
                            <FiEye className="w-3 h-3 text-[#d99a3d]" /> {reel.formattedViews} views
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
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
                <div className="text-center py-8 text-xs text-slate-400 font-bold">
                  <FiPackage className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No product view records found yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topViewedListings.map((listing, idx) => (
                    <div
                      key={listing._id || idx}
                      className="bg-[#f8f4ec] hover:border-[#1a1a1a] rounded-xl p-3.5 border border-[#e3dccb] flex items-center gap-3.5 transition-all group"
                    >
                      <div className="w-12 h-14 rounded-lg bg-white overflow-hidden shrink-0 relative flex items-center justify-center border border-[#e3dccb]">
                        {listing.image ? (
                          <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <FiPackage className="text-slate-400 w-5 h-5" />
                        )}
                        <span className="absolute top-1 left-1 bg-black/75 text-[9px] font-black text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-xs text-[#1a1a1a] block truncate group-hover:text-[#d99a3d] transition-colors">
                          {listing.title || 'Untitled Product'}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5 font-medium">
                          By {listing.vendorName} • ₹{(listing.price || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#1a1a1a] bg-white border border-[#e3dccb] px-2 py-0.5 rounded-md">
                            <FiEye className="w-3 h-3 text-[#d99a3d]" /> {listing.formattedViews} views
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
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
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#e3dccb] pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiFilm className="text-[#d99a3d]" /> Top Performing Creators
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ranked by Views</span>
              </h4>
              <div className="space-y-3">
                {topCreators.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No creator data available yet.</p>
                ) : (
                  topCreators.map((c, i) => (
                    <div key={c._id || i} className="flex items-center justify-between bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb] hover:border-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (c.name || 'C')[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-xs text-[#1a1a1a] block truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            {c.reels} portfolio reels • <FiStar className="text-amber-500 w-3 h-3 inline fill-amber-500" /> {c.rating}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-[#1a1a1a] bg-white border border-[#e3dccb] px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <FiEye className="w-3 h-3 text-[#d99a3d]" /> {c.views} views
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Vendors */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#e3dccb] pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-600" /> Top Performing Vendors
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ranked by Sales</span>
              </h4>
              <div className="space-y-3">
                {topVendors.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No vendor data available yet.</p>
                ) : (
                  topVendors.map((v, i) => (
                    <div key={v._id || i} className="flex items-center justify-between bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb] hover:border-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {v.avatar ? (
                            <img src={v.avatar} alt={v.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (v.name || 'V')[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-xs text-[#1a1a1a] block truncate">{v.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            {v.orders} deals/ratings • <FiStar className="text-amber-500 w-3 h-3 inline fill-amber-500" /> {v.rating}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                        {v.sales}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#e3dccb] pb-2 flex items-center gap-2">
                <FiLayers className="text-[#d99a3d]" /> Top Categories
              </h4>
              <div className="space-y-3">
                {topCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No category listing data yet.</p>
                ) : (
                  topCategories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb]">
                      <div>
                        <span className="font-black text-xs text-[#1a1a1a] block">{cat.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{cat.listings} active listings</span>
                      </div>
                      <span className="font-black text-xs text-[#1a1a1a]">{cat.share} share</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs">
              <h4 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#e3dccb] pb-2 flex items-center gap-2">
                <FiMapPin className="text-amber-600" /> Top Cities
              </h4>
              <div className="space-y-3">
                {topCities.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No user city data available yet.</p>
                ) : (
                  topCities.map((city, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb]">
                      <div>
                        <span className="font-black text-xs text-[#1a1a1a] block">{city.city}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{city.users} users</span>
                      </div>
                      <span className="font-black text-xs text-[#1a1a1a]">{city.share} share</span>
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
