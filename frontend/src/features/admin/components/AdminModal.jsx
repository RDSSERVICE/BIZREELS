import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * AdminModal — Reusable modal dialog with glassmorphism styling
 * Fully responsive: near-full-screen on mobile, constrained on desktop
 */
export default function AdminModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full ${maxWidth} max-h-[95vh] sm:max-h-[85vh] glass-strong rounded-t-2xl sm:rounded-2xl shadow-modal border border-white/50 animate-scale-in flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary font-display truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-all flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <FiX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
