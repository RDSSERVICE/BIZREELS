import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiTool } from 'react-icons/fi';

/**
 * AdminComingSoon — Placeholder for admin modules under construction
 */
export default function AdminComingSoon({ title, description }) {
  const location = useLocation();
  const pageName = title || location.pathname.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="glass rounded-3xl p-12 border border-white/50 shadow-glass text-center">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6 shadow-premium">
          <FiTool className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-text-primary font-display mb-2">{pageName}</h2>
        <p className="text-sm text-text-tertiary max-w-md mx-auto mb-6">
          {description || 'This module is currently under development and will be available soon. Stay tuned for updates!'}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
          <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          Under Construction
        </div>
      </div>
    </div>
  );
}
