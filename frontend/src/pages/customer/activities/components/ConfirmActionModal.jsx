import React from 'react';
import { FiInfo } from 'react-icons/fi';

export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
        <div className="flex items-center gap-3 text-brand-purple">
          <FiInfo size={24} />
          <h3 className="text-sm font-extrabold text-text-primary font-display uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary transition"
          >
            No, Keep it
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
