import React from 'react';
import { FiCheckCircle, FiXCircle, FiTrash2, FiX } from 'react-icons/fi';

export default function OfferBatchActionBar({
  selectedCount = 0,
  onBatchActivate,
  onBatchDeactivate,
  onBatchDelete,
  onClearSelection,
  isProcessing = false
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
      <div className="bg-slate-900/90 dark:bg-slate-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 text-xs sm:text-sm">
        {/* Count Badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 font-black flex items-center justify-center text-xs">
            {selectedCount}
          </span>
          <span className="font-semibold text-slate-200">
            {selectedCount === 1 ? 'Campaign' : 'Campaigns'} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Activate */}
          <button
            onClick={onBatchActivate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Activate</span>
          </button>

          {/* Deactivate */}
          <button
            onClick={onBatchDeactivate}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <FiXCircle className="w-4 h-4" />
            <span>Disable</span>
          </button>

          {/* Delete */}
          <button
            onClick={onBatchDelete}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          disabled={isProcessing}
          className="ml-2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Deselect all"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
