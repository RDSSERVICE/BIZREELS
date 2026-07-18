import React from 'react';

/**
 * AdminStatusBadge — Consistent status badge with semantic colors
 */
const statusStyles = {
  active:    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  verified:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  approved:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  success:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  published: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  paid:      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  paid_out:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending:   'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accrued:   'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing:'bg-amber-500/10 text-amber-600 border-amber-500/20',
  draft:     'bg-slate-500/10 text-slate-500 border-slate-500/20',
  unverified:'bg-slate-500/10 text-slate-500 border-slate-500/20',
  inactive:  'bg-slate-500/10 text-slate-500 border-slate-500/20',
  expired:   'bg-slate-500/10 text-slate-500 border-slate-500/20',
  rejected:  'bg-red-500/10 text-red-600 border-red-500/20',
  suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
  blocked:   'bg-red-500/10 text-red-600 border-red-500/20',
  banned:    'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  failed:    'bg-red-500/10 text-red-600 border-red-500/20',
  deleted:   'bg-red-500/10 text-red-600 border-red-500/20',
  dismissed: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  resolved:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  boosted:   'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
  reported:  'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function AdminStatusBadge({ status, className = '' }) {
  const statusKey = (status || 'unknown').toLowerCase().replace(/\s+/g, '_');
  const style = statusStyles[statusKey] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${style} ${className}`}>
      {status || 'Unknown'}
    </span>
  );
}
