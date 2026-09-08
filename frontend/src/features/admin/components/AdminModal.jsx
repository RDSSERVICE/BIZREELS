import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * AdminModal — Reusable Warm Bento-Brutalism modal dialog
 */
export default function AdminModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className={`relative w-full ${maxWidth} max-h-[95vh] sm:max-h-[88vh] bg-white text-[#1a1a1a] border border-[#e3dccb] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden z-10`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#e3dccb] bg-[#f8f4ec] flex-shrink-0">
          <h3 style={{ fontFamily: "'Outfit', 'Manrope', sans-serif" }} className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase tracking-wide truncate pr-2">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition-all flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center border border-[#e3dccb] cursor-pointer shadow-2xs"
            title="Close dialog"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1 overscroll-contain text-[#1a1a1a] bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}
