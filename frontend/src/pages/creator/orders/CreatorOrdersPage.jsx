import React, { useState } from 'react';
import { FiBriefcase, FiCheck, FiClock, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { useGetCreatorOrdersQuery, useUpdateCreatorOrderStatusMutation } from '../../../features/creator/creatorApi';

const TABS = [
  { key: 'all', label: 'All Projects', icon: FiBriefcase },
  { key: 'pending', label: 'Pending', icon: FiClock },
  { key: 'active', label: 'In Progress', icon: FiBriefcase },
  { key: 'completed', label: 'Completed', icon: FiCheck },
  { key: 'cancelled', label: 'Cancelled', icon: FiX },
];

export default function CreatorOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isFetching } = useGetCreatorOrdersQuery(undefined, { pollingInterval: 5000 });
  const [updateStatus] = useUpdateCreatorOrderStatusMutation();

  const allOrders = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

  const filtered = allOrders.filter((o) => {
    const status = (o.status || '').toLowerCase();
    if (activeTab === 'pending') return status === 'pending' || status === 'requested';
    if (activeTab === 'active') return status === 'active' || status === 'in_progress' || status === 'accepted';
    if (activeTab === 'completed') return status === 'completed' || status === 'delivered';
    if (activeTab === 'cancelled') return status === 'cancelled' || status === 'rejected';
    return true;
  });

  const handleAccept = async (id) => {
    try {
      await updateStatus({ id, status: 'accepted' }).unwrap();
      toast.success('Project accepted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept');
    }
  };

  const handleComplete = async (id) => {
    try {
      await updateStatus({ id, status: 'completed' }).unwrap();
      toast.success('Project marked as completed!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to complete');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Project',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || row.listing_title || 'Project'}</span>
          <span className="text-[10px] text-text-tertiary">Client: {row.vendor_name || row.buyer_name || 'Vendor'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Budget',
      render: (val, row) => <span className="font-bold text-emerald-600">₹{(val || row.final_amount || row.current_offer || 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val || 'pending'} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString('en-IN') : '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <AdminPageHeader
        icon={FiBriefcase}
        title="My Projects & Orders"
        subtitle="Manage vendor project requests, track progress, and mark deliveries"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={isFetching}
        searchPlaceholder="Search projects..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No projects found in this view."
        testId="creator-orders-table"
        actions={(row) => {
          const status = (row.status || '').toLowerCase();
          return (
            <>
              {(status === 'pending' || status === 'requested') && (
                <button
                  onClick={() => handleAccept(row.id || row._id)}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                  title="Accept Project"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {(status === 'active' || status === 'accepted' || status === 'in_progress') && (
                <button
                  onClick={() => handleComplete(row.id || row._id)}
                  className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
                  title="Mark Completed"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          );
        }}
      />
    </div>
  );
}
