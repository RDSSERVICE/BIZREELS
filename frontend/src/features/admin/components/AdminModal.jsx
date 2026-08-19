import React from 'react';
import { FiX } from 'react-icons/fi';

/**
 * AdminModal — Reusable modal dialog with very light dark (soft slate gray #24262d) & warm gold styling
 * Fully responsive: near-full-screen on mobile, constrained on desktop
 */
export default function AdminModal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-fade-in" onClick={onClose} />

      {/* Modal Window */}
      <div className={`relative w-full ${maxWidth} max-h-[95vh] sm:max-h-[85vh] bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-950/40 animate-scale-in flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-800 bg-[#0F172A] flex-shrink-0">
          <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm sm:text-base font-black text-[#EAB308] tracking-wide truncate pr-2">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center border border-white/10 cursor-pointer"
          >
            <FiX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 overscroll-contain text-[#1a1a1a] bg-[#f8f4ec]">
          {children}
        </div>
      </div>
    </div>
  );
}





