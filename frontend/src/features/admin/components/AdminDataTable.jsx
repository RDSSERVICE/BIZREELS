import React, { useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiCheckSquare, FiSquare, FiInbox } from 'react-icons/fi';

/**
 * AdminDataTable — Reusable Warm Bento-Brutalism data table
 * Multi-selection, search filtering, responsive mobile cards, and pagination
 */
export default function AdminDataTable({
  columns,
  data = [],
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue,
  loading = false,
  emptyMessage = 'No records found.',
  actions,
  pageSize = 10,
  testId = 'admin-table',
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  bulkActions,
}) {
  const safeData = Array.isArray(data) ? data : [];
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(safeData.length / pageSize) || 1;
  const paginatedData = safeData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllPaginatedSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(row.id || row._id));

  return (
    <div className="flex flex-col gap-3 sm:gap-4 font-sans" data-testid={testId}>
      {/* Top Controls: Search Bar & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {onSearch && (
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => {
                onSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e3dccb] rounded-full text-xs font-semibold text-[#1a1a1a] placeholder:text-slate-400 focus:outline-none focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all shadow-2xs"
            />
          </div>
        )}

        {/* Bulk Action Toolbar */}
        {selectable && selectedIds.length > 0 && bulkActions && (
          <div className="flex items-center gap-2 bg-[#f8f4ec] border border-[#e3dccb] px-3.5 py-1.5 rounded-full shadow-2xs animate-fade-in">
            <span className="text-xs font-black text-[#1a1a1a]">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-[#e3dccb] mx-1" />
            {bulkActions(selectedIds)}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                {selectable && (
                  <th className="px-4 py-3.5 text-left w-10">
                    <button
                      type="button"
                      onClick={() => onSelectAll && onSelectAll(paginatedData)}
                      className="text-[#1a1a1a] hover:text-[#d99a3d] focus:outline-none cursor-pointer flex items-center justify-center"
                      title="Select all on current page"
                    >
                      {isAllPaginatedSelected ? (
                        <FiCheckSquare className="w-4 h-4 text-[#1a1a1a]" />
                      ) : (
                        <FiSquare className="w-4 h-4 text-slate-400 hover:text-[#1a1a1a]" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/60">
              {loading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {selectable && <td className="px-4 py-4"><div className="h-4 w-4 bg-[#f8f4ec] rounded border border-[#e3dccb]" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-4">
                        <div className="h-3.5 bg-[#f8f4ec] rounded w-3/4 border border-[#e3dccb]/40" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-4 text-right">
                        <div className="h-3.5 bg-[#f8f4ec] rounded w-16 ml-auto border border-[#e3dccb]/40" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="px-4 py-16 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-center text-slate-400 shadow-2xs">
                        <FiInbox className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-slate-500 mt-1">{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowId = row.id || row._id || idx;
                  const isSelected = selectedIds.includes(rowId);

                  return (
                    <tr
                      key={rowId}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#d99a3d]/10' : 'hover:bg-[#fbf9f4]'
                      }`}
                    >
                      {selectable && (
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => onSelectRow && onSelectRow(rowId)}
                            className="text-[#1a1a1a] hover:text-[#d99a3d] focus:outline-none cursor-pointer flex items-center justify-center"
                          >
                            {isSelected ? (
                              <FiCheckSquare className="w-4 h-4 text-[#1a1a1a]" />
                            ) : (
                              <FiSquare className="w-4 h-4 text-slate-400 hover:text-[#1a1a1a]" />
                            )}
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3.5 text-xs text-[#1a1a1a] font-medium">
                          {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#e3dccb] shadow-2xs animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-[#f8f4ec] rounded w-3/4" />
                <div className="h-3 bg-[#f8f4ec] rounded w-1/2" />
                <div className="h-3 bg-[#f8f4ec] rounded w-1/3" />
              </div>
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-xs text-slate-400 border border-[#e3dccb] shadow-2xs">
            <FiInbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <span className="font-semibold text-slate-500">{emptyMessage}</span>
          </div>
        ) : (
          paginatedData.map((row, idx) => {
            const rowId = row.id || row._id || idx;
            const isSelected = selectedIds.includes(rowId);

            return (
              <div
                key={rowId}
                className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all space-y-2.5 ${
                  isSelected ? 'border-[#1a1a1a] bg-[#d99a3d]/5' : 'border-[#e3dccb]'
                }`}
              >
                {selectable && (
                  <div className="flex items-center justify-between pb-2 border-b border-[#e3dccb]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Row</span>
                    <button
                      type="button"
                      onClick={() => onSelectRow && onSelectRow(rowId)}
                      className="text-[#1a1a1a] focus:outline-none cursor-pointer"
                    >
                      {isSelected ? <FiCheckSquare className="w-4 h-4" /> : <FiSquare className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                )}
                {columns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex-shrink-0 min-w-[70px] pt-0.5">
                      {col.label}
                    </span>
                    <div className="text-xs text-[#1a1a1a] font-medium text-right flex-1 min-w-0">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </div>
                  </div>
                ))}
                {actions && (
                  <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-[#e3dccb]">
                    {actions(row)}
                  </div>
                )}
              </div>
            );
          })
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
 * PaginationControls — Warm Bento-Brutalism pagination
 */
function PaginationControls({ currentPage, totalPages, pageSize, totalItems, onPageChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#e3dccb] bg-[#f8f4ec]">
      <span className="text-[11px] text-slate-500 font-bold">
        {totalItems > 0 ? (
          <>
            <span className="text-[#1a1a1a]">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="text-[#1a1a1a]">{totalItems}</span> records
          </>
        ) : (
          '0 records'
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#ede5d8] disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[30px] min-h-[30px] flex items-center justify-center cursor-pointer shadow-2xs"
          title="Previous Page"
        >
          <FiChevronLeft className="w-3.5 h-3.5" />
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
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-[#1a1a1a] text-white shadow-xs border border-[#1a1a1a]'
                  : 'bg-white hover:bg-[#ede5d8] text-[#1a1a1a] border border-[#e3dccb] shadow-2xs'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg bg-white border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#ede5d8] disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[30px] min-h-[30px] flex items-center justify-center cursor-pointer shadow-2xs"
          title="Next Page"
        >
          <FiChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
