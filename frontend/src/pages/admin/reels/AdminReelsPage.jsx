import React, { useState, useEffect, useMemo } from 'react';
import {
  FiFilm,
  FiZap,
  FiTrendingUp,
  FiAlertTriangle,
  FiTrash2,
  FiTv,
  FiClock
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import {
  useGetAdminReelStatsQuery,
  useListAdminReelsQuery,
  useTakedownReelMutation,
  useRestoreReelMutation,
  useModerateReelMutation,
  useToggleBoostReelMutation,
  useBulkActionReelsMutation,
} from '../../../features/admin/adminApi';
import { getSocket } from '../../../lib/socket';
import {
  ReelKpiBanner,
  ReelFilterBar,
  ReelBatchActionBar,
  ReelTable,
  ReelPreviewModal,
  ReelModerateModal
} from './components';

export default function AdminReelsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewReel, setPreviewReel] = useState(null);
  const [moderateReelItem, setModerateReelItem] = useState(null);

  // RTK Query endpoints
  const { data: stats, isFetching: isFetchingStats, refetch: refetchStats } = useGetAdminReelStatsQuery();

  const queryParams = useMemo(() => {
    const q = {};
    if (activeTab === 'boosted') q.is_boosted = 'true';
    if (activeTab === 'review_queue' || activeTab === 'reported') q.is_reported = 'true';
    if (activeTab === 'trending') q.is_trending = 'true';
    if (activeTab === 'deleted') q.is_deleted = 'true';
    if (activeTab === 'live') q.is_live = 'true';
    return q;
  }, [activeTab]);

  const { data: listData, isFetching: isFetchingList, refetch: refetchList } = useListAdminReelsQuery(
    queryParams,
    { refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );

  const [takedownReel] = useTakedownReelMutation();
  const [restoreReel] = useRestoreReelMutation();
  const [moderateReel, { isLoading: isModerating }] = useModerateReelMutation();
  const [toggleBoost] = useToggleBoostReelMutation();
  const [bulkActionReels, { isLoading: isBulkActioning }] = useBulkActionReelsMutation();

  // Real-time WebSocket synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      refetchList();
      refetchStats();
    };

    socket.on('admin:update', handleUpdate);
    socket.on('reel:takedown', handleUpdate);
    socket.on('reel:restored', handleUpdate);
    socket.on('reel:boosted', handleUpdate);

    return () => {
      socket.off('admin:update', handleUpdate);
      socket.off('reel:takedown', handleUpdate);
      socket.off('reel:restored', handleUpdate);
      socket.off('reel:boosted', handleUpdate);
    };
  }, [refetchList, refetchStats]);

  // Tab definitions with dynamic count badges
  const tabs = useMemo(() => [
    { key: 'all', label: 'Published Reels', icon: FiFilm, count: stats?.totalReels },
    { key: 'boosted', label: 'Boosted', icon: FiZap, count: stats?.boostedCount },
    { key: 'review_queue', label: 'Review Queue', icon: FiClock, count: stats?.reviewQueueCount },
    { key: 'trending', label: 'Trending', icon: FiTrendingUp, count: stats?.trendingCount },
    { key: 'reported', label: 'Flagged Content', icon: FiAlertTriangle, count: stats?.flaggedCount },
    { key: 'deleted', label: 'Deleted', icon: FiTrash2, count: stats?.deletedCount },
    { key: 'live', label: 'Live Broadcasts', icon: FiTv, count: stats?.liveCount },
  ], [stats]);

  const rawItems = listData?.items || [];

  // Client-side filtering & sorting
  const processedItems = useMemo(() => {
    let result = [...rawItems];

    // Filter by tab deletion integrity
    if (activeTab === 'deleted') {
      result = result.filter((i) => i.isDeleted);
    } else {
      result = result.filter((i) => !i.isDeleted);
    }

    // Filter by postType
    if (postTypeFilter !== 'all') {
      result = result.filter((i) => (i.postType || 'general').toLowerCase() === postTypeFilter);
    }

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((i) => {
        const captionMatch = (i.caption || '').toLowerCase().includes(term);
        const creatorMatch = (i.creator_name || i.creator?.name || '').toLowerCase().includes(term);
        const phoneMatch = (i.creator?.phone || '').includes(term);
        const tagMatch = (i.hashtags || []).some((h) => h.toLowerCase().includes(term));
        return captionMatch || creatorMatch || phoneMatch || tagMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === 'comments') return (b.commentsCount || 0) - (a.commentsCount || 0);
      return 0;
    });

    return result;
  }, [rawItems, activeTab, postTypeFilter, search, sortBy]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === processedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedItems.map((i) => i.id || i._id));
    }
  };

  // Actions
  const handleToggleBoost = async (reel) => {
    const id = reel.id || reel._id;
    try {
      const res = await toggleBoost(id).unwrap();
      toast.success(res.isBoosted ? 'Reel boosted for discovery' : 'Reel boost removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to toggle boost');
    }
  };

  const handleTakedown = async (reel) => {
    const id = reel.id || reel._id;
    const isLive = reel.isLiveStream || activeTab === 'live';
    const confirmMsg = isLive ? 'End this live broadcast immediately?' : 'Takedown and hide this reel from feeds?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await takedownReel(id).unwrap();
      toast.success(isLive ? 'Live broadcast ended' : 'Reel taken down successfully');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err?.data?.message || 'Takedown failed');
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Restore this reel back to the public catalog?')) return;
    try {
      await restoreReel(id).unwrap();
      toast.success('Reel restored successfully');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err?.data?.message || 'Restore failed');
    }
  };

  const handleModerateSubmit = async (id, payload) => {
    try {
      await moderateReel({ id, ...payload }).unwrap();
      toast.success(payload.status === 'rejected' ? 'Reel rejected & taken down' : 'Reel approved successfully');
      setModerateReelItem(null);
      if (previewReel && (previewReel.id === id || previewReel._id === id)) {
        setPreviewReel(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Moderation action failed');
    }
  };

  const handleBatchAction = async (action) => {
    if (!selectedIds.length) return;
    const actionLabel = action.replace('bulk_', '');
    if (!window.confirm(`Apply ${actionLabel} to ${selectedIds.length} selected reels?`)) return;
    try {
      const res = await bulkActionReels({ reelIds: selectedIds, action }).unwrap();
      toast.success(res.message || `Batch ${actionLabel} applied`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.data?.message || 'Bulk action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 pb-16 animate-in fade-in duration-150">
      {/* Page Header */}
      <AdminPageHeader
        icon={FiFilm}
        title="Reels & Video Catalog"
        subtitle="Comprehensive video catalog governance, e-commerce tagging, automated AI audits, and manual moderation."
      />

      {/* KPI Bento Grid Banner */}
      <ReelKpiBanner
        stats={stats}
        isFetching={isFetchingStats}
        activeTab={activeTab}
        onSelectTab={(tabKey) => {
          setActiveTab(tabKey);
          setSelectedIds([]);
        }}
      />

      {/* Navigation Tab Bar */}
      <AdminTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => {
          setActiveTab(key);
          setSelectedIds([]);
        }}
      />

      {/* Filter, Search & Export Bar */}
      <ReelFilterBar
        search={search}
        onSearchChange={setSearch}
        postTypeFilter={postTypeFilter}
        onPostTypeChange={setPostTypeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={rawItems.length}
        filteredCount={processedItems.length}
        onRefresh={() => {
          refetchList();
          refetchStats();
        }}
        isFetching={isFetchingList}
        allItems={processedItems}
      />

      {/* Reels Catalog Data Table */}
      <ReelTable
        items={processedItems}
        isFetching={isFetchingList}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onPreview={setPreviewReel}
        onModerate={setModerateReelItem}
        onToggleBoost={handleToggleBoost}
        onTakedown={handleTakedown}
        onRestore={handleRestore}
        activeTab={activeTab}
      />

      {/* Floating Batch Operations Bar */}
      <ReelBatchActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBatchAction={handleBatchAction}
        isLoading={isBulkActioning}
      />

      {/* Split Video Player & Telemetry Preview Modal */}
      {previewReel && (
        <ReelPreviewModal
          reel={previewReel}
          onClose={() => setPreviewReel(null)}
          onToggleBoost={handleToggleBoost}
          onModerate={(reel) => {
            setModerateReelItem(reel);
          }}
          onTakedown={handleTakedown}
          onRestore={handleRestore}
        />
      )}

      {/* Moderation Review & Policy Enforcement Modal */}
      {moderateReelItem && (
        <ReelModerateModal
          reel={moderateReelItem}
          onClose={() => setModerateReelItem(null)}
          onSubmit={handleModerateSubmit}
          isLoading={isModerating}
        />
      )}
    </div>
  );
}
