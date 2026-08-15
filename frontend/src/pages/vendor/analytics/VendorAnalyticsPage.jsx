import React, { useState, useEffect } from 'react';
import {
  FiPieChart,
  FiEye,
  FiPackage,
  FiTool,
  FiMousePointer,
  FiPhone,
  FiMessageCircle,
  FiUserCheck,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiSearch,
  FiArrowUpRight,
  FiInbox,
  FiInfo,
  FiX,
  FiZap,
  FiLoader,
  FiRefreshCw,
  FiActivity,
  FiShare2,
  FiBookmark
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { getSocket } from '../../../lib/socket';
import toast from 'react-hot-toast';
import {
  useGetVendorAnalyticsOverviewQuery,
  useGetVendorAnalyticsListingsQuery,
  useGetVendorAnalyticsTimeseriesQuery,
  useGetVendorAnalyticsBoostRoiQuery,
  useSimulateVendorAnalyticsMutation
} from '../../../features/vendor/vendorApi';

export default function VendorAnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [metric, setMetric] = useState('views');
  const [listingSort, setListingSort] = useState('views');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListingForRoi, setSelectedListingForRoi] = useState(null);

  // RTK Queries with auto background polling
  const {
    data: overviewData,
    isFetching: isOverviewLoading,
    refetch: refetchOverview
  } = useGetVendorAnalyticsOverviewQuery(range, { pollingInterval: 30000 });

  const {
    data: listingsData,
    isFetching: isListingsLoading,
    refetch: refetchListings
  } = useGetVendorAnalyticsListingsQuery({ range, sort: listingSort, limit: 50 }, { pollingInterval: 30000 });

  const {
    data: timeseriesData,
    isFetching: isTimeseriesLoading,
    refetch: refetchTimeseries
  } = useGetVendorAnalyticsTimeseriesQuery({ range, metric }, { pollingInterval: 30000 });

  const [simulateTraffic, { isLoading: isSimulating }] = useSimulateVendorAnalyticsMutation();

  // Socket.IO Real-time Sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      refetchOverview();
      refetchListings();
      refetchTimeseries();
    };

    socket.on('analytics:updated', handleRealtimeUpdate);
    socket.on('inquiry:created', handleRealtimeUpdate);
    socket.on('inquiry:updated', handleRealtimeUpdate);
    socket.on('order:created', handleRealtimeUpdate);
    socket.on('order:updated', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);
    socket.on('notification:new', handleRealtimeUpdate);

    return () => {
      socket.off('analytics:updated', handleRealtimeUpdate);
      socket.off('inquiry:created', handleRealtimeUpdate);
      socket.off('inquiry:updated', handleRealtimeUpdate);
      socket.off('order:created', handleRealtimeUpdate);
      socket.off('order:updated', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('notification:new', handleRealtimeUpdate);
    };
  }, [refetchOverview, refetchListings, refetchTimeseries]);

  const handleManualRefresh = () => {
    refetchOverview();
    refetchListings();
    refetchTimeseries();
    toast.success('Analytics data refreshed in real-time');
  };

  const handleSimulate = async () => {
    try {
      await simulateTraffic().unwrap();
      toast.success('Generated live test data & analytics events!');
      refetchOverview();
      refetchListings();
      refetchTimeseries();
    } catch (err) {
      toast.error('Simulation failed: ' + (err?.data?.message || err?.message));
    }
  };

  const overview = overviewData?.data || {};
  const kpis = overview.kpis || {};
  const conversion = overview.conversion || {};
  const reviews = overview.reviews || {};
  const listingsList = listingsData?.data?.items || [];
  const chartItems = timeseriesData?.data?.items || [];

  // Filter listings based on search term
  const filteredListings = listingsList.filter(l =>
    (l.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ranges = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' }
  ];

  const metricsList = [
    { key: 'views', label: 'Views' },
    { key: 'chats', label: 'Inquiries' },
    { key: 'wa_clicks', label: 'WhatsApp' },
    { key: 'deals', label: 'Orders' },
    { key: 'saves', label: 'Saves' },
    { key: 'shares', label: 'Shares' },
  ];

  // Helper formatting values
  const formatVal = (val) => (val || 0).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      {/* Page Header */}
      <AdminPageHeader
        icon={FiPieChart}
        title="Vendor Analytics & Insights"
        subtitle="Track real-time reel views, product clicks, phone calls, WhatsApp leads, and customer conversion rates"
      >
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Analytics Active</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="p-2.5 rounded-xl glass border border-border text-text-primary hover:text-brand-purple transition shadow-sm"
            title="Refresh Live Data"
          >
            <FiRefreshCw size={15} className={isOverviewLoading || isListingsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </AdminPageHeader>

      {/* Date Range Selector & Realtime Sync Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-4 rounded-2xl border border-white/40 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <FiCalendar className="text-text-tertiary" />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mr-1">Timeframe:</span>
          <div className="flex bg-surface-secondary/70 p-1 rounded-xl border border-border/50">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === r.key
                    ? 'gradient-brand text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(!kpis.views || kpis.views === 0) && (
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-premium transition-all active:scale-[0.98]"
            >
              {isSimulating ? <FiLoader className="animate-spin" /> : <FiZap />}
              <span>Populate Demo Traffic</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[
          { label: 'Catalog Views', value: formatVal(kpis.views), desc: 'Product/service & reel page views', icon: FiEye, color: 'from-pink-500/10 to-rose-500/10 text-pink-600 border-pink-500/20' },
          { label: 'Customer Inquiries', value: formatVal(kpis.chats_started), desc: 'Direct buyer inquiries initiated', icon: FiMessageCircle, color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-500/20' },
          { label: 'WhatsApp Clicks', value: formatVal(kpis.wa_clicks), desc: 'Direct WhatsApp chats initiated', icon: FiPhone, color: 'from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20' },
          { label: 'Total Leads', value: formatVal(kpis.leads), desc: 'Inquirers + listing watchers', icon: FiUsers, color: 'from-purple-500/10 to-violet-500/10 text-purple-600 border-purple-500/20' },
          { label: 'Engagement', value: `${formatVal(kpis.saves)} Saves / ${formatVal(kpis.shares)} Shares`, desc: 'User bookmarks & social shares', icon: FiMousePointer, color: 'from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-500/20' },
          { label: 'Orders Started', value: formatVal(kpis.deals_started), desc: 'Purchase orders placed by buyers', icon: FiTrendingUp, color: 'from-rose-500/10 to-red-500/10 text-rose-600 border-rose-500/20' },
          { label: 'Sales Delivered', value: formatVal(kpis.deals_completed), desc: 'Successfully fulfilled orders', icon: FiUserCheck, color: 'from-cyan-500/10 to-sky-500/10 text-cyan-600 border-cyan-500/20' },
          { label: 'Active Listings', value: `${kpis.listings_active || 0}/${kpis.listings_total || 0}`, desc: 'Active vs total listed catalog items', icon: FiPackage, color: 'from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-500/20' }
        ].map((c, idx) => (
          <div
            key={idx}
            className="flex flex-col glass border border-white/40 p-5 rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{c.label}</span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${c.color.split(' ')[0]} ${c.color.split(' ')[1]} ${c.color.split(' ')[3]}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-text-primary mt-1 group-hover:translate-x-0.5 transition-transform font-display">
              {isOverviewLoading ? <div className="h-8 w-24 skeleton rounded-lg" /> : c.value}
            </div>
            <span className="text-[11px] text-text-tertiary mt-2 block font-medium">{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeseries Plot card */}
        <div className="lg:col-span-2 glass border border-white/40 rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <FiActivity className="text-brand-purple" />
              <span>Metrics Timeline Over Period</span>
            </h3>
            <div className="flex flex-wrap bg-surface-secondary/70 p-1 rounded-xl border border-border/50">
              {metricsList.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    metric === m.key
                      ? 'bg-brand-purple text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {isTimeseriesLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <FiLoader className="animate-spin w-8 h-8 text-brand-purple" />
                <span className="text-xs text-text-tertiary">Loading timeline metrics...</span>
              </div>
            ) : chartItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    stroke="#94a3b8"
                    tickFormatter={(tick) => {
                      const parts = tick.split('-');
                      return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : tick;
                    }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '11px',
                      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={metric === 'views' ? 'Page Views' : metric === 'chats' ? 'Inquiries' : metric === 'wa_clicks' ? 'WhatsApp Leads' : metric === 'deals' ? 'Orders' : metric === 'saves' ? 'Bookmarks' : 'Shares'}
                    stroke="#7c3aed"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2">
                <FiInbox className="w-10 h-10 text-text-tertiary/50" />
                <span className="text-xs">No traffic data recorded in this timeframe</span>
              </div>
            )}
          </div>
        </div>

        {/* Funnel chart card */}
        <div className="glass border border-white/40 rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-6">Customer Conversion Funnel</h3>
            <div className="space-y-6">
              {[
                { name: '1. Impressions / Views', count: kpis.views || 0, pct: 100, color: 'bg-brand-purple' },
                { name: '2. Inquiries & WhatsApp', count: (kpis.chats_started || 0) + (kpis.wa_clicks || 0), pct: conversion.view_to_chat_pct || 0, color: 'bg-violet-500' },
                { name: '3. Orders Initiated', count: kpis.deals_started || 0, pct: conversion.chat_to_deal_pct || 0, color: 'bg-pink-500' },
                { name: '4. Orders Completed', count: kpis.deals_completed || 0, pct: conversion.deal_to_complete_pct || 0, color: 'bg-emerald-500' }
              ].map((step, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-text-secondary">{step.name}</span>
                    <span className="text-text-primary font-bold">
                      {formatVal(step.count)} ({i === 0 ? '100%' : `${step.pct}%`})
                    </span>
                  </div>
                  <div className="h-3 bg-surface-secondary rounded-full overflow-hidden border border-border/40">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${i === 0 ? 100 : Math.min(step.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-secondary/60 p-4 rounded-xl border border-border/60 mt-6">
            <h4 className="text-xs font-bold text-text-primary mb-1">Average Store Rating</h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-tertiary">Customer Score:</span>
              <span className="font-bold text-amber-500">★ {reviews.avg_rating || '5.0'} ({reviews.count || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Performance breakdown table */}
      <div className="glass border border-white/40 rounded-2xl shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Listings Performance Breakdown</h3>
            <p className="text-xs text-text-tertiary mt-1">Detailed real-time traffic and inquiry breakdowns across all your products and services</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Filter by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-border rounded-xl text-xs bg-surface focus:outline-none focus:ring-2 focus:ring-brand-purple/20 text-text-primary"
              />
            </div>

            {/* Sort Select */}
            <select
              value={listingSort}
              onChange={(e) => setListingSort(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl text-xs bg-surface text-text-primary focus:outline-none"
            >
              <option value="views">Sort by Views</option>
              <option value="chats">Sort by Inquiries</option>
              <option value="deals">Sort by Orders</option>
              <option value="shares">Sort by Shares</option>
              <option value="saves">Sort by Saves</option>
            </select>
          </div>
        </div>

        {isListingsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FiLoader className="animate-spin w-8 h-8 text-brand-purple" />
            <span className="text-xs text-text-tertiary">Loading listings metrics...</span>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-tertiary font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Inquiries</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Saves</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4 text-center">Boost Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredListings.map((l, idx) => (
                  <tr key={idx} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          l.type === 'service' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-orange/10 text-brand-orange'
                        }`}>
                          {l.type || 'Product'}
                        </span>
                        <div className="font-bold text-text-primary line-clamp-1">{l.title || 'Untitled Listing'}</div>
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">Price: ₹{(l.price || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-text-primary">{formatVal(l.views)}</td>
                    <td className="py-4 px-4 text-text-secondary">{formatVal(l.chats)}</td>
                    <td className="py-4 px-4 text-emerald-600 font-semibold">{formatVal(l.wa_clicks)}</td>
                    <td className="py-4 px-4 text-text-secondary">{formatVal(l.saves)}</td>
                    <td className="py-4 px-4 text-text-secondary">{formatVal(l.shares)}</td>
                    <td className="py-4 px-4 font-bold text-emerald-600">{formatVal(l.deals)}</td>
                    <td className="py-4 px-4 text-center">
                      {l.boost_expires_at ? (
                        <button
                          onClick={() => setSelectedListingForRoi(l)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                          <FiZap className="w-3 h-3 animate-pulse" /> Boost ROI
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-tertiary italic">Organic Traffic</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary gap-2 border border-dashed border-border rounded-2xl">
            <FiInbox className="w-8 h-8 opacity-50" />
            <span className="text-xs">No listings found matching search criteria</span>
          </div>
        )}
      </div>

      {/* Boost ROI Modal overlay */}
      {selectedListingForRoi && (
        <BoostRoiModal
          listing={selectedListingForRoi}
          onClose={() => setSelectedListingForRoi(null)}
        />
      )}
    </div>
  );
}

// Subcomponent: Boost ROI Analysis Modal
function BoostRoiModal({ listing, onClose }) {
  const { data: roiData, isFetching: isLoadingRoi } = useGetVendorAnalyticsBoostRoiQuery(listing.listing_id);

  const roi = roiData?.data || {};
  const during = roi.during || {};
  const baseline = roi.baseline || {};
  const lift = roi.lift_pct || {};

  const formatLift = (val) => {
    if (val === Infinity) return '+∞%';
    if (val === 0) return '0%';
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  const getLiftColor = (val) => {
    if (val > 0) return 'text-emerald-600 font-bold';
    if (val < 0) return 'text-rose-600';
    return 'text-text-tertiary';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg glass border border-white/50 rounded-3xl shadow-2xl p-6 relative flex flex-col gap-6 animate-scale-in bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-2xl shadow-md shrink-0">
            <FiZap className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Boost ROI Performance</h3>
            <p className="text-xs font-semibold text-brand-purple mt-1 line-clamp-1">{listing.title}</p>
          </div>
        </div>

        {isLoadingRoi ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FiLoader className="animate-spin w-8 h-8 text-brand-purple" />
            <span className="text-xs text-text-tertiary">Analyzing Boost Lift Performance...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-xs bg-surface-secondary p-4 rounded-2xl border border-border flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Boost Activated:</span>
                <span className="font-medium text-text-primary">
                  {roi.boost_start ? new Date(roi.boost_start).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Boost Expires:</span>
                <span className="font-medium text-text-primary">
                  {roi.boost_end ? new Date(roi.boost_end).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Boost Duration:</span>
                <span className="font-bold text-text-primary">
                  {roi.duration_days || 7} Days
                </span>
              </div>
            </div>

            {/* Performance metrics breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Lift Metrics Analysis</h4>

              {[
                { name: 'Catalog Detail Views', b: baseline.views || 0, d: during.views || 0, l: lift.views || 0, icon: FiEye },
                { name: 'Customer Inquiries', b: baseline.chats || 0, d: during.chats || 0, l: lift.chats || 0, icon: FiMessageCircle },
                { name: 'Orders Placed', b: baseline.deals || 0, d: during.deals || 0, l: lift.deals || 0, icon: FiTrendingUp }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-3 items-center py-3 border-b border-border/60 last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="font-medium text-text-secondary">{m.name}</span>
                  </div>
                  <div className="text-center text-text-tertiary">
                    <span className="block text-[9px] uppercase tracking-wider">Baseline</span>
                    <span className="font-bold">{m.b}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-brand-purple uppercase tracking-wider font-bold">During Boost</span>
                    <div className="flex justify-end items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-text-primary">{m.d}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md bg-surface-secondary border border-border ${getLiftColor(m.l)}`}>
                        {formatLift(m.l)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-brand-purple/10 border border-brand-purple/20 p-4 rounded-2xl text-[11px] text-text-secondary leading-relaxed">
              <FiInfo className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
              <span>
                <strong>How Lift is calculated:</strong> We compare customer engagement during the boost active window against a baseline period of equal duration directly prior to activation. A positive lift indicates higher customer discovery.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 glass border border-border hover:bg-surface-secondary text-text-primary text-xs font-bold rounded-xl transition-colors active:scale-95"
          >
            Close ROI Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
