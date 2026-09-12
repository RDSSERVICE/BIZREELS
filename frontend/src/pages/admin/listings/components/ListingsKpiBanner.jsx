import React from 'react';
import {
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiPackage,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';
import { formatCompactNumber, formatCurrencyINR } from './listingUtils';

export default function ListingsKpiBanner({ stats, isFetching, onSelectTab, activeTab }) {
  const cards = [
    {
      id: 'published',
      title: 'Published Catalog',
      value: formatCompactNumber(stats?.publishedCount ?? 0),
      isFormatted: true,
      sublabel: `${stats?.totalListings ?? 0} total items recorded`,
      icon: FiCheckCircle,
      accentColor: 'text-emerald-700',
      bgAccent: 'bg-emerald-500/10',
      badge: 'Active Live',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'draft',
      title: 'Draft / In Review',
      value: formatCompactNumber(stats?.draftCount ?? 0),
      isFormatted: true,
      sublabel: 'Pending vendor activation',
      icon: FiClock,
      accentColor: 'text-amber-700',
      bgAccent: 'bg-amber-500/10',
      badge: (stats?.draftCount ?? 0) > 0 ? 'Pending' : 'Clear',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'reported',
      title: 'Flagged / Moderation',
      value: formatCompactNumber(stats?.flaggedCount ?? 0),
      isFormatted: true,
      sublabel: 'Taken down or user reported',
      icon: FiAlertTriangle,
      accentColor: 'text-rose-700',
      bgAccent: 'bg-rose-500/10',
      badge: (stats?.flaggedCount ?? 0) > 0 ? 'Action Needed' : 'Clean',
      badgeColor: (stats?.flaggedCount ?? 0) > 0 ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-700'
    },
    {
      id: 'out_of_stock',
      title: 'Out of Stock',
      value: formatCompactNumber(stats?.outOfStockCount ?? 0),
      isFormatted: true,
      sublabel: 'Zero inventory items',
      icon: FiPackage,
      accentColor: 'text-orange-700',
      bgAccent: 'bg-orange-500/10',
      badge: 'Depleted',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'all',
      title: 'Catalog GMV Potential',
      value: formatCurrencyINR(stats?.totalCatalogGmv ?? 0),
      isFormatted: true,
      sublabel: `${formatCompactNumber(stats?.totalViews ?? 0)} views • ${formatCompactNumber(stats?.totalOrders ?? 0)} orders`,
      icon: FiTrendingUp,
      accentColor: 'text-[#d99a3d]',
      bgAccent: 'bg-[#d99a3d]/15',
      badge: 'Platform GMV',
      badgeColor: 'bg-[#d99a3d]/20 text-[#8c5e1b]'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-2">
      {cards.map((c) => {
        const Icon = c.icon;
        const isCurrent = activeTab === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectTab && onSelectTab(c.id)}
            className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden group ${
              isCurrent
                ? 'bg-[#fbf9f4] border-[#1a1a1a] ring-2 ring-[#1a1a1a]/10 shadow-sm'
                : 'bg-white border-[#e3dccb] hover:border-[#1a1a1a]/40'
            }`}
          >
            {/* Top Accent Icon & Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl ${c.bgAccent} ${c.accentColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-['Outfit'] ${c.badgeColor}`}>
                {c.badge}
              </span>
            </div>

            {/* Value Counter */}
            <div className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight font-['Archivo_Black']">
              {isFetching ? (
                <span className="inline-block w-12 h-6 bg-slate-200 animate-pulse rounded" />
              ) : (
                c.value
              )}
            </div>

            {/* Title & Sublabel */}
            <div className="text-xs font-bold text-[#1a1a1a]/80 mt-0.5 font-['Outfit'] truncate">
              {c.title}
            </div>
            <div className="text-[11px] text-slate-500 font-medium truncate font-['Outfit'] mt-0.5">
              {c.sublabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}
