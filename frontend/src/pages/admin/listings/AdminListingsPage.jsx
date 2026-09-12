import React, { useState, useEffect, useMemo } from 'react';
import {
  FiLayers,
  FiPackage,
  FiTool,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiEye,
  FiSlash,
  FiRefreshCw,
  FiZap,
  FiExternalLink,
  FiUser
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetAdminListingStatsQuery,
  useListAdminListingsQuery,
  useTakedownListingMutation,
  useRestoreListingMutation,
  useModerateListingMutation,
  useToggleBoostListingMutation,
  useBulkActionListingsMutation,
} from '../../../features/admin/adminApi';
import { getSocket } from '../../../lib/socket';
import {
  ListingsKpiBanner,
  ListingsFilterBar,
  ListingsBatchActionBar,
  ListingDetailModal,
  ListingTakedownModal,
  getStockStatus,
  formatCurrencyINR
} from './components';

export default function AdminListingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedIds, setSelectedIds] = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [takedownTarget, setTakedownTarget] = useState(null);

  // RTK Query: KPI Stats
  const {
    data: stats,
    isFetching: isFetchingStats,
    refetch: refetchStats
  } = useGetAdminListingStatsQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true
  });

  // Query parameters mapping
  const queryParams = useMemo(() => {
    const p = { limit: 100, sortBy };
    if (activeTab === 'published') p.status = 'published';
    else if (activeTab === 'draft') p.status = 'draft';
    else if (activeTab === 'out_of_stock') p.stock_status = 'out_of_stock';
    else if (activeTab === 'reported') p.flagged = 'true';
    else if (activeTab === 'product') p.type = 'product';
    else if (activeTab === 'service') p.type = 'service';
    else if (activeTab === 'used') p.condition = 'used';

    if (categoryFilter && categoryFilter !== 'all') p.category = categoryFilter;
    if (stockFilter && stockFilter !== 'all') p.stock_status = stockFilter;
    if (search.trim()) p.search = search.trim();

    return p;
  }, [activeTab, categoryFilter, stockFilter, sortBy, search]);

  const {
    data: listData,
    isFetching: isFetchingList,
    refetch: refetchList
  } = useListAdminListingsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });

  // Mutations
  const [takedownListing, { isLoading: isTakingDown }] = useTakedownListingMutation();
  const [restoreListing, { isLoading: isRestoring }] = useRestoreListingMutation();
  const [moderateListing, { isLoading: isModerating }] = useModerateListingMutation();
  const [toggleBoost, { isLoading: isBoosting }] = useToggleBoostListingMutation();
  const [bulkActionListings, { isLoading: isBulkActioning }] = useBulkActionListingsMutation();

  const isMutating = isTakingDown || isRestoring || isModerating || isBoosting || isBulkActioning;

  // Real-time WebSocket listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      refetchList();
      refetchStats();
    };

    socket.on('admin:update', handleUpdate);
    socket.on('listing:update', handleUpdate);
    socket.on('listing:takedown', handleUpdate);
    socket.on('listing:restored', handleUpdate);

    return () => {
      socket.off('admin:update', handleUpdate);
      socket.off('listing:update', handleUpdate);
      socket.off('listing:takedown', handleUpdate);
      socket.off('listing:restored', handleUpdate);
    };
  }, [refetchList, refetchStats]);

  const rawItems = listData?.items || [];

  // Dynamic unique categories extracted from catalog
  const availableCategories = useMemo(() => {
    const set = new Set();
    rawItems.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set).sort();
  }, [rawItems]);

  // Client-side instant filter backup ensuring sub-10ms filter response
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        const matchVendor = (item.vendor_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchCategory && !matchVendor) return false;
      }

      // Tab filter
      if (activeTab === 'product' && (item.type !== 'product' || item.condition === 'used')) return false;
      if (activeTab === 'service' && item.type !== 'service') return false;
      if (activeTab === 'used' && item.condition !== 'used') return false;
      if (activeTab === 'out_of_stock' && (item.type === 'service' || (item.stock > 0 && item.status !== 'out_of_stock'))) return false;
      if (activeTab === 'draft' && item.status !== 'draft') return false;
      if (activeTab === 'published' && (item.is_takendown || !['published', 'active'].includes(item.status))) return false;
      if (activeTab === 'reported' && !item.is_takendown && !['hidden', 'paused'].includes(item.status)) return false;

      // Dropdown category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Dropdown stock filter
      if (stockFilter === 'in_stock' && (item.type === 'product' && item.stock <= 5)) return false;
      if (stockFilter === 'low_stock' && (item.type === 'service' || item.stock <= 0 || item.stock > 5)) return false;
      if (stockFilter === 'out_of_stock' && (item.type === 'service' || item.stock > 0)) return false;

      return true;
    });
  }, [rawItems, search, activeTab, categoryFilter, stockFilter]);

  // Tab definitions with live count badges
  const tabs = useMemo(() => [
    { key: 'all', label: 'All Listings', icon: FiLayers, count: stats?.totalListings },
    { key: 'published', label: 'Published', icon: FiCheckCircle, count: stats?.publishedCount },
    { key: 'draft', label: 'Draft / Review', icon: FiClock, count: stats?.draftCount },
    { key: 'product', label: 'Products', icon: FiPackage, count: stats?.productsCount },
    { key: 'service', label: 'Services', icon: FiTool, count: stats?.servicesCount },
    { key: 'used', label: 'Used Goods', icon: FiPackage, count: stats?.usedCount },
    { key: 'out_of_stock', label: 'Out of Stock', icon: FiPackage, count: stats?.outOfStockCount },
    { key: 'reported', label: 'Flagged Content', icon: FiAlertTriangle, count: stats?.flaggedCount }
  ], [stats]);

  // Reset filters
  const hasActiveFilters = search.trim() !== '' || categoryFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'newest';
  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  // Selection handlers
  const handleSelectRow = (row) => {
    const id = row.id || row._id;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (pageRows) => {
    const pageIds = pageRows.map((r) => r.id || r._id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Single Actions
  const handleRestore = async (id) => {
    try {
      await restoreListing(id).unwrap();
      toast.success('Listing successfully restored to marketplace!');
      if (viewItem && (viewItem.id === id || viewItem._id === id)) {
        setViewItem((prev) => ({ ...prev, is_takendown: false, status: 'published' }));
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Restore action failed');
    }
  };

  const handleToggleBoost = async (id) => {
    try {
      const res = await toggleBoost(id).unwrap();
      toast.success(res.isBoosted ? 'Listing featured / boosted!' : 'Boost removed from listing.');
      if (viewItem && (viewItem.id === id || viewItem._id === id)) {
        setViewItem((prev) => ({ ...prev, isBoosted: res.isBoosted }));
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to toggle boost');
    }
  };

  // Takedown confirmation
  const handleConfirmTakedown = async ({ id, reason, comments }) => {
    try {
      if (Array.isArray(takedownTarget)) {
        // Bulk takedown
        await bulkActionListings({
          listing_ids: selectedIds,
          action: 'bulk_takedown',
          payload: { reason, comments }
        }).unwrap();
        toast.success(`Bulk took down ${selectedIds.length} listings!`);
        setSelectedIds([]);
      } else {
        // Single takedown
        await takedownListing({ id, reason, comments }).unwrap();
        toast.success('Listing taken down from marketplace!');
        if (viewItem && (viewItem.id === id || viewItem._id === id)) {
          setViewItem((prev) => ({ ...prev, is_takendown: true, status: 'hidden' }));
        }
      }
      setTakedownTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Takedown failed');
    }
  };

  // Bulk Operations
  const handleBatchAction = async (action) => {
    if (selectedIds.length === 0) return toast.error('Select listings first');

    if (action === 'bulk_takedown') {
      const selectedItems = rawItems.filter((it) => selectedIds.includes(it.id || it._id));
      setTakedownTarget(selectedItems);
      return;
    }

    try {
      await bulkActionListings({
        listing_ids: selectedIds,
        action,
        payload: {}
      }).unwrap();

      const actionLabels = {
        bulk_approve: 'Approved',
        bulk_restore: 'Restored',
        bulk_boost: 'Boosted',
        bulk_delete: 'Soft-deleted'
      };

      toast.success(`${actionLabels[action] || 'Updated'} ${selectedIds.length} listings!`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.data?.message || 'Batch action failed');
    }
  };

  // Table Columns
  const columns = [
    {
      key: 'title',
      label: 'Listing & SKU',
      render: (val, row) => {
        const image = row.images && row.images[0];
        const isService = row.type === 'service';

        return (
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-white border border-[#e3dccb] overflow-hidden shrink-0 shadow-2xs">
              {image ? (
                <img src={image} alt={val} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  {isService ? <FiTool className="w-5 h-5 text-indigo-500" /> : <FiPackage className="w-5 h-5 text-amber-500" />}
                </div>
              )}
              {row.images && row.images.length > 1 && (
                <span className="absolute bottom-0 right-0 bg-[#1a1a1a]/80 text-white text-[8px] font-black px-1 rounded-tl">
                  +{row.images.length - 1}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#1a1a1a] block truncate max-w-[200px] text-xs font-['Outfit']">
                  {val || 'Untitled Listing'}
                </span>
                {row.isBoosted && (
                  <FiZap className="w-3 h-3 text-amber-600 fill-current shrink-0" title="Boosted Listing" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="capitalize font-medium">{row.type || 'product'}</span>
                <span>•</span>
                <span className="font-mono text-slate-400">{row.sku ? `SKU: ${row.sku}` : (row.category || 'General')}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'vendor',
      label: 'Merchant / Vendor',
      render: (_, row) => (
        <div className="flex items-center gap-2 max-w-[160px]">
          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
            {row.vendor_avatar ? (
              <img src={row.vendor_avatar} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <FiUser className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="truncate text-xs font-semibold text-[#1a1a1a]">
            {row.vendor_name || 'Verified Vendor'}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (val, row) => (
        <div>
          <div className="font-black text-emerald-700 text-xs font-['Archivo_Black']">
            {formatCurrencyINR(val || 0)}
          </div>
          {row.discount > 0 && (
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded">
              {row.discount}% OFF
            </span>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Inventory',
      render: (_, row) => {
        const info = getStockStatus(row);
        return (
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.color}`}>
            {info.label}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <AdminStatusBadge status={row.is_takendown ? 'Reported' : val === 'active' ? 'Published' : val} />
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val, row) => {
        const date = val || row.createdAt;
        return <span className="text-slate-400 text-[11px]">{date ? new Date(date).toLocaleDateString() : '—'}</span>;
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in font-['Outfit'] pb-16">
      {/* Top Header */}
      <AdminPageHeader
        icon={FiLayers}
        title="Listing & Catalog Operations"
        subtitle="Manage products, services, inventory stock levels, and safety compliance audits"
      />

      {/* KPI Analytics Banner */}
      <ListingsKpiBanner
        stats={stats}
        isFetching={isFetchingStats}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
      />

      {/* Tab Navigation with Live Badges */}
      <AdminTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Multi-Dimensional Filter Bar */}
      <ListingsFilterBar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={availableCategories}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={rawItems.length}
        filteredCount={filteredItems.length}
        onRefresh={() => {
          refetchList();
          refetchStats();
        }}
        isFetching={isFetchingList || isFetchingStats}
        allItems={filteredItems}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Data Table */}
      <AdminDataTable
        columns={columns}
        data={filteredItems}
        loading={isFetchingList}
        selectable={true}
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        emptyMessage="No catalog listings found matching your current filter criteria."
        testId="admin-listings-table"
        actions={(row) => {
          const isTakenDown = row.is_takendown === true || row.status === 'hidden' || row.status === 'paused';
          return (
            <div className="flex items-center justify-end gap-1">
              {/* View Details */}
              <button
                type="button"
                onClick={() => setViewItem(row)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#1a1a1a] transition-all cursor-pointer"
                title="View Full Listing Dossier"
              >
                <FiEye className="w-4 h-4" />
              </button>

              {/* Direct Storefront Link */}
              <a
                href={`/listings/${row.id || row._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                title="Open Storefront View"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Boost Toggle */}
              <button
                type="button"
                onClick={() => handleToggleBoost(row.id || row._id)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  row.isBoosted
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
                title={row.isBoosted ? 'Featured (Click to unboost)' : 'Click to feature / boost'}
              >
                <FiZap className={`w-4 h-4 ${row.isBoosted ? 'fill-current' : ''}`} />
              </button>

              {/* Takedown / Restore */}
              {isTakenDown ? (
                <button
                  type="button"
                  onClick={() => handleRestore(row.id || row._id)}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all cursor-pointer"
                  title="Restore to Marketplace"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTakedownTarget(row)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                  title="Takedown with Safety Audit Reason"
                >
                  <FiSlash className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        }}
      />

      {/* Floating Bottom Batch Operations Bar */}
      <ListingsBatchActionBar
        selectedIds={selectedIds}
        selectedItems={rawItems.filter((it) => selectedIds.includes(it.id || it._id))}
        onClearSelection={() => setSelectedIds([])}
        onBatchAction={handleBatchAction}
        isLoading={isMutating}
      />

      {/* Comprehensive Listing Detail Dossier Modal */}
      <ListingDetailModal
        listing={viewItem}
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        onTakedown={(item) => setTakedownTarget(item)}
        onRestore={handleRestore}
        onToggleBoost={handleToggleBoost}
        isLoading={isMutating}
      />

      {/* Safety Compliance Takedown Modal with Reason */}
      <ListingTakedownModal
        listing={takedownTarget}
        isOpen={!!takedownTarget}
        onClose={() => setTakedownTarget(null)}
        onConfirm={handleConfirmTakedown}
        isLoading={isMutating}
      />
    </div>
  );
}
