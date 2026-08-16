import React, { useState } from 'react';
import {
  FiSearch, FiFilter, FiChevronDown, FiTrash2, FiEye, FiEyeOff,
  FiTag, FiX
} from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Highest Price' },
  { value: 'price_low', label: 'Lowest Price' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_ordered', label: 'Most Ordered' },
  { value: 'highest_rated', label: 'Highest Rated' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'product', label: 'Products' },
  { value: 'service', label: 'Services' },
];

/**
 * ListingFilters — Search bar, filter dropdowns, sort, and bulk action bar
 */
export default function ListingFilters({
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  typeFilter,
  onTypeFilter,
  sortBy,
  onSortBy,
  selectedCount = 0,
  onBulkPublish,
  onBulkHide,
  onBulkDelete,
  onClearSelection,
  activeTab,
}) {
  const [showFilters, setShowFilters] = useState(false);

  // Don't show filters on the offers tab
  if (activeTab === 'offers') return null;

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-purple/5 border border-brand-purple/20 rounded-xl animate-fade-in">
          <span className="text-xs font-bold text-brand-purple">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onBulkPublish}
              className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition flex items-center gap-1"
            >
              <FiEye className="w-3 h-3" /> Publish
            </button>
            <button
              onClick={onBulkHide}
              className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600 transition flex items-center gap-1"
            >
              <FiEyeOff className="w-3 h-3" /> Hide
            </button>
            <button
              onClick={onBulkDelete}
              className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition flex items-center gap-1"
            >
              <FiTrash2 className="w-3 h-3" /> Delete
            </button>
            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-tertiary transition"
              title="Clear selection"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 font-sans">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, category, ID..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
          />
        </div>

        {/* Filter Toggle + Sort */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition flex items-center gap-1.5 cursor-pointer ${
              showFilters || statusFilter || typeFilter
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-2xs'
                : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-white'
            }`}
          >
            <FiFilter className="w-3.5 h-3.5" />
            Filters
            {(statusFilter || typeFilter) && (
              <span className="w-4 h-4 bg-[#d99a3d] text-[#241b15] text-[8px] font-black rounded-full flex items-center justify-center">
                {(statusFilter ? 1 : 0) + (typeFilter ? 1 : 0)}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortBy(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-black text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expanded Filters Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] font-sans animate-fade-in">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#e3dccb] rounded-lg text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            >
              {TYPE_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {(statusFilter || typeFilter) && (
            <button
              type="button"
              onClick={() => { onStatusFilter(''); onTypeFilter(''); }}
              className="text-[10px] font-black text-red-600 hover:underline ml-auto cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
