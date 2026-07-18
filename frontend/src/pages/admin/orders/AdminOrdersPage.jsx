import React, { useState } from 'react';
import { FiShoppingBag, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertTriangle, FiEye } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useListAdminOrdersQuery } from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Orders', icon: FiShoppingBag },
  { key: 'new', label: 'New Orders', icon: FiClock },
  { key: 'accepted', label: 'Accepted', icon: FiCheckCircle },
  { key: 'completed', label: 'Completed', icon: FiCheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: FiXCircle },
  { key: 'refund', label: 'Refund Requests', icon: FiRefreshCw },
  { key: 'disputes', label: 'Disputes', icon: FiAlertTriangle },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState(null);

  const queryParams = { limit: 100 };
  if (activeTab !== 'all' && activeTab !== 'refund' && activeTab !== 'disputes') {
    queryParams.status = activeTab;
  }

  const { data, isFetching } = useListAdminOrdersQuery(queryParams, { pollingInterval: 5000 });
  const items = data?.items || [];

  const columns = [
    {
      key: 'listing_title',
      label: 'Order Item / Deal',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val || `Order #${row.id.slice(-6)}`}</span>
          <span className="text-[10px] text-text-tertiary font-mono">ID: {row.id}</span>
        </div>
      ),
    },
    {
      key: 'buyer_id',
      label: 'Buyer',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'seller_id',
      label: 'Seller / Vendor',
      render: (val) => <span className="font-mono text-xs text-text-secondary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'final_amount',
      label: 'Amount',
      render: (val, row) => <span className="font-bold text-emerald-600">₹{(val || row.current_offer || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiShoppingBag}
        title="Order Management"
        subtitle="Manage order lifecycle: New, Accepted, Completed, Cancelled, Refund requests, and Disputes"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search orders..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No orders found matching status."
        testId="orders-table"
        actions={(row) => (
          <button
            onClick={() => setViewOrder(row)}
            className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
            title="View Order"
          >
            <FiEye className="w-3.5 h-3.5" />
          </button>
        )}
      />

      <AdminModal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title="Order Details">
        {viewOrder && (
          <div className="space-y-4 text-xs">
            <div className="bg-surface-secondary p-4 rounded-xl space-y-2">
              <div><span className="text-text-tertiary">Order ID:</span> <strong className="font-mono text-text-primary">{viewOrder.id}</strong></div>
              <div><span className="text-text-tertiary">Listing:</span> <strong className="text-text-primary">{viewOrder.listing_title}</strong></div>
              <div><span className="text-text-tertiary">Buyer ID:</span> <strong className="font-mono text-text-primary">{viewOrder.buyer_id}</strong></div>
              <div><span className="text-text-tertiary">Seller ID:</span> <strong className="font-mono text-text-primary">{viewOrder.seller_id}</strong></div>
              <div><span className="text-text-tertiary">Amount:</span> <strong className="text-emerald-600 text-sm">₹{(viewOrder.final_amount || viewOrder.current_offer || 0).toLocaleString('en-IN')}</strong></div>
              <div><span className="text-text-tertiary">Status:</span> <AdminStatusBadge status={viewOrder.status} className="ml-2" /></div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
