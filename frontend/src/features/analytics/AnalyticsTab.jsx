import React from 'react';
import { FiTrendingUp, FiEye, FiUsers, FiPhone, FiMessageSquare, FiExternalLink, FiMousePointer } from 'react-icons/fi';

const AnalyticsTab = ({ user }) => {
  const stats = [
    { label: 'Reel Views', val: '24.8K', change: '+12% this month', icon: FiEye, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Product Views', val: '5.2K', change: '+8% this month', icon: FiExternalLink, color: 'text-brand-pink', bg: 'bg-brand-pink/10' },
    { label: 'Service Views', val: '1.4K', change: '+4% this month', icon: FiExternalLink, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { label: 'Clicks', val: '840', change: '+15% this week', icon: FiMousePointer, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Calls', val: '92', change: '+19% this week', icon: FiPhone, color: 'text-success', bg: 'bg-success/10' },
    { label: 'WhatsApp Clicks', val: '312', change: '+22% this week', icon: FiMessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Profile Visits', val: '3,840', change: '+10% this month', icon: FiUsers, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Followers Growth', val: `+${user?.followersCount || 24}`, change: 'Realtime updates', icon: FiTrendingUp, color: 'text-brand-pink', bg: 'bg-brand-pink/10' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center px-1 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Analytics & Conversion Metrics</h3>
          <p className="text-xs text-slate-500 mt-1">Real-time statistics monitor on conversion events, views, and reach.</p>
        </div>
      </div>

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

      {/* Analytics Charts Mockup Graphic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Weekly reach curve simulation */}
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">Weekly Views Trend</h4>
          <div className="h-48 w-full flex items-end justify-between px-2 pt-4 gap-1">
            {/* Draw animated bars/graphs */}
            {[40, 55, 45, 60, 85, 70, 95].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center flex-grow gap-2">
                <span className="text-[9px] font-bold text-slate-400">{val * 10}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-purple/70 to-brand-purple hover:opacity-90 transition-opacity cursor-pointer relative group"
                  style={{ height: `${val * 1.3}px` }}
                >
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-brand-navy text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10">
                    Views: {val * 10}
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-bold">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp & Call conversions distribute */}
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2">User Inquiries Distrib.</h4>
          <div className="flex flex-col gap-4 py-3 justify-center">
            {[
              { type: 'WhatsApp Leads', val: 312, total: 496, color: 'bg-emerald-500' },
              { type: 'Direct Calls', val: 92, total: 496, color: 'bg-brand-purple' },
              { type: 'Quote Bids', val: 92, total: 496, color: 'bg-brand-pink' }
            ].map((lead, idx) => {
              const percentage = Math.round((lead.val / lead.total) * 100);
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>{lead.type} ({lead.val})</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${lead.color} rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
