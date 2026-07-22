import React, { useState } from 'react';
import { FiLayers, FiPackage, FiTool, FiCheckSquare, FiAlertTriangle, FiEye, FiSlash, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminListingsQuery,
  useTakedownListingMutation,
  useRestoreListingMutation,
  useBulkApproveListingsMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Listings', icon: FiLayers },
  { key: 'product', label: 'Products', icon: FiPackage },
  { key: 'service', label: 'Services', icon: FiTool },
  { key: 'used', label: 'Used Products', icon: FiPackage },
  { key: 'draft', label: 'Draft', icon: FiLayers },
  { key: 'published', label: 'Published', icon: FiLayers },
  { key: 'expired', label: 'Expired', icon: FiLayers },
  { key: 'reported', label: 'Reported', icon: FiAlertTriangle },
];

export default function AdminListingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewItem, setViewItem] = useState(null);

  const queryParams = { limit: 100 };
  if (activeTab === 'published') queryParams.status = 'active';
  else if (activeTab === 'draft') queryParams.status = 'draft';
  else if (activeTab === 'expired') queryParams.status = 'expired';
  else if (activeTab === 'reported') queryParams.flagged = 'true';

  const { data, isFetching } = useListAdminListingsQuery(queryParams, { pollingInterval: 5000 });
  const [takedownListing] = useTakedownListingMutation();
  const [restoreListing] = useRestoreListingMutation();
  const [bulkApprove] = useBulkApproveListingsMutation();

  const items = data?.items || [];

  const filteredItems = items.filter((item) => {
    if (activeTab === 'product') return item.type === 'product' && item.condition !== 'used';
    if (activeTab === 'service') return item.type === 'service';
    if (activeTab === 'used') return item.condition === 'used';
    return true;
  });

  const handleTakedown = async (id) => {
    try {
      await takedownListing(id).unwrap();
      toast.success('Listing taken down!');
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreListing(id).unwrap();
      toast.success('Listing restored!');
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return toast.error('Select listings to approve');
    try {
      await bulkApprove(selectedIds).unwrap();
      toast.success(`Bulk approved ${selectedIds.length} listings!`);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err?.data?.message || 'Bulk approval failed');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const columns = [
    {
      key: 'select',
      label: '',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="rounded border-border text-brand-purple focus:ring-brand-purple"
        />
      ),
    },
    {
      key: 'title',
      label: 'Listing Title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.images && row.images[0] ? (
            <img src={row.images[0]} alt={val} className="w-10 h-10 rounded-xl object-cover border border-border" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center text-text-tertiary">
              <FiPackage className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="font-bold text-text-primary block truncate max-w-[200px]">{val || 'Untitled'}</span>
            <span className="text-[10px] text-text-tertiary capitalize">{row.type} • {row.category || 'General'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => <span className="font-bold text-brand-navy">₹{(val || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'condition',
      label: 'Condition',
      render: (val) => <span className="capitalize text-xs text-text-secondary">{val || 'new'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <AdminStatusBadge status={row.is_takendown ? 'Reported' : val === 'active' ? 'Published' : val} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created At',
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiLayers}
        title="Listing Management"
        subtitle="Manage products, services, used goods, drafts, published, and reported items"
      >
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-premium"
          >
            <FiCheckSquare className="w-4 h-4" /> Bulk Approve ({selectedIds.length})
          </button>
        )}
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filteredItems}
        loading={isFetching}
        searchPlaceholder="Search listings by title..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No listings found matching filter."
        testId="listings-table"
        actions={(row) => (
          <>
            <button
              onClick={() => setViewItem(row)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View Detail"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {row.is_takendown ? (
              <button
                onClick={() => handleRestore(row.id)}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500 transition-all"
                title="Restore Listing"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleTakedown(row.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                title="Takedown Listing"
              >
                <FiSlash className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      />

      {/* View Listing Modal */}
      <AdminModal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Listing Details" maxWidth="max-w-xl">
        {viewItem && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {viewItem.images && viewItem.images[0] && (
                <img src={viewItem.images[0]} alt={viewItem.title} className="w-24 h-24 rounded-xl object-cover border border-border" />
              )}
              <div>
                <h4 className="text-sm font-bold text-text-primary">{viewItem.title}</h4>
                <p className="text-xs text-brand-purple font-bold mt-1">₹{(viewItem.price || 0).toLocaleString('en-IN')}</p>
                <AdminStatusBadge status={viewItem.status} className="mt-2" />
              </div>
            </div>

            <div className="bg-surface-secondary p-3 rounded-xl text-xs space-y-1">
              <div><span className="text-text-tertiary">Vendor / Seller:</span> <strong className="text-brand-purple font-bold">{viewItem.vendor_name || viewItem.vendor?.name || viewItem.vendor_id || 'Registered Vendor'}</strong></div>
              <div><span className="text-text-tertiary">Category:</span> <strong className="text-text-primary">{viewItem.category}</strong></div>
              <div><span className="text-text-tertiary">Type:</span> <strong className="text-text-primary capitalize">{viewItem.type}</strong></div>
              <div><span className="text-text-tertiary">Condition:</span> <strong className="text-text-primary capitalize">{viewItem.condition || 'New'}</strong></div>
              <div><span className="text-text-tertiary">Description:</span> <p className="text-text-secondary mt-1">{viewItem.description || 'No description provided.'}</p></div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
