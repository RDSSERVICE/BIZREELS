import React from 'react';

/**
 * AdminTabBar — Horizontal Warm Bento-Brutalism tab navigation
 */
export default function AdminTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-[#e3dccb] bg-transparent relative font-sans">
      {/* Gradient fade on right edge to indicate scrollability */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#fbf9f4] to-transparent z-10 sm:hidden" />

      <div
        className="flex gap-1 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-black border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer min-h-[44px] flex-shrink-0 ${
                isActive
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-slate-400 hover:text-[#1a1a1a] hover:border-[#e3dccb]'
              }`}
              style={{ scrollSnapAlign: 'start' }}
              data-testid={`tab-${tab.key}`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-[#d99a3d]' : 'text-slate-400'}`} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f8f4ec] text-slate-500 border-[#e3dccb]'
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
