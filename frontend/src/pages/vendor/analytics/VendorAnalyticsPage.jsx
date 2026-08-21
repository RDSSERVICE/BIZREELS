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
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorAnalyticsPage() {
  const { bi, t } = useLanguage();
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
    { key: '7d', label: bi('7 Days', '7 दिन (7 Days)') },
    { key: '30d', label: bi('30 Days', '30 दिन (30 Days)') },
    { key: '90d', label: bi('90 Days', '90 दिन (90 Days)') },
    { key: 'all', label: bi('All Time', 'सभी समय (All Time)') }
  ];

  const metricsList = [
    { key: 'views', label: bi('Views', 'दृश्य (Views)') },
    { key: 'chats', label: bi('Inquiries', 'पूछताछ (Inquiries)') },
    { key: 'wa_clicks', label: bi('WhatsApp', 'व्हाट्सएप (WhatsApp)') },
    { key: 'deals', label: bi('Orders', 'ऑर्डर (Orders)') },
    { key: 'saves', label: bi('Saves', 'सहेजे गए (Saves)') },
    { key: 'shares', label: bi('Shares', 'शेयर (Shares)') },
  ];

  // Helper formatting values
  const formatVal = (val) => (val || 0).toLocaleString();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans animate-fade-in pb-12 p-2 sm:p-4">
      {/* Page Header */}
      <AdminPageHeader
        icon={FiPieChart}
        title={bi('Vendor Analytics & Insights', 'विक्रेता एनालिटिक्स और अंतर्दृष्टि (Analytics & Insights)')}
        subtitle={bi('Track real-time reel views, product clicks, phone calls, WhatsApp leads, and customer conversion rates', 'वास्तविक समय में रील विज़िट, उत्पाद क्लिक, फोन कॉल, व्हाट्सएप लीड और ग्राहक रूपांतरण दर ट्रैक करें')}
      >
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>{bi('Live Analytics Active', 'लाइव एनालिटिक्स सक्रिय')}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="p-2.5 rounded-xl bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] transition shadow-2xs border-none cursor-pointer"
            title="Refresh Live Data"
          >
            <FiRefreshCw size={15} className={isOverviewLoading || isListingsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </AdminPageHeader>

      {/* Date Range Selector & Realtime Sync Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <FiCalendar className="text-[#d99a3d]" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">Timeframe:</span>
          <div className="flex bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb]">
            {ranges.map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  range === r.key
                    ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                    : 'text-slate-600 hover:text-[#1a1a1a]'
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
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] disabled:opacity-50 text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer border-none"
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
          { label: 'Catalog Views', value: formatVal(kpis.views), desc: 'Product/service & reel page views', icon: FiEye },
          { label: 'Customer Inquiries', value: formatVal(kpis.chats_started), desc: 'Direct buyer inquiries initiated', icon: FiMessageCircle },
          { label: 'WhatsApp Clicks', value: formatVal(kpis.wa_clicks), desc: 'Direct WhatsApp chats initiated', icon: FiPhone },
          { label: 'Total Leads', value: formatVal(kpis.leads), desc: 'Inquirers + listing watchers', icon: FiUsers },
          { label: 'Engagement', value: `${formatVal(kpis.saves)} Saves / ${formatVal(kpis.shares)} Shares`, desc: 'User bookmarks & social shares', icon: FiMousePointer },
          { label: 'Orders Started', value: formatVal(kpis.deals_started), desc: 'Purchase orders placed by buyers', icon: FiTrendingUp },
          { label: 'Sales Delivered', value: formatVal(kpis.deals_completed), desc: 'Successfully fulfilled orders', icon: FiUserCheck },
          { label: 'Active Listings', value: `${kpis.listings_active || 0}/${kpis.listings_total || 0}`, desc: 'Active vs total listed catalog items', icon: FiPackage }
        ].map((c, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-white border border-[#e3dccb] p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all group justify-between"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
              <div className="w-9 h-9 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black shadow-2xs">
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] mt-1 group-hover:translate-x-0.5 transition-transform">
                {isOverviewLoading ? <div className="h-8 w-24 bg-[#f8f4ec] animate-pulse rounded-lg" /> : c.value}
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block font-medium">{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeseries Plot card */}
        <div className="lg:col-span-2 bg-white border border-[#e3dccb] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e3dccb] pb-3">
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
              <FiActivity className="text-[#d99a3d]" />
              <span>Metrics Timeline Over Period</span>
            </h3>
            <div className="flex flex-wrap bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb]">
              {metricsList.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    metric === m.key
                      ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
                      : 'text-slate-600 hover:text-[#1a1a1a]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {isTimeseriesLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <FiLoader className="animate-spin w-8 h-8 text-[#241b15]" />
                <span className="text-xs text-slate-500 font-bold">Loading timeline metrics...</span>
              </div>
            ) : chartItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#241b15" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#241b15" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3dccb" opacity={0.6} />
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
                      background: '#241b15',
                      borderRadius: '12px',
                      border: '1px solid #241b15',
                      color: '#d99a3d',
                      fontSize: '11px',
                      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={metric === 'views' ? 'Page Views' : metric === 'chats' ? 'Inquiries' : metric === 'wa_clicks' ? 'WhatsApp Leads' : metric === 'deals' ? 'Orders' : metric === 'saves' ? 'Bookmarks' : 'Shares'}
                    stroke="#241b15"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <FiInbox className="w-10 h-10 opacity-50" />
                <span className="text-xs font-bold">No traffic data recorded in this timeframe</span>
              </div>
            )}
          </div>
        </div>

        {/* Funnel chart card */}
        <div className="bg-white border border-[#e3dccb] rounded-2xl p-5 shadow-2xs flex flex-col justify-between font-sans">
          <div>
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide mb-5 border-b border-[#e3dccb] pb-3">
              Customer Conversion Funnel
            </h3>
            <div className="space-y-5">
              {[
                { name: '1. Impressions / Views', count: kpis.views || 0, pct: 100, color: 'bg-[#241b15]' },
                { name: '2. Inquiries & WhatsApp', count: (kpis.chats_started || 0) + (kpis.wa_clicks || 0), pct: conversion.view_to_chat_pct || 0, color: 'bg-[#3a2c22]' },
                { name: '3. Orders Initiated', count: kpis.deals_started || 0, pct: conversion.chat_to_deal_pct || 0, color: 'bg-[#d99a3d]' },
                { name: '4. Orders Completed', count: kpis.deals_completed || 0, pct: conversion.deal_to_complete_pct || 0, color: 'bg-emerald-700' }
              ].map((step, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{step.name}</span>
                    <span className="text-[#1a1a1a] font-black">
                      {formatVal(step.count)} ({i === 0 ? '100%' : `${step.pct}%`})
                    </span>
                  </div>
                  <div className="h-3 bg-[#f8f4ec] rounded-full overflow-hidden border border-[#e3dccb]">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${i === 0 ? 100 : Math.min(step.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] mt-5">
            <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] mb-1">Average Store Rating</h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">Customer Score:</span>
              <span className="font-black text-[#d99a3d]">★ {reviews.avg_rating || '5.0'} ({reviews.count || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Performance breakdown table */}
      <div className="bg-white border border-[#e3dccb] rounded-2xl shadow-2xs p-5 sm:p-6 space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide">Listings Performance Breakdown</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Detailed real-time traffic and inquiry breakdowns across all your products and services</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-[#e3dccb] rounded-xl text-xs bg-[#f8f4ec] font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            {/* Sort Select */}
            <select
              value={listingSort}
              onChange={(e) => setListingSort(e.target.value)}
              className="px-3 py-2 border border-[#e3dccb] rounded-xl text-xs bg-[#f8f4ec] font-bold text-[#1a1a1a] focus:outline-none cursor-pointer"
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
            <FiLoader className="animate-spin w-8 h-8 text-[#241b15]" />
            <span className="text-xs text-slate-500 font-bold">Loading listings metrics...</span>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e3dccb] bg-[#f8f4ec] text-[#241b15] font-black uppercase tracking-wider text-[10px]">
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
              <tbody className="divide-y divide-[#e3dccb]">
                {filteredListings.map((l, idx) => (
                  <tr key={idx} className="hover:bg-[#f8f4ec]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#241b15] text-[#d99a3d]">
                          {l.type || 'Product'}
                        </span>
                        <div className="font-bold text-[#1a1a1a] line-clamp-1">{l.title || 'Untitled Listing'}</div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">Price: ₹{(l.price || 0).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#1a1a1a]">{formatVal(l.views)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-bold">{formatVal(l.chats)}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-extrabold">{formatVal(l.wa_clicks)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-bold">{formatVal(l.saves)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-bold">{formatVal(l.shares)}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">{formatVal(l.deals)}</td>
                    <td className="py-3.5 px-4 text-center">
                      {l.boost_expires_at ? (
                        <button
                          type="button"
                          onClick={() => setSelectedListingForRoi(l)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] font-black text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer border-none"
                        >
                          <FiZap className="w-3 h-3 text-[#d99a3d]" /> Boost ROI
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">Organic Traffic</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 border border-dashed border-[#e3dccb] rounded-2xl">
            <FiInbox className="w-8 h-8 opacity-50" />
            <span className="text-xs font-bold">No listings found matching search criteria</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div
        className="w-full max-w-lg bg-white border-2 border-[#241b15] rounded-2xl shadow-2xl p-5 sm:p-6 relative flex flex-col gap-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-[#f8f4ec] text-[#241b15] hover:bg-[#e3dccb] transition-colors cursor-pointer border-none"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex gap-3.5 items-start border-b border-[#e3dccb] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black shadow-2xs shrink-0">
            <FiZap className="w-5 h-5 text-[#d99a3d]" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-[#1a1a1a] tracking-wide">Boost ROI Performance</h3>
            <p className="text-xs font-bold text-[#d99a3d] mt-0.5 line-clamp-1">{listing.title}</p>
          </div>
        </div>

        {isLoadingRoi ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FiLoader className="animate-spin w-8 h-8 text-[#241b15]" />
            <span className="text-xs text-slate-500 font-bold">Analyzing Boost Lift Performance...</span>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-xs bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb] flex flex-col gap-2 font-bold">
              <div className="flex justify-between">
                <span className="text-slate-500">Boost Activated:</span>
                <span className="text-[#1a1a1a]">
                  {roi.boost_start ? new Date(roi.boost_start).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boost Expires:</span>
                <span className="text-[#1a1a1a]">
                  {roi.boost_end ? new Date(roi.boost_end).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boost Duration:</span>
                <span className="font-black text-[#1a1a1a]">
                  {roi.duration_days || 7} Days
                </span>
              </div>
            </div>

            {/* Performance metrics breakdown */}
            <div className="space-y-3">
              <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs uppercase text-slate-400 tracking-wider">Lift Metrics Analysis</h4>

              {[
                { name: 'Catalog Detail Views', b: baseline.views || 0, d: during.views || 0, l: lift.views || 0, icon: FiEye },
                { name: 'Customer Inquiries', b: baseline.chats || 0, d: during.chats || 0, l: lift.chats || 0, icon: FiMessageCircle },
                { name: 'Orders Placed', b: baseline.deals || 0, d: during.deals || 0, l: lift.deals || 0, icon: FiTrendingUp }
              ].map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-3 items-center py-2.5 border-b border-[#e3dccb] last:border-b-0 text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <m.icon className="w-3.5 h-3.5 text-[#d99a3d]" />
                    <span className="text-slate-700">{m.name}</span>
                  </div>
                  <div className="text-center text-slate-500">
                    <span className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400">Baseline</span>
                    <span className="font-bold text-[#1a1a1a]">{m.b}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8.5px] text-[#d99a3d] uppercase tracking-widest font-black">During Boost</span>
                    <div className="flex justify-end items-center gap-1.5 mt-0.5">
                      <span className="font-black text-[#1a1a1a]">{m.d}</span>
                      <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md bg-[#f8f4ec] border border-[#e3dccb] ${getLiftColor(m.l)}`}>
                        {formatLift(m.l)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-[#f8f4ec] border border-[#e3dccb] p-3.5 rounded-xl text-[11px] text-slate-600 leading-relaxed font-medium">
              <FiInfo className="w-4 h-4 text-[#d99a3d] shrink-0 mt-0.5" />
              <span>
                <strong>How Lift is calculated:</strong> We compare customer engagement during the boost active window against a baseline period of equal duration directly prior to activation. A positive lift indicates higher customer discovery.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#e3dccb]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] text-xs font-black transition cursor-pointer border-none shadow-2xs"
          >
            Close ROI Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
