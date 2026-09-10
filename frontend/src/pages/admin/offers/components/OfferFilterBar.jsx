import React from 'react';
import { FiSearch, FiFilter, FiDownload, FiCalendar, FiX } from 'react-icons/fi';

export default function OfferFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  typeFilter,
  setTypeFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onResetFilters,
  onExportCsv,
  totalItems = 0
}) {
  const hasActiveFilters = Boolean(
    search ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    typeFilter !== 'all' ||
    dateFrom ||
    dateTo
  );

  return (
    <div className="bg-[#fbf9f4] rounded-2xl border border-[#e3dccb] shadow-xs p-4 sm:p-5 space-y-4 font-sans">
      {/* Top Header bar with Title, Clear, and Export buttons */}
      <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-[#d99a3d] flex items-center justify-center">
            <FiFilter className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">
            Search & Filters
          </h3>
          <span className="text-[11px] font-bold text-[#8c827a] ml-1">
            ({totalItems} matching campaigns)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-1.5 rounded-xl border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white text-[11px] font-bold text-[#1a1a1a] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
          <button
            onClick={onExportCsv}
            disabled={totalItems === 0}
            className="px-4.5 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#241b15] text-[11px] font-bold text-[#d99a3d] shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Export Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Grid of Search, Filters, and Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search input */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c827a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, or description..."
            className="w-full pl-9.5 pr-8 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-semibold text-[#1a1a1a] placeholder:text-[#8c827a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c827a] hover:text-[#1a1a1a]"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Campaign Origin */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all cursor-pointer"
          >
            <option value="all">All Origins (Platform & Vendor)</option>
            <option value="platform">BizReels Platform Campaigns</option>
            <option value="vendor">Vendor Store Deals</option>
          </select>
        </div>

        {/* Audience */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="customer">Customers Only</option>
            <option value="vendor">Vendors Only</option>
            <option value="creator">Creators Only</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs sm:text-sm font-bold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active & Live</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Date Range subrow */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#e3dccb] text-xs text-[#8c827a]">
        <div className="flex items-center gap-1.5 font-bold text-[#1a1a1a]">
          <FiCalendar className="w-3.5 h-3.5 text-[#d99a3d]" />
          <span>Timeline Window:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1 bg-white border border-[#e3dccb] rounded-lg text-xs font-semibold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
          />
          <span className="font-bold">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1 bg-white border border-[#e3dccb] rounded-lg text-xs font-semibold text-[#1a1a1a] focus:outline-hidden focus:border-[#1a1a1a]"
          />
        </div>
      </div>
    </div>
  );
}
