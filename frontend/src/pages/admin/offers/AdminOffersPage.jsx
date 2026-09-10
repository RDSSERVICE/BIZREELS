import React, { useState, useEffect } from 'react';
import { FiGift, FiPlus, FiTag, FiClock, FiCheckCircle, FiArchive, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { getSocket } from '../../../lib/socket';
import {
  useGetOfferStatsQuery,
  useListOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useBulkUpdateOfferStatusMutation,
  useBulkDeleteOffersMutation,
  useActivateOfferMutation,
  useDeactivateOfferMutation,
  useDuplicateOfferMutation,
  useGetOfferAnalyticsQuery
} from '../../../features/admin/adminApi';

import OfferKpiBanner from './components/OfferKpiBanner';
import OfferFilterBar from './components/OfferFilterBar';
import OfferBatchActionBar from './components/OfferBatchActionBar';
import OfferTable from './components/OfferTable';
import OfferFormModal from './components/OfferFormModal';
import OfferAnalyticsModal from './components/OfferAnalyticsModal';
import { exportOffersToCsv } from './components/offerUtils';

export default function AdminOffersPage() {
  // Scoping tab: 'all' | 'active' | 'scheduled' | 'vendor' | 'archived'
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Row selection state for batch actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // 1. Fetch High-Level Telemetry
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useGetOfferStatsQuery();
  const stats = statsData?.stats || {};

  // Build effective query params based on active tab + filters
  const effectiveStatus =
    statusFilter !== 'all'
      ? statusFilter
      : activeTab === 'active'
      ? 'Active'
      : activeTab === 'scheduled'
      ? 'Scheduled'
      : activeTab === 'archived'
      ? 'Expired'
      : undefined;

  const effectiveType =
    typeFilter !== 'all'
      ? typeFilter
      : activeTab === 'vendor'
      ? 'vendor'
      : undefined;

  // 2. Fetch Offers List
  const {
    data: offersData,
    isFetching: isFetchingOffers,
    refetch: refetchOffers
  } = useListOffersQuery({
    q: search || undefined,
    status: effectiveStatus,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    type: effectiveType,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page: currentPage,
    limit: 15
  });

  const offers = offersData?.items || [];
  const pagination = offersData?.pagination || { page: 1, totalPages: 1, total: 0, limit: 15 };

  // 3. Mutations
  const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();
  const [deleteOffer] = useDeleteOfferMutation();
  const [bulkUpdateStatus] = useBulkUpdateOfferStatusMutation();
  const [bulkDelete] = useBulkDeleteOffersMutation();
  const [activateOffer] = useActivateOfferMutation();
  const [deactivateOffer] = useDeactivateOfferMutation();
  const [duplicateOffer] = useDuplicateOfferMutation();

  // Selected Offer Analytics Query
  const { data: analyticsData, isFetching: isFetchingAnalytics } = useGetOfferAnalyticsQuery(
    selectedOffer?.id || selectedOffer?._id,
    { skip: !showAnalyticsModal || !selectedOffer }
  );

  // 4. Real-time WebSocket Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOfferChange = () => {
      refetchOffers();
      refetchStats();
    };

    socket.on('offer:created', handleOfferChange);
    socket.on('offer:updated', handleOfferChange);
    socket.on('offer:deleted', handleOfferChange);
    socket.on('offer:activated', handleOfferChange);
    socket.on('offer:expired', handleOfferChange);

    return () => {
      socket.off('offer:created', handleOfferChange);
      socket.off('offer:updated', handleOfferChange);
      socket.off('offer:deleted', handleOfferChange);
      socket.off('offer:activated', handleOfferChange);
      socket.off('offer:expired', handleOfferChange);
    };
  }, [refetchOffers, refetchStats]);

  // Tab configuration with live badges
  const TABS = [
    { key: 'all', label: 'All Campaigns', count: stats.totalOffers || 0, icon: FiGift },
    { key: 'active', label: 'Active & Live', count: stats.activeOffers || 0, icon: FiCheckCircle },
    { key: 'scheduled', label: 'Scheduled Queue', count: stats.scheduledOffers || 0, icon: FiClock },
    { key: 'vendor', label: 'Vendor Store Deals', count: stats.vendorOffersCount || 0, icon: FiShoppingBag },
    {
      key: 'archived',
      label: 'Expired / Inactive',
      count: (stats.expiredOffers || 0) + (stats.disabledOffers || 0),
      icon: FiArchive
    }
  ];

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === offers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(offers.map((o) => o.id || o._id));
    }
  };

  // Batch action triggers
  const handleBatchActivate = async () => {
    if (!selectedIds.length) return;
    try {
      setIsBatchProcessing(true);
      await bulkUpdateStatus({ offerIds: selectedIds, status: 'Active' }).unwrap();
      toast.success(`Successfully activated ${selectedIds.length} campaigns!`);
      setSelectedIds([]);
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to activate selected campaigns');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDeactivate = async () => {
    if (!selectedIds.length) return;
    try {
      setIsBatchProcessing(true);
      await bulkUpdateStatus({ offerIds: selectedIds, status: 'Disabled' }).unwrap();
      toast.success(`Successfully disabled ${selectedIds.length} campaigns!`);
      setSelectedIds([]);
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to disable selected campaigns');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} campaigns?`)) return;
    try {
      setIsBatchProcessing(true);
      await bulkDelete({ offerIds: selectedIds }).unwrap();
      toast.success(`Successfully deleted ${selectedIds.length} campaigns!`);
      setSelectedIds([]);
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete selected campaigns');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Single action triggers
  const handleOpenCreate = () => {
    setSelectedOffer(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleOpenEdit = (offer) => {
    setSelectedOffer(offer);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (isEditing && selectedOffer) {
        await updateOffer({ id: selectedOffer.id || selectedOffer._id, ...payload }).unwrap();
        toast.success('Campaign updated successfully!');
      } else {
        await createOffer(payload).unwrap();
        toast.success('New campaign launched successfully!');
      }
      setShowFormModal(false);
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save campaign');
    }
  };

  const handleToggleStatus = async (offer) => {
    const id = offer.id || offer._id;
    try {
      if (offer.status === 'Active') {
        await deactivateOffer(id).unwrap();
        toast.success(`Campaign "${offer.title}" deactivated.`);
      } else {
        await activateOffer(id).unwrap();
        toast.success(`Campaign "${offer.title}" is now Live!`);
      }
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Status transition failed');
    }
  };

  const handleDuplicateOffer = async (id) => {
    try {
      await duplicateOffer(id).unwrap();
      toast.success('Campaign duplicated as Draft with fresh timeline!');
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to duplicate campaign');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteOffer(id).unwrap();
      toast.success('Campaign deleted successfully.');
      refetchOffers();
      refetchStats();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleOpenAnalytics = (id) => {
    const found = offers.find((o) => (o.id || o._id) === id);
    setSelectedOffer(found || { id });
    setShowAnalyticsModal(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    exportOffersToCsv(offers, `bizreels_offers_${activeTab}_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <AdminPageHeader
        title="Promotions & Marketing Offers"
        subtitle="Orchestrate platform-wide flash sales, discounts, push notifications, and monitor vendor store campaigns."
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-slate-900 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4 stroke-[3]" />
            <span>Create Campaign</span>
          </button>
        }
      />

      {/* 1. Bento Executive KPI Banner */}
      <OfferKpiBanner stats={stats} isLoading={isLoadingStats} />

      {/* 2. 5-Tab Scoping Navigation with Live Badges */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
              className={`group flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                  isActive
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filter Bar */}
      <OfferFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        onResetFilters={handleResetFilters}
        onExportCsv={handleExportCsv}
        totalItems={pagination.total || offers.length}
      />

      {/* 4. High-Density Campaigns Table */}
      <OfferTable
        offers={offers}
        isLoading={isFetchingOffers}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onOpenAnalytics={handleOpenAnalytics}
        onEditOffer={handleOpenEdit}
        onDuplicateOffer={handleDuplicateOffer}
        onToggleStatus={handleToggleStatus}
        onDeleteOffer={handleDeleteOffer}
        pagination={pagination}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* 5. Floating Batch Operations Bar */}
      <OfferBatchActionBar
        selectedCount={selectedIds.length}
        onBatchActivate={handleBatchActivate}
        onBatchDeactivate={handleBatchDeactivate}
        onBatchDelete={handleBatchDelete}
        onClearSelection={() => setSelectedIds([])}
        isProcessing={isBatchProcessing}
      />

      {/* 6. Campaign Create / Edit Modal */}
      <OfferFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        isEditing={isEditing}
        initialData={selectedOffer}
        isSubmitting={isCreating || isUpdating}
      />

      {/* 7. Campaign Analytics & Telemetry Modal */}
      <OfferAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        offer={selectedOffer}
        analyticsData={analyticsData}
        isLoading={isFetchingAnalytics}
      />
    </div>
  );
}
