import React from 'react';

/**
 * AdminPageHeader — Consistent page header with title, description, and optional actions
 * Fully responsive: stacks vertically on mobile, horizontal on desktop
 */
export default function AdminPageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 font-sans">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
        {Icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#241b15] text-[#d99a3d] border border-[#241b15] flex items-center justify-center shrink-0 shadow-xs">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#d99a3d]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base sm:text-lg md:text-xl uppercase text-[#1a1a1a] tracking-wide truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">{subtitle}</p>
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
