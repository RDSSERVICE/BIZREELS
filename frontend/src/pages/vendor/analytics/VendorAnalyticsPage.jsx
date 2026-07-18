import React from 'react';
import { FiEye, FiPackage, FiTool, FiMousePointer, FiPhone, FiMessageCircle, FiUserCheck, FiUsers } from 'react-icons/fi';

export default function VendorAnalyticsPage() {
  const metrics = [
    { label: 'Reel Views', value: '128,450', icon: FiEye, color: 'text-pink-400' },
    { label: 'Product Views', value: '45,210', icon: FiPackage, color: 'text-indigo-400' },
    { label: 'Service Views', value: '18,900', icon: FiTool, color: 'text-purple-400' },
    { label: 'Clicks on Offers', value: '6,420', icon: FiMousePointer, color: 'text-amber-400' },
    { label: 'Direct Phone Calls', value: '890', icon: FiPhone, color: 'text-emerald-400' },
    { label: 'WhatsApp Clicks', value: '1,420', icon: FiMessageCircle, color: 'text-green-400' },
    { label: 'Profile Visits', value: '12,800', icon: FiUserCheck, color: 'text-cyan-400' },
    { label: 'Shop Followers', value: '3,890', icon: FiUsers, color: 'text-rose-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold text-white">Vendor Analytics & Insights</h2>
        <p className="text-xs text-slate-400">Track reel views, product clicks, phone calls, WhatsApp leads, and profile visits</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{m.label}</span>
                <Icon className={m.color} size={20} />
              </div>
              <h3 className="text-2xl font-black text-white">{m.value}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
