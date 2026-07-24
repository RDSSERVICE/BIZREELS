import React from 'react';

/**
 * AdminPageHeader — Consistent page header with title, description, and optional actions
 * Fully responsive: stacks vertically on mobile, horizontal on desktop
 */
export default function AdminPageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 md:p-6 border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
        {Icon && (
          <div className="p-2.5 sm:p-3 gradient-brand rounded-xl sm:rounded-2xl text-white shadow-premium flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-text-primary font-display truncate">{title}</h2>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-text-tertiary mt-0.5 sm:mt-1 line-clamp-2">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
