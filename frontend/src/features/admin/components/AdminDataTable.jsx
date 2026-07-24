import React, { useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * AdminDataTable — Reusable data table with search, filtering, and pagination
 * Responsive: shows stacked card layout on mobile, table on desktop
 */
export default function AdminDataTable({
  columns,
  data = [],
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue,
  loading = false,
  emptyMessage = 'No data found.',
  actions,
  pageSize = 10,
  testId = 'admin-table',
}) {
  const safeData = Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(safeData.length / pageSize);
  const paginatedData = safeData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-3 sm:gap-4" data-testid={testId}>
      {/* Search Bar */}
      {onSearch && (
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all"
          />
        </div>
      )}

      {/* Desktop Table View (hidden on mobile) */}
      <div className="glass rounded-2xl border border-white/50 shadow-glass overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider whitespace-nowrap"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 skeleton rounded w-3/4" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div className="h-4 skeleton rounded w-16 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-xs text-text-tertiary">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || row._id || idx}
                    className="border-b border-border/50 hover:bg-brand-purple/5 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-xs text-text-primary">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={safeData.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Mobile Card View (hidden on desktop) */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 border border-white/50 shadow-card">
              <div className="space-y-3">
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-3 skeleton rounded w-1/3" />
              </div>
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-xs text-text-tertiary border border-white/50">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((row, idx) => (
            <div
              key={row.id || row._id || idx}
              className="glass rounded-xl p-4 border border-white/50 shadow-card hover:shadow-card-hover transition-all space-y-2.5"
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider flex-shrink-0 min-w-[70px] pt-0.5">
                    {col.label}
                  </span>
                  <div className="text-xs text-text-primary text-right flex-1 min-w-0">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </div>
                </div>
              ))}
              {actions && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">
                  {actions(row)}
                </div>
              )}
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={safeData.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

/**
 * PaginationControls — Shared pagination component for both table and card views
 */
function PaginationControls({ currentPage, totalPages, pageSize, totalItems, onPageChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-[10px] text-text-tertiary">
        {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          let page;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                currentPage === page
                  ? 'bg-brand-purple text-white shadow-premium'
                  : 'hover:bg-surface-tertiary text-text-secondary'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
