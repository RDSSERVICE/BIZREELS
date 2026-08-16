import React, { useState } from 'react';
import {
  FiEye, FiEyeOff, FiEdit2, FiTrash2, FiCopy, FiShare2,
  FiMoreVertical, FiChevronLeft, FiChevronRight, FiExternalLink,
  FiStar, FiShoppingCart, FiHeart, FiBookmark, FiBarChart2,
  FiAlertTriangle, FiPackage
} from 'react-icons/fi';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';

/**
 * ListingTable — Enhanced data table with images, analytics mini-stats,
 * checkbox selection, row actions, and responsive card/table layout
 */
export default function ListingTable({
  listings = [],
  loading = false,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onView,
  onEdit,
  onDuplicate,
  onToggleVisibility,
  onDelete,
  onShare,
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const safeListings = Array.isArray(listings) ? listings : [];
  const totalPages = Math.ceil(safeListings.length / pageSize);
  const paginated = safeListings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allOnPageSelected = paginated.length > 0 && paginated.every(l => selectedIds.includes(l._id || l.id));

  const getStatusAction = (status) => {
    if (status === 'published') return { icon: FiEyeOff, label: 'Hide', newStatus: 'hidden' };
    if (status === 'hidden') return { icon: FiEye, label: 'Publish', newStatus: 'published' };
    if (status === 'draft') return { icon: FiEye, label: 'Publish', newStatus: 'published' };
    return { icon: FiEye, label: 'Publish', newStatus: 'published' };
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const renderStockBadge = (row) => {
    if (row.type === 'service') return null;
    const stock = row.stock ?? 0;
    const threshold = row.lowStockThreshold ?? 5;
    if (stock <= 0) return <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-bold rounded">OUT OF STOCK</span>;
    if (stock <= threshold) return <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold rounded flex items-center gap-0.5"><FiAlertTriangle className="w-2.5 h-2.5" />{stock} left</span>;
    return <span className="text-[9px] text-text-tertiary">{stock} in stock</span>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 border border-white/50 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-surface-tertiary rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-1/4" />
              </div>
              <div className="h-4 skeleton rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (safeListings.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/50 p-12 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto">
          <FiPackage className="w-8 h-8 text-brand-purple/50" />
        </div>
        <h4 className="text-sm font-bold text-text-primary">No listings found</h4>
        <p className="text-xs text-text-tertiary max-w-xs mx-auto">
          Start by adding your first product or service to make it visible to customers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {/* Desktop Table */}
      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec]">
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={() => onSelectAll(paginated.map(l => l._id || l.id))}
                    className="w-3.5 h-3.5 rounded border-border accent-brand-purple cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Listing</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Price</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Type</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Stock</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Stats</th>
                <th className="px-3 py-3 text-left text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Date</th>
                <th className="px-3 py-3 text-right text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => {
                const lid = row._id || row.id;
                const isSelected = selectedIds.includes(lid);
                const statusAction = getStatusAction(row.status || 'published');
                const image = row.images?.[0];

                return (
                  <tr key={lid} className={`border-b border-border/50 hover:bg-brand-purple/5 transition-colors ${isSelected ? 'bg-brand-purple/5' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(lid)}
                        className="w-3.5 h-3.5 rounded border-border accent-brand-purple cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border overflow-hidden flex-shrink-0">
                          {image ? (
                            <img src={image} alt={row.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                              <FiPackage className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-text-primary block truncate max-w-[200px]">{row.title}</span>
                          <span className="text-[9px] text-text-tertiary uppercase">{row.category} • {row.subcategory || 'General'}</span>
                          {row.sku && <span className="text-[9px] text-text-tertiary block">SKU: {row.sku}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div>
                        <span className="font-bold text-xs text-emerald-600">₹{(row.sellingPrice || row.price || 0).toLocaleString('en-IN')}</span>
                        {row.actualPrice && row.actualPrice > (row.sellingPrice || row.price || 0) && (
                          <span className="text-[9px] text-text-tertiary line-through block">₹{row.actualPrice.toLocaleString('en-IN')}</span>
                        )}
                        {row.discount > 0 && (
                          <span className="text-[9px] text-emerald-500 font-bold">{row.discount}% off</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        row.type === 'service'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <AdminStatusBadge status={row.status || 'published'} />
                    </td>
                    <td className="px-3 py-3">
                      {renderStockBadge(row)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 text-[9px] text-text-tertiary">
                        <span className="flex items-center gap-0.5" title="Views"><FiEye className="w-3 h-3" /> {row.views || 0}</span>
                        <span className="flex items-center gap-0.5" title="Likes"><FiHeart className="w-3 h-3" /> {row.likes || 0}</span>
                        <span className="flex items-center gap-0.5" title="Orders"><FiShoppingCart className="w-3 h-3" /> {row.orders_count || 0}</span>
                        {row.rating > 0 && <span className="flex items-center gap-0.5 text-amber-500" title="Rating"><FiStar className="w-3 h-3" /> {row.rating.toFixed(1)}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[9px] text-text-tertiary">{formatDate(row.createdAt)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="View Details">
                          <FiBarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Edit">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDuplicate(row)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Duplicate">
                          <FiCopy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onToggleVisibility(row)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title={statusAction.label}>
                          <statusAction.icon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onShare(row)} className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Share">
                          <FiShare2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition" title="Delete">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={safeListings.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-3">
        {paginated.map((row) => {
          const lid = row._id || row.id;
          const isSelected = selectedIds.includes(lid);
          const statusAction = getStatusAction(row.status || 'published');
          const image = row.images?.[0];

          return (
            <div key={lid} className={`glass rounded-xl border shadow-card hover:shadow-card-hover transition-all overflow-hidden ${isSelected ? 'border-brand-purple/40 bg-brand-purple/5' : 'border-white/50'}`}>
              <div className="p-4 space-y-3">
                {/* Top Row: Checkbox + Image + Title */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(lid)}
                    className="w-3.5 h-3.5 mt-1 rounded border-border accent-brand-purple cursor-pointer flex-shrink-0"
                  />
                  <div className="w-14 h-14 rounded-xl bg-surface-secondary border border-border overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt={row.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                        <FiPackage className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-text-primary block truncate">{row.title}</span>
                    <span className="text-[9px] text-text-tertiary uppercase block">{row.category}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-xs text-emerald-600">₹{(row.sellingPrice || row.price || 0).toLocaleString('en-IN')}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        row.type === 'service' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'
                      }`}>{row.type}</span>
                    </div>
                  </div>
                  <AdminStatusBadge status={row.status || 'published'} />
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-[9px] text-text-tertiary px-7">
                  <span className="flex items-center gap-0.5"><FiEye className="w-3 h-3" /> {row.views || 0}</span>
                  <span className="flex items-center gap-0.5"><FiHeart className="w-3 h-3" /> {row.likes || 0}</span>
                  <span className="flex items-center gap-0.5"><FiShoppingCart className="w-3 h-3" /> {row.orders_count || 0}</span>
                  {row.type === 'product' && renderStockBadge(row)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                  <button onClick={() => onView(row)} className="p-2 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="View"><FiBarChart2 className="w-4 h-4" /></button>
                  <button onClick={() => onEdit(row)} className="p-2 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                  <button onClick={() => onDuplicate(row)} className="p-2 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title="Duplicate"><FiCopy className="w-4 h-4" /></button>
                  <button onClick={() => onToggleVisibility(row)} className="p-2 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition" title={statusAction.label}><statusAction.icon className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(row)} className="p-2 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={safeListings.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

function PaginationBar({ currentPage, totalPages, pageSize, totalItems, onPageChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-[10px] text-text-tertiary">
        {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 transition min-w-[32px] min-h-[32px] flex items-center justify-center">
          <FiChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          let page;
          if (totalPages <= 5) page = i + 1;
          else if (currentPage <= 3) page = i + 1;
          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
          else page = currentPage - 2 + i;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                currentPage === page ? 'bg-brand-purple text-white shadow-premium' : 'hover:bg-surface-tertiary text-text-secondary'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg hover:bg-surface-tertiary disabled:opacity-30 transition min-w-[32px] min-h-[32px] flex items-center justify-center">
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
