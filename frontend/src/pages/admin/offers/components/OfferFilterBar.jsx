import React from 'react';
import { FiSearch, FiFilter, FiX, FiDownload, FiCalendar, FiUsers } from 'react-icons/fi';

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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
      {/* Top row: Search input + Type + Role + Status + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by campaign title, code, or description..."
            className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Campaign Type (Platform vs Vendor) */}
        <div className="min-w-[130px]">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
          >
            <option value="all">All Origins</option>
            <option value="platform">BizReels Platform</option>
            <option value="vendor">Vendor Deals</option>
          </select>
        </div>

        {/* Audience Role */}
        <div className="min-w-[130px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="creator">Creators</option>
          </select>
        </div>

        {/* Status */}
        <div className="min-w-[125px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={onExportCsv}
          disabled={totalItems === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-50 transition-all cursor-pointer"
          title="Export current view to CSV"
        >
          <FiDownload className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
          >
            <FiX className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Bottom row: Optional Date Filters */}
      <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Date Range:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <span>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="ml-auto text-[11px] font-medium text-slate-400">
          Showing {totalItems} matching campaigns
        </div>
      </div>
    </div>
  );
}
