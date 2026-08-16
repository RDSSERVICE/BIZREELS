import React from 'react';

/**
 * AdminStatCard — Reusable statistic card for admin, vendor, and creator dashboards
 */
export default function AdminStatCard({ label, value, icon: Icon, color = 'purple', trend, testId }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs hover:shadow-sm transition-all duration-200 group flex items-center justify-between gap-3 font-sans"
      data-testid={testId}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate">
          {label}
        </span>
        <h4 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight truncate">
          {value}
        </h4>
        {trend !== undefined && (
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border inline-block ${
            trend >= 0
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {Icon && (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f8f4ec] text-[#241b15] border border-[#e3dccb] flex items-center justify-center shrink-0 group-hover:bg-[#241b15] group-hover:text-[#d99a3d] transition-colors shadow-2xs">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
