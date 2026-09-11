import React from 'react';
import {
  FiSearch,
  FiX,
  FiDownload,
  FiFilter,
  FiShoppingBag,
  FiLayers,
  FiRefreshCw
} from 'react-icons/fi';
import { exportReelsToCsv } from './reelUtils';

export default function ReelFilterBar({
  search,
  onSearchChange,
  postTypeFilter,
  onPostTypeChange,
  sortBy,
  onSortByChange,
  totalCount,
  filteredCount,
  onRefresh,
  isFetching,
  allItems
}) {
  const handleExport = () => {
    exportReelsToCsv(allItems, `bizreels_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-3 sm:p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      {/* Left: Search input */}
      <div className="flex-1 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by caption, creator name, or hashtags..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#fbf9f4] border border-[#e3dccb] rounded-lg text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all font-['Outfit']"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh Data"
          className="p-2.5 bg-[#fbf9f4] border border-[#e3dccb] hover:border-[#1a1a1a] rounded-lg text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors shrink-0 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Right: Commerce filter, Sort, and CSV Export */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Post Type Selector */}
        <div className="flex items-center gap-1.5 bg-[#fbf9f4] border border-[#e3dccb] rounded-lg px-2.5 py-1 text-xs">
          <FiFilter className="w-3 h-3 text-[#1a1a1a]/50" />
          <select
            value={postTypeFilter}
            onChange={(e) => onPostTypeChange(e.target.value)}
            className="bg-transparent border-none text-[#1a1a1a] text-xs font-semibold focus:outline-none cursor-pointer font-['Outfit']"
          >
            <option value="all">All Types</option>
            <option value="product">Products Only</option>
            <option value="service">Services Only</option>
            <option value="shop">Shops Only</option>
            <option value="general">General Videos</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 bg-[#fbf9f4] border border-[#e3dccb] rounded-lg px-2.5 py-1 text-xs">
          <span className="text-[#1a1a1a]/50 font-medium font-['Outfit']">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-transparent border-none text-[#1a1a1a] text-xs font-semibold focus:outline-none cursor-pointer font-['Outfit']"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="views">Most Views</option>
            <option value="likes">Most Likes</option>
            <option value="comments">Most Comments</option>
          </select>
        </div>

        {/* Export CSV button */}
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fbf9f4] hover:bg-[#e3dccb]/30 border border-[#e3dccb] hover:border-[#1a1a1a] rounded-lg text-xs font-bold text-[#1a1a1a] transition-all font-['Outfit'] shadow-xs"
        >
          <FiDownload className="w-3.5 h-3.5 text-[#1a1a1a]/70" />
          <span>Export CSV</span>
        </button>

        {/* Counter pill */}
        <div className="px-2.5 py-1 bg-[#e3dccb]/40 rounded-lg text-[11px] font-bold text-[#1a1a1a]/70 font-['Outfit']">
          {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
        </div>
      </div>
    </div>
  );
}
