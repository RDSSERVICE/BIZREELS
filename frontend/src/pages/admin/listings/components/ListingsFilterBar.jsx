import React from 'react';
import {
  FiSearch,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiLayers,
  FiPackage,
  FiTool,
  FiSliders
} from 'react-icons/fi';
import { exportListingsToCsv } from './listingUtils';

export default function ListingsFilterBar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories = [],
  stockFilter,
  onStockFilterChange,
  sortBy,
  onSortByChange,
  totalCount,
  filteredCount,
  onRefresh,
  isFetching,
  allItems = [],
  onResetFilters,
  hasActiveFilters
}) {
  const handleExport = () => {
    exportListingsToCsv(allItems, `bizreels_listings_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-3 sm:p-4 mb-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, SKU, vendor name, category..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-[#e3dccb] rounded-xl text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all font-['Outfit'] shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#1a1a1a] transition-colors"
                title="Clear Search"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh Data"
            className="p-2.5 bg-white border border-[#e3dccb] hover:border-[#1a1a1a] rounded-xl text-slate-600 hover:text-[#1a1a1a] transition-colors shrink-0 disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#d99a3d]' : ''}`} />
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-[#e3dccb] rounded-xl text-[#1a1a1a] font-bold focus:outline-none focus:border-[#1a1a1a] appearance-none transition-all shadow-2xs cursor-pointer font-['Outfit']"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Stock Filter */}
          <div className="relative min-w-[125px]">
            <select
              value={stockFilter}
              onChange={(e) => onStockFilterChange(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-[#e3dccb] rounded-xl text-[#1a1a1a] font-bold focus:outline-none focus:border-[#1a1a1a] appearance-none transition-all shadow-2xs cursor-pointer font-['Outfit']"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock (&gt;5)</option>
              <option value="low_stock">Low Stock (≤5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[135px]">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-[#e3dccb] rounded-xl text-[#1a1a1a] font-bold focus:outline-none focus:border-[#1a1a1a] appearance-none transition-all shadow-2xs cursor-pointer font-['Outfit']"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="views">Most Viewed</option>
              <option value="orders">Top Selling</option>
              <option value="rating">Highest Rated</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors shrink-0 cursor-pointer font-['Outfit']"
            >
              Reset
            </button>
          )}

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExport}
            disabled={allItems.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#1a1a1a] text-white rounded-xl hover:bg-black transition-colors shrink-0 shadow-2xs disabled:opacity-50 cursor-pointer font-['Outfit']"
            title="Download CSV report"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Subheader: Item Count Counter */}
      <div className="mt-2.5 pt-2.5 border-t border-[#e3dccb]/70 flex items-center justify-between text-[11px] font-semibold text-slate-500 font-['Outfit']">
        <div>
          Showing <strong className="text-[#1a1a1a]">{filteredCount}</strong> of <strong className="text-[#1a1a1a]">{totalCount}</strong> listings
        </div>
        {hasActiveFilters && (
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Filters Active
          </span>
        )}
      </div>
    </div>
  );
}
