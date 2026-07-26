import React from 'react';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';

/**
 * ConfirmDialog — Reusable confirmation dialog for destructive/important actions
 * Supports danger (red) and warning (amber) variants
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  loading = false,
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-strong rounded-2xl shadow-modal border border-white/50 animate-scale-in p-6 space-y-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${isDanger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
          {isDanger
            ? <FiTrash2 className="w-6 h-6 text-red-500" />
            : <FiAlertTriangle className="w-6 h-6 text-amber-500" />
          }
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="text-sm font-bold text-text-primary font-display">{title}</h3>
          <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-border text-text-secondary hover:bg-surface-secondary transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 shadow-sm'
                : 'bg-amber-500 hover:bg-amber-600 shadow-sm'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
