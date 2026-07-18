import React from 'react';

/**
 * AdminTabBar — Horizontal tab navigation for admin sub-pages
 */
export default function AdminTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-border bg-transparent">
      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-text-tertiary hover:text-brand-purple hover:border-brand-purple/30'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
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
