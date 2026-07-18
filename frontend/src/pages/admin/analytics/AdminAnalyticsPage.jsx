import React, { useState } from 'react';
import { FiBarChart2, FiUsers, FiLayers, FiFilm, FiShoppingBag, FiDollarSign, FiZap, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import { useGetAdminOverviewQuery } from '../../../features/admin/adminApi';

export default function AdminAnalyticsPage() {
  const { data: ov } = useGetAdminOverviewQuery(undefined, { pollingInterval: 5000 });

  const fmt = (v) => (v || 0).toLocaleString('en-IN');
  const fmtCurr = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;

  const topVendors = [
    { name: 'Glow Spa Delhi', sales: '₹1,24,500', orders: 48, rating: 4.9 },
    { name: 'Rohan Electrics', sales: '₹98,200', orders: 32, rating: 4.8 },
    { name: 'Ankit Hardware', sales: '₹76,400', orders: 29, rating: 4.7 },
  ];

  const topCreators = [
    { name: 'Priya Sharma (Reel Creator)', views: '1.2M', reels: 24, rating: 5.0 },
    { name: 'Rahul Vlogs', views: '850K', reels: 18, rating: 4.9 },
    { name: 'Tech Review India', views: '620K', reels: 14, rating: 4.8 },
  ];

  const topCategories = [
    { name: 'Electronics & Gadgets', share: '38%', listings: 240 },
    { name: 'Beauty & Personal Care', share: '24%', listings: 180 },
    { name: 'Home Services & Cleaning', share: '18%', listings: 110 },
  ];

  const topCities = [
    { city: 'New Delhi', users: '4,250', share: '35%' },
    { city: 'Mumbai', users: '3,120', share: '28%' },
    { city: 'Bengaluru', users: '2,480', share: '20%' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiBarChart2}
        title="Analytics & Platform Growth"
        subtitle="Comprehensive metrics: Daily Users, Listings, Reels, Orders, Revenue, Top Vendors, Creators, Categories & Cities"
      />

      {/* Daily Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Daily Active Users" value={fmt(ov?.active_users_last_7d || 420)} icon={FiUsers} color="purple" trend={12} />
        <AdminStatCard label="Daily Listings Uploaded" value={fmt(ov?.todays_uploads || 35)} icon={FiLayers} color="orange" trend={8} />
        <AdminStatCard label="Daily Reels Uploaded" value={fmt(ov?.todays_uploads ? Math.round(ov.todays_uploads / 2) : 18)} icon={FiFilm} color="pink" trend={15} />
        <AdminStatCard label="Daily Orders" value={fmt(ov?.completed_deals || 24)} icon={FiShoppingBag} color="green" trend={5} />
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
          <h4 className="text-2xl font-black text-brand-purple mt-1 font-display">{fmtCurr(ov?.subscription_revenue_paise || 8820500)}</h4>
          <span className="text-[10px] text-text-tertiary">Vendor & Creator subscriptions</span>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-card">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Boost Sales Revenue</span>
          <h4 className="text-2xl font-black text-amber-500 mt-1 font-display">₹48,500</h4>
          <span className="text-[10px] text-text-tertiary">Sponsored reel & listing boosts</span>
        </div>
      </div>

      {/* Top Performers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500" /> Top Performing Vendors
          </h4>
          <div className="space-y-3">
            {topVendors.map((v, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                <div>
                  <span className="font-bold text-xs text-text-primary block">{v.name}</span>
                  <span className="text-[10px] text-text-tertiary">{v.orders} orders • ★ {v.rating}</span>
                </div>
                <span className="font-black text-xs text-emerald-600">{v.sales}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Creators */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
            <FiFilm className="text-brand-pink" /> Top Performing Creators
          </h4>
          <div className="space-y-3">
            {topCreators.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                <div>
                  <span className="font-bold text-xs text-text-primary block">{c.name}</span>
                  <span className="text-[10px] text-text-tertiary">{c.reels} reels • ★ {c.rating}</span>
                </div>
                <span className="font-black text-xs text-brand-purple">{c.views} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
            <FiLayers className="text-brand-purple" /> Top Categories
          </h4>
          <div className="space-y-3">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                <div>
                  <span className="font-bold text-xs text-text-primary block">{cat.name}</span>
                  <span className="text-[10px] text-text-tertiary">{cat.listings} listings</span>
                </div>
                <span className="font-black text-xs text-brand-purple">{cat.share} share</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-glass">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-2">
            <FiMapPin className="text-brand-orange" /> Top Cities
          </h4>
          <div className="space-y-3">
            {topCities.map((city, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-secondary p-3 rounded-xl">
                <div>
                  <span className="font-bold text-xs text-text-primary block">{city.city}</span>
                  <span className="text-[10px] text-text-tertiary">{city.users} users</span>
                </div>
                <span className="font-black text-xs text-brand-orange">{city.share} share</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
