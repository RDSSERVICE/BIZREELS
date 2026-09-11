import React from 'react';
import {
  FiCheckSquare,
  FiTrash2,
  FiZap,
  FiCheckCircle,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';

export default function ReelBatchActionBar({
  selectedIds,
  onClearSelection,
  onBatchAction,
  isLoading
}) {
  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#1a1a1a] text-[#fbf9f4] rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-2xl border border-[#d99a3d]/40 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black text-xs">
            {selectedIds.length}
          </div>
          <span className="text-xs sm:text-sm font-bold font-['Outfit']">
            {selectedIds.length === 1 ? 'Reel selected' : 'Reels selected'}
          </span>
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Approve */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_approve')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
          >
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>

          {/* Bulk Boost */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_boost')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d99a3d] hover:bg-[#c4872c] text-[#1a1a1a] text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
          >
            <FiZap className="w-3.5 h-3.5 fill-current" />
            <span>Boost</span>
          </button>

          {/* Bulk Restore */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_restore')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>

          {/* Bulk Takedown */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_takedown')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>Takedown</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 text-stone-400 hover:text-stone-100 transition-colors rounded-lg hover:bg-stone-800"
            title="Deselect all"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
