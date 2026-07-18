import React, { useState } from 'react';
import { FiAlertTriangle, FiUsers, FiLayers, FiFilm, FiStar, FiMessageSquare, FiInbox, FiSlash, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useListAdminReportsQuery,
  useResolveReportMutation,
  useDismissReportMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Moderation Reports', icon: FiAlertTriangle },
  { key: 'users', label: 'Reported Users', icon: FiUsers },
  { key: 'listings', label: 'Reported Listings', icon: FiLayers },
  { key: 'reels', label: 'Reported Reels', icon: FiFilm },
  { key: 'reviews', label: 'Reported Reviews', icon: FiStar },
  { key: 'chat', label: 'Reported Chats', icon: FiMessageSquare },
  { key: 'requirements', label: 'Reported Requirements', icon: FiInbox },
  { key: 'blocks', label: 'Block History', icon: FiSlash },
];

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isFetching } = useListAdminReportsQuery(undefined, { pollingInterval: 5000 });
  const [resolveReport] = useResolveReportMutation();
  const [dismissReport] = useDismissReportMutation();

  const items = data?.items || [];

  const filtered = items.filter((r) => {
    if (activeTab === 'users') return r.target_type === 'user';
    if (activeTab === 'listings') return r.target_type === 'listing';
    if (activeTab === 'reels') return r.target_type === 'reel';
    if (activeTab === 'reviews') return r.target_type === 'review';
    if (activeTab === 'chat') return r.target_type === 'chat';
    if (activeTab === 'requirements') return r.target_type === 'requirement';
    return true;
  });

  const handleResolve = async (id) => {
    try {
      await resolveReport({ id, action: 'takedown', note: 'Resolved by admin' }).unwrap();
      toast.success('Report resolved & content moderated!');
    } catch (err) {
      toast.error(err?.data?.message || 'Resolve failed');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissReport({ id, reason: 'False claim' }).unwrap();
      toast.success('Report dismissed');
    } catch (err) {
      toast.error(err?.data?.message || 'Dismiss failed');
    }
  };

  const columns = [
    {
      key: 'target_type',
      label: 'Target Type',
      render: (val) => (
        <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
          {val}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Report Reason',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary">{row.description || 'No extra notes'}</span>
        </div>
      ),
    },
    {
      key: 'target_id',
      label: 'Target ID',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: 'Reported Date',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiAlertTriangle}
        title="Reports & Moderation Central"
        subtitle="Centralized moderation hub: Reported Users, Listings, Reels, Reviews, Chat, Requirements, and Block History"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={isFetching}
        searchPlaceholder="Search moderation reports..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No open reports found matching filter."
        testId="moderation-table"
        actions={(row) => (
          row.status === 'pending' && (
            <>
              <button
                onClick={() => handleResolve(row.id)}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                title="Resolve & Take Action"
              >
                <FiCheck className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDismiss(row.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                title="Dismiss Report"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </>
          )
        )}
      />
    </div>
  );
}
