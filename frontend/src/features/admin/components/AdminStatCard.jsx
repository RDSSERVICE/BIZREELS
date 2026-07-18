import React from 'react';

/**
 * AdminStatCard — Reusable statistic card for admin dashboard
 */
export default function AdminStatCard({ label, value, icon: Icon, color = 'purple', trend, testId }) {
  const colorMap = {
    purple: { bg: 'bg-brand-purple/10', text: 'text-brand-purple', border: 'border-brand-purple/20' },
    orange: { bg: 'bg-brand-orange/10', text: 'text-brand-orange', border: 'border-brand-orange/20' },
    pink:   { bg: 'bg-brand-pink/10',   text: 'text-brand-pink',   border: 'border-brand-pink/20' },
    green:  { bg: 'bg-emerald-500/10',  text: 'text-emerald-500',  border: 'border-emerald-500/20' },
    blue:   { bg: 'bg-blue-500/10',     text: 'text-blue-500',     border: 'border-blue-500/20' },
    amber:  { bg: 'bg-amber-500/10',    text: 'text-amber-500',    border: 'border-amber-500/20' },
    red:    { bg: 'bg-red-500/10',      text: 'text-red-500',      border: 'border-red-500/20' },
    indigo: { bg: 'bg-indigo-500/10',   text: 'text-indigo-500',   border: 'border-indigo-500/20' },
    cyan:   { bg: 'bg-cyan-500/10',     text: 'text-cyan-500',     border: 'border-cyan-500/20' },
    sky:    { bg: 'bg-sky-500/10',      text: 'text-sky-500',      border: 'border-sky-500/20' },
    teal:   { bg: 'bg-teal-500/10',     text: 'text-teal-500',     border: 'border-teal-500/20' },
    rose:   { bg: 'bg-rose-500/10',     text: 'text-rose-500',     border: 'border-rose-500/20' },
    violet: { bg: 'bg-violet-500/10',   text: 'text-violet-500',   border: 'border-violet-500/20' },
  };

  const c = colorMap[color] || colorMap.purple;

  return (
    <div
      className={`glass rounded-2xl p-5 border ${c.border} shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            {label}
          </span>
          <h4 className="text-2xl font-black text-text-primary mt-1 font-display truncate">
            {value}
          </h4>
          {trend !== undefined && (
            <span className={`text-[10px] font-bold mt-1 inline-block ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className={`p-3 ${c.bg} ${c.text} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
}
