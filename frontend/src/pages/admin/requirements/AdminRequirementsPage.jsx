import React, { useState } from 'react';
import { FiInbox, FiPackage, FiTool, FiCheckCircle, FiXCircle, FiAlertTriangle, FiEye } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useListAdminRequirementsQuery } from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Requirements', icon: FiInbox },
  { key: 'product', label: 'Product Requirements', icon: FiPackage },
  { key: 'service', label: 'Service Requirements', icon: FiTool },
  { key: 'pending', label: 'Pending', icon: FiInbox },
  { key: 'matched', label: 'Matched', icon: FiCheckCircle },
  { key: 'closed', label: 'Closed', icon: FiXCircle },
  { key: 'reported', label: 'Reported', icon: FiAlertTriangle },
];

export default function AdminRequirementsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [viewReq, setViewReq] = useState(null);

  const queryParams = { limit: 100 };
  if (activeTab === 'pending' || activeTab === 'matched' || activeTab === 'closed') {
    queryParams.status = activeTab;
  } else if (activeTab === 'product' || activeTab === 'service') {
    queryParams.type = activeTab;
  }

  const { data, isFetching } = useListAdminRequirementsQuery(queryParams, { pollingInterval: 5000 });
  const items = data?.items || [];

  const columns = [
    {
      key: 'title',
      label: 'Requirement Title',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || 'Untitled Requirement'}</span>
          <span className="text-[10px] text-text-tertiary capitalize">{row.type} • {row.category || 'General'}</span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      label: 'Posted By',
      render: (val) => <span className="font-semibold text-text-secondary text-xs">{val || 'Customer'}</span>,
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (val) => <span className="font-bold text-brand-purple">₹{(val || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'matches_count',
      label: 'Proposals / Matches',
      render: (val) => <span className="font-bold text-emerald-600">{val || 0} proposals</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: 'Posted Date',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiInbox}
        title="Requirement Management"
        subtitle="Monitor customer product & service requests, vendor matches, proposals, and reported leads"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search requirements..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No requirements found matching filter."
        testId="requirements-table"
        actions={(row) => (
          <button
            onClick={() => setViewReq(row)}
            className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
            title="View Details"
          >
            <FiEye className="w-3.5 h-3.5" />
          </button>
        )}
      />

      <AdminModal isOpen={!!viewReq} onClose={() => setViewReq(null)} title="Requirement Detail">
        {viewReq && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-sm text-text-primary">{viewReq.title}</h4>
              <div><span className="text-text-tertiary">Customer:</span> <strong className="text-text-primary">{viewReq.customer_name}</strong></div>
              <div><span className="text-text-tertiary">Type & Category:</span> <strong className="text-text-primary capitalize">{viewReq.type} — {viewReq.category}</strong></div>
              <div><span className="text-text-tertiary">Budget:</span> <strong className="text-brand-purple">₹{(viewReq.budget || 0).toLocaleString('en-IN')}</strong></div>
              <div><span className="text-text-tertiary">Proposals Submitted:</span> <strong className="text-emerald-600">{viewReq.matches_count} proposals</strong></div>
              <div><span className="text-text-tertiary">Status:</span> <AdminStatusBadge status={viewReq.status} className="ml-2" /></div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
