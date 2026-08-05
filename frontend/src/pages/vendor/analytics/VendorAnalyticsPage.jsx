import React, { useState } from 'react';
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
  FiLoader
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

  // RTK Queries
  const { data: overviewData, isFetching: isOverviewLoading, refetch: refetchOverview } = useGetVendorAnalyticsOverviewQuery(range);
  const { data: listingsData, isFetching: isListingsLoading, refetch: refetchListings } = useGetVendorAnalyticsListingsQuery({ range, sort: listingSort, limit: 20 });
  const { data: timeseriesData, isFetching: isTimeseriesLoading, refetch: refetchTimeseries } = useGetVendorAnalyticsTimeseriesQuery({ range, metric });
  const [simulateTraffic, { isLoading: isSimulating }] = useSimulateVendorAnalyticsMutation();

  const handleSimulate = async () => {
    try {
      await simulateTraffic().unwrap();
      // Refetch queries after simulating
      refetchOverview();
      refetchListings();
      refetchTimeseries();
    } catch (err) {
      console.error('Simulation failed:', err);
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
    { key: 'chats', label: 'Chats Started' },
    { key: 'deals', label: 'Deals Started' }
  ];

  // Helper formatting values
  const formatVal = (val) => (val || 0).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      {/* Page Header */}
      <AdminPageHeader
        icon={FiPieChart}
        title="Vendor Analytics & Insights"
        subtitle="Track reel views, product clicks, phone calls, WhatsApp leads, and overall customer conversion rates"
      />

      {/* Date Range Selector & Simulate Traffic Devtool */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Timeframe:</span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  range === r.key
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-400 disabled:to-slate-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          {isSimulating ? (
            <>
              <FiLoader className="animate-spin" /> Simulating...
            </>
          ) : (
            <>
              <FiZap /> Simulate Live Traffic
            </>
          )}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Listing Views', value: formatVal(kpis.views), desc: 'Total product/service detail views', icon: FiEye, color: 'from-pink-500/10 to-rose-500/10 text-pink-600 border-pink-500/20' },
          { label: 'Conversations', value: formatVal(kpis.chats_started), desc: 'Unique buyer chats initiated', icon: FiMessageCircle, color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-500/20' },
          { label: 'WhatsApp Leads', value: formatVal(kpis.wa_clicks), desc: 'Clicks to open your WhatsApp', icon: FiPhone, color: 'from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20' },
          { label: 'Total Leads', value: formatVal(kpis.leads), desc: 'Chatters + listing watchers', icon: FiUsers, color: 'from-purple-500/10 to-violet-500/10 text-purple-600 border-purple-500/20' },
          { label: 'Engagement', value: `${formatVal(kpis.saves)} Saves / ${formatVal(kpis.shares)} Shares`, desc: 'User bookmarks and shares', icon: FiMousePointer, color: 'from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-500/20' },
          { label: 'Deals Started', value: formatVal(kpis.deals_started), desc: 'Orders initiated by buyers', icon: FiTrendingUp, color: 'from-rose-500/10 to-red-500/10 text-rose-600 border-rose-500/20' },
          { label: 'Sales Completed', value: formatVal(kpis.deals_completed), desc: 'Successfully finalized orders', icon: FiUserCheck, color: 'from-cyan-500/10 to-sky-500/10 text-cyan-600 border-cyan-500/20' },
          { label: 'Active Listings', value: `${kpis.listings_active || 0}/${kpis.listings_total || 0}`, desc: 'Active vs total listed items', icon: FiPackage, color: 'from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-500/20' }
        ].map((c, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.label}</span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br border ${c.color.split(' ')[0]} ${c.color.split(' ')[1]} ${c.color.split(' ')[3]}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1 group-hover:translate-x-0.5 transition-transform">
              {isOverviewLoading ? <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" /> : c.value}
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Helper Banner for Empty Data */}
      {!isOverviewLoading && !kpis.views && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <FiInfo /> No Customer Traffic Data Yet
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              Since this is a fresh test account, you haven't received any customer clicks or views. Use the simulator tool above to instantly populate 30 days of realistic customer traffic, product views, and WhatsApp clicks!
            </p>
          </div>
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm shrink-0"
          >
            {isSimulating ? <FiLoader className="animate-spin" /> : <><FiZap /> Populate Demo Data</>}
          </button>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeseries Plot card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Metrics Over Time</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {metricsList.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    metric === m.key
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
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
                <FiLoader className="animate-spin w-8 h-8 text-indigo-500" />
                <span className="text-xs text-slate-400">Loading timeline...</span>
              </div>
            ) : chartItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9 }}
                    stroke="#9CA3AF"
                    tickFormatter={(tick) => {
                      const parts = tick.split('-');
                      return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : tick;
                    }}
                  />
                  <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={metric === 'views' ? 'Page Views' : metric === 'chats' ? 'Chats' : 'Deals'}
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <FiInbox className="w-10 h-10 text-slate-300" />
                <span className="text-xs">No traffic data recorded in this range</span>
              </div>
            )}
          </div>
        </div>

        {/* Funnel chart card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Conversion Funnel</h3>
            <div className="space-y-6">
              {[
                { name: '1. Impressions / Views', count: kpis.views || 0, pct: 100, color: 'bg-indigo-500' },
                { name: '2. WhatsApp / Chats', count: (kpis.chats_started || 0) + (kpis.wa_clicks || 0), pct: conversion.view_to_chat_pct || 0, color: 'bg-purple-500' },
                { name: '3. Deals Started', count: kpis.deals_started || 0, pct: conversion.chat_to_deal_pct || 0, color: 'bg-pink-500' },
                { name: '4. Deals Finalized', count: kpis.deals_completed || 0, pct: conversion.deal_to_complete_pct || 0, color: 'bg-emerald-500' }
              ].map((step, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">{step.name}</span>
                    <span className="text-slate-800 dark:text-white font-bold">
                      {step.count} ({i === 0 ? '100%' : `${step.pct}%`})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${i === 0 ? 100 : Math.min(step.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 mt-6">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Average Vendor Score</h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Rating Avg:</span>
              <span className="font-semibold text-amber-500">★ {reviews.avg_rating || '5.0'} ({reviews.count || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Performance breakdown table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Listings Performance Breakdown</h3>
            <p className="text-xs text-slate-400 mt-1">Detailed traffic and click breakdowns for each product and service listing</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/30 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Sort Select */}
            <select
              value={listingSort}
              onChange={(e) => setListingSort(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="views">Sort by Views</option>
              <option value="chats">Sort by Chats</option>
              <option value="deals">Sort by Deals</option>
              <option value="shares">Sort by Shares</option>
            </select>
          </div>
        </div>

        {isListingsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FiLoader className="animate-spin w-8 h-8 text-indigo-500" />
            <span className="text-xs text-slate-400">Loading listings metrics...</span>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Listing Title</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Chats</th>
                  <th className="py-3 px-4">WhatsApp Clicks</th>
                  <th className="py-3 px-4">Saves</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4">Deals</th>
                  <th className="py-3 px-4 text-center">Boost Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredListings.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 dark:text-white line-clamp-1">{l.title || 'Untitled Listing'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {l.listing_id}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">{formatVal(l.views)}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{formatVal(l.chats)}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{formatVal(l.wa_clicks)}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{formatVal(l.saves)}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{formatVal(l.shares)}</td>
                    <td className="py-4 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{formatVal(l.deals)}</td>
                    <td className="py-4 px-4 text-center">
                      {l.boost_expires_at ? (
                        <button
                          onClick={() => setSelectedListingForRoi(l)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm active:scale-95 transition-all"
                        >
                          <FiZap className="w-3 h-3 animate-pulse" /> Boost ROI
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Active Boost</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <FiInbox className="w-8 h-8 text-slate-300" />
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
    if (val > 0) return 'text-emerald-600 dark:text-emerald-400 font-bold';
    if (val < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 relative flex flex-col gap-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-2xl shadow-md shrink-0">
            <FiZap className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Boost ROI Performance</h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 line-clamp-1">{listing.title}</p>
          </div>
        </div>

        {isLoadingRoi ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FiLoader className="animate-spin w-8 h-8 text-indigo-500" />
            <span className="text-xs text-slate-400">Analyzing Boost Lift Performance...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Boost Activated:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {roi.boost_start ? new Date(roi.boost_start).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boost Expires:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {roi.boost_end ? new Date(roi.boost_end).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boost Duration:</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {roi.duration_days || 7} Days
                </span>
              </div>
            </div>

            {/* Performance metrics breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lift Metrics Analysis</h4>

              {[
                { name: 'Detail Page Views', b: baseline.views || 0, d: during.views || 0, l: lift.views || 0, icon: FiEye },
                { name: 'Customer Inquiries', b: baseline.chats || 0, d: during.chats || 0, l: lift.chats || 0, icon: FiMessageCircle },
                { name: 'Deals Started', b: baseline.deals || 0, d: during.deals || 0, l: lift.deals || 0, icon: FiTrendingUp }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-3 items-center py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
                  </div>
                  <div className="text-center text-slate-400">
                    <span className="block text-[9px] uppercase tracking-wider">Baseline</span>
                    <span className="font-semibold">{m.b}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-indigo-500 uppercase tracking-wider">During Boost</span>
                    <div className="flex justify-end items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-slate-800 dark:text-white">{m.d}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 ${getLiftColor(m.l)}`}>
                        {formatLift(m.l)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/20 p-4.5 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <FiInfo className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>How Lift is calculated:</strong> We compare event traffic during the boost active window against a baseline period of equal duration directly prior to activation. A positive lift indicates higher customer engagement.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors active:scale-95"
          >
            Close ROI Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
