import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * AdminModal — Reusable modal dialog with glassmorphism styling
 */
export default function AdminModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full ${maxWidth} glass-strong rounded-2xl shadow-modal border border-white/50 animate-scale-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-text-primary font-display">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-all"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
