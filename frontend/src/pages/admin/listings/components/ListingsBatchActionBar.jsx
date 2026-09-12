import React from 'react';
import {
  FiCheckCircle,
  FiSlash,
  FiZap,
  FiRefreshCw,
  FiDownload,
  FiX
} from 'react-icons/fi';
import { exportListingsToCsv } from './listingUtils';

export default function ListingsBatchActionBar({
  selectedIds = [],
  selectedItems = [],
  onClearSelection,
  onBatchAction,
  isLoading
}) {
  if (!selectedIds || selectedIds.length === 0) return null;

  const handleExportSelected = () => {
    exportListingsToCsv(
      selectedItems,
      `bizreels_selected_${selectedIds.length}_listings_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-[#1a1a1a] text-[#fbf9f4] rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-2xl border border-[#d99a3d]/40 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Selection Count Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black text-xs font-['Archivo_Black']">
            {selectedIds.length}
          </div>
          <span className="text-xs sm:text-sm font-bold font-['Outfit'] tracking-wide">
            {selectedIds.length === 1 ? 'Listing selected' : 'Listings selected'}
          </span>
        </div>

        {/* Batch Operations Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Approve */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_approve')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
            title="Approve selected listings"
          >
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>

          {/* Bulk Boost */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_boost')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d99a3d] hover:bg-[#c4872c] text-[#1a1a1a] text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
            title="Feature selected listings"
          >
            <FiZap className="w-3.5 h-3.5 fill-current" />
            <span>Boost</span>
          </button>

          {/* Bulk Restore */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_restore')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
            title="Restore selected listings"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>

          {/* Bulk Takedown */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onBatchAction('bulk_takedown')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 font-['Outfit'] cursor-pointer shadow-xs"
            title="Takedown selected listings"
          >
            <FiSlash className="w-3.5 h-3.5" />
            <span>Takedown</span>
          </button>

          {/* Export Selected to CSV */}
          <button
            type="button"
            onClick={handleExportSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all font-['Outfit'] cursor-pointer"
            title="Export selected rows as CSV"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Clear selection"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
