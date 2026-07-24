import React from 'react';

/**
 * AdminTabBar — Horizontal tab navigation for admin sub-pages
 * Fully responsive with touch-friendly scrolling on mobile
 */
export default function AdminTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-border bg-transparent relative">
      {/* Gradient fade on right edge to indicate scrollability */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-secondary to-transparent z-10 sm:hidden" />

      <div
        className="flex gap-0.5 sm:gap-1 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-3 sm:px-4 py-2.5 sm:py-2.5 text-[11px] sm:text-xs font-bold border-b-2 transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer min-h-[44px] flex-shrink-0 ${
                isActive
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-text-tertiary hover:text-brand-purple hover:border-brand-purple/30'
              }`}
              style={{ scrollSnapAlign: 'start' }}
              data-testid={`tab-${tab.key}`}
            >
              {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-0.5 sm:ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  isActive ? 'bg-brand-purple/10 text-brand-purple' : 'bg-surface-tertiary text-text-tertiary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
