import React, { useState } from 'react';
import { FiFilm, FiZap, FiTrendingUp, FiAlertTriangle, FiTrash2, FiPlay, FiTv, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminReelsQuery,
  useTakedownReelMutation,
  useToggleBoostReelMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'Published Reels', icon: FiFilm },
  { key: 'boosted', label: 'Boosted Reels', icon: FiZap },
  { key: 'trending', label: 'Trending Reels', icon: FiTrendingUp },
  { key: 'reported', label: 'Reported Reels', icon: FiAlertTriangle },
  { key: 'deleted', label: 'Deleted Reels', icon: FiTrash2 },
  { key: 'live', label: 'Live Videos', icon: FiTv },
];

export default function AdminReelsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [playReel, setPlayReel] = useState(null);

  const queryParams = {};
  if (activeTab === 'boosted') queryParams.is_boosted = 'true';

  const { data, isFetching } = useListAdminReelsQuery(queryParams, { pollingInterval: 5000 });
  const [takedownReel] = useTakedownReelMutation();
  const [toggleBoost] = useToggleBoostReelMutation();

  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    if (activeTab === 'deleted') return item.isDeleted;
    if (activeTab === 'trending') return (item.views || 0) > 10;
    return !item.isDeleted;
  });

  const handleTakedown = async (id) => {
    if (!window.confirm('Delete/takedown this reel?')) return;
    try {
      await takedownReel(id).unwrap();
      toast.success('Reel taken down!');
    } catch (err) {
      toast.error(err?.data?.message || 'Takedown failed');
    }
  };

  const handleToggleBoost = async (id) => {
    try {
      const res = await toggleBoost(id).unwrap();
      toast.success(res.isBoosted ? 'Reel boosted!' : 'Boost removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const columns = [
    {
      key: 'caption',
      label: 'Reel Content',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div
            onClick={() => setPlayReel(row)}
            className="w-12 h-16 rounded-xl bg-black flex items-center justify-center text-white relative cursor-pointer group overflow-hidden border border-border flex-shrink-0"
          >
            {row.thumbnailUrl ? (
              <img src={row.thumbnailUrl} alt={val} className="w-full h-full object-cover" />
            ) : (
              <FiFilm className="w-5 h-5 opacity-70" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all">
              <FiPlay className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-text-primary block truncate max-w-[220px]">{val || 'No caption'}</span>
            <span className="text-[10px] text-text-tertiary">by {row.creator_name || 'Creator'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (val) => <span className="font-bold text-text-primary">{val ? val.toLocaleString() : '0'}</span>,
    },
    {
      key: 'likesCount',
      label: 'Likes',
      render: (val) => <span className="text-brand-pink font-bold">♥ {val || 0}</span>,
    },
    {
      key: 'isBoosted',
      label: 'Boosted',
      render: (val) => (
        <span className={`text-xs font-bold ${val ? 'text-amber-500' : 'text-text-tertiary'}`}>
          {val ? '⚡ Boosted' : 'No'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Uploaded',
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFilm}
        title="Reel Management"
        subtitle="Moderate reels, view video previews, manage boosted and trending content"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filteredItems}
        loading={isFetching}
        searchPlaceholder="Search reels by caption..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No reels found in this view."
        testId="reels-table"
        actions={(row) => (
          <>
            <button
              onClick={() => setPlayReel(row)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="Play Video"
            >
              <FiPlay className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleToggleBoost(row.id)}
              className={`p-1.5 rounded-lg transition-all ${row.isBoosted ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500'}`}
              title={row.isBoosted ? 'Remove Boost' : 'Boost Reel'}
            >
              <FiZap className="w-3.5 h-3.5" />
            </button>
            {!row.isDeleted && (
              <button
                onClick={() => handleTakedown(row.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                title="Delete Reel"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      />

      {/* Video Player Preview Modal */}
      <AdminModal isOpen={!!playReel} onClose={() => setPlayReel(null)} title="Reel Preview" maxWidth="max-w-md">
        {playReel && (
          <div className="space-y-4">
            <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative border border-border flex items-center justify-center">
              {playReel.videoUrl ? (
                <video src={playReel.videoUrl} controls autoPlay className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-xs text-center p-4">Video URL missing or invalid format</div>
              )}
            </div>
            <div className="bg-surface-secondary p-3 rounded-xl text-xs space-y-1">
              <span className="font-bold text-text-primary block">{playReel.caption || 'No caption'}</span>
              <span className="text-text-tertiary block">Creator: {playReel.creator_name}</span>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
