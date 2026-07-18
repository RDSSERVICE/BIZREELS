import React from 'react';

/**
 * AdminPageHeader — Consistent page header with title, description, and optional actions
 */
export default function AdminPageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/50 shadow-glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 gradient-brand rounded-2xl text-white shadow-premium">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-black text-text-primary font-display">{title}</h2>
          {subtitle && (
            <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
