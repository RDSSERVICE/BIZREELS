import React from 'react';
import {
  FiFilm,
  FiZap,
  FiClock,
  FiAlertTriangle,
  FiEye,
  FiTrendingUp
} from 'react-icons/fi';
import { formatCompactNumber } from './reelUtils';

export default function ReelKpiBanner({ stats, isFetching, onSelectTab, activeTab }) {
  const cards = [
    {
      id: 'all',
      title: 'Published Catalog',
      value: stats?.totalReels ?? 0,
      sublabel: `${stats?.trendingCount ?? 0} trending videos`,
      icon: FiFilm,
      accentColor: 'text-[#1a1a1a]',
      bgAccent: 'bg-[#1a1a1a]/5',
      badge: 'Active'
    },
    {
      id: 'boosted',
      title: 'Active Boosts',
      value: stats?.boostedCount ?? 0,
      sublabel: 'Promoted for discovery',
      icon: FiZap,
      accentColor: 'text-amber-600',
      bgAccent: 'bg-amber-500/10',
      badge: 'Sponsored'
    },
    {
      id: 'review_queue',
      title: 'Review Queue',
      value: stats?.reviewQueueCount ?? 0,
      sublabel: 'Pending manual audit',
      icon: FiClock,
      accentColor: 'text-amber-700',
      bgAccent: 'bg-amber-500/15',
      badge: (stats?.reviewQueueCount ?? 0) > 0 ? 'Action Needed' : 'Clear'
    },
    {
      id: 'reported',
      title: 'Flagged Content',
      value: stats?.flaggedCount ?? stats?.reportedCount ?? 0,
      sublabel: 'AI & user reports',
      icon: FiAlertTriangle,
      accentColor: 'text-rose-600',
      bgAccent: 'bg-rose-500/10',
      badge: 'High Priority'
    },
    {
      id: 'analytics',
      title: 'Platform Views',
      value: formatCompactNumber(stats?.totalViews ?? 0),
      isFormatted: true,
      sublabel: `${formatCompactNumber(stats?.totalLikes ?? 0)} likes • ${formatCompactNumber(stats?.totalComments ?? 0)} cmts`,
      icon: FiEye,
      accentColor: 'text-[#d99a3d]',
      bgAccent: 'bg-[#d99a3d]/15',
      badge: 'All-Time'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeTab === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectTab && onSelectTab(c.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
              isActive
                ? 'bg-[#f8f4ec] border-[#1a1a1a] ring-2 ring-[#1a1a1a]/10 shadow-sm'
                : 'bg-[#f8f4ec] border-[#e3dccb] hover:border-[#1a1a1a]/40 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]/60 truncate font-['Outfit']">
                {c.title}
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${c.bgAccent} ${c.accentColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              {isFetching && stats === undefined ? (
                <div className="h-7 w-16 bg-[#e3dccb]/50 animate-pulse rounded" />
              ) : (
                <span className="text-2xl font-black tracking-tight text-[#1a1a1a] font-['Archivo_Black']">
                  {c.isFormatted ? c.value : Number(c.value).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#1a1a1a]/60 font-['Outfit']">
              <span className="truncate">{c.sublabel}</span>
              {c.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                    c.id === 'reported' && (stats?.flaggedCount ?? 0) > 0
                      ? 'bg-rose-100 text-rose-700'
                      : c.id === 'review_queue' && (stats?.reviewQueueCount ?? 0) > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#e3dccb]/50 text-[#1a1a1a]/70'
                  }`}
                >
                  {c.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
