import React from 'react';
import { FiTrendingUp, FiEye, FiUsers, FiPhone, FiMessageSquare, FiExternalLink, FiMousePointer, FiPackage, FiTool, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import { useGetVendorAnalyticsOverviewQuery, useGetVendorDashboardQuery } from '../vendor/vendorApi';
import Loader from '../../components/common/Loader';

const AnalyticsTab = ({ user }) => {
  const { data: overviewRes, isLoading: isOverviewLoading } = useGetVendorAnalyticsOverviewQuery('30d', { pollingInterval: 30000 });
  const { data: dashboardRes, isLoading: isDashboardLoading } = useGetVendorDashboardQuery(undefined, { pollingInterval: 30000 });

  const overview = overviewRes?.data || {};
  const kpis = overview.kpis || {};
  const conversion = overview.conversion || {};
  const dashboard = dashboardRes?.data || dashboardRes || {};

  const stats = [
    { label: 'Reel Views', val: (kpis.totalReelViews ?? dashboard.totalViews ?? 0).toLocaleString('en-IN'), change: 'Last 30 Days', icon: FiEye, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Product Views', val: (kpis.totalProductViews ?? dashboard.totalProducts ?? 0).toLocaleString('en-IN'), change: 'Listing Impressions', icon: FiPackage, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
    { label: 'Service Views', val: (kpis.totalServiceViews ?? dashboard.totalServices ?? 0).toLocaleString('en-IN'), change: 'Service Inquiries', icon: FiTool, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { label: 'Total Inquiries', val: (dashboard.leadEnquiries ?? kpis.totalEnquiries ?? 0).toLocaleString('en-IN'), change: 'Customer Leads', icon: FiMessageSquare, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Total Orders', val: (dashboard.totalOrders ?? 0).toLocaleString('en-IN'), change: 'Purchases & Deals', icon: FiShoppingCart, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Gross Revenue', val: `₹${(dashboard.totalSales ?? 0).toLocaleString('en-IN')}`, change: 'Total Completed Sales', icon: FiDollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Store Followers', val: (dashboard.followers ?? user?.followersCount ?? 0).toLocaleString('en-IN'), change: 'Customer Network', icon: FiUsers, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Wallet Balance', val: `₹${(dashboard.walletBalance ?? user?.walletBalance ?? 0).toLocaleString('en-IN')}`, change: 'Available Credits', icon: FiTrendingUp, color: 'text-brand-pink', bg: 'bg-brand-pink/10' }
  ];

  const isLoading = isOverviewLoading && isDashboardLoading;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Analytics & Conversion Metrics</h3>
          <p className="text-xs text-slate-500 mt-1">Real-time statistics monitor on conversion events, views, and reach.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader /></div>
      ) : (
        <>
          {/* Grid statistics metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="glass p-4 rounded-2xl border border-white/50 shadow-glass flex items-center justify-between group hover:shadow-premium transition-all duration-300">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <span className="text-xl font-black text-brand-navy font-display mt-1.5">{item.val}</span>
                    <span className="text-[9px] text-slate-500 mt-1 font-semibold">{item.change}</span>
                  </div>
                  <div className={`p-3 ${item.bg} ${item.color} rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-3">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">Engagement Breakdown</h4>
              <div className="flex flex-col gap-3 py-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Reel Views</span>
                  <span className="font-bold text-brand-navy">{(kpis.totalReelViews ?? dashboard.totalViews ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Listing Views</span>
                  <span className="font-bold text-brand-navy">{((kpis.totalProductViews || 0) + (kpis.totalServiceViews || 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Customer Enquiries</span>
                  <span className="font-bold text-brand-navy">{(dashboard.leadEnquiries ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-3">
              <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">Store Performance Status</h4>
              <div className="flex flex-col gap-3 py-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Completed Orders</span>
                  <span className="font-bold text-emerald-600">{(dashboard.totalOrders ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Total Sales Generated</span>
                  <span className="font-bold text-brand-purple">₹{(dashboard.totalSales ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Followers Base</span>
                  <span className="font-bold text-brand-orange">{(dashboard.followers ?? user?.followersCount ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;

