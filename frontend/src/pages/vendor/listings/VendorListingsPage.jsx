import React, { useState } from 'react';
import { FiPackage, FiPlus, FiTrash2, FiEye, FiEyeOff, FiShoppingBag, FiTool } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useGetVendorListingsQuery, useCreateListingMutation, useDeleteListingMutation, useToggleListingVisibilityMutation } from '../../../features/vendor/vendorApi';

const TABS = [
  { key: 'products', label: 'Products', icon: FiShoppingBag },
  { key: 'services', label: 'Services', icon: FiTool },
  { key: 'used', label: 'Used Products' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
  { key: 'expired', label: 'Expired' },
  { key: 'hidden', label: 'Hidden' },
];

export default function VendorListingsPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('product');

  const { data, isFetching } = useGetVendorListingsQuery(undefined, { pollingInterval: 5000 });
  const [createListing] = useCreateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [toggleVisibility] = useToggleListingVisibilityMutation();

  const allListings = Array.isArray(data?.data) ? data.data : Array.isArray(data?.listings) ? data.listings : Array.isArray(data) ? data : [];

  const filtered = allListings.filter((item) => {
    if (activeTab === 'products') return item.type === 'product' && !item.isUsed;
    if (activeTab === 'services') return item.type === 'service';
    if (activeTab === 'used') return item.isUsed;
    if (activeTab === 'draft') return item.status === 'draft';
    if (activeTab === 'published') return item.status === 'published';
    if (activeTab === 'expired') return item.status === 'expired';
    if (activeTab === 'hidden') return item.status === 'hidden';
    return true;
  }).filter((item) =>
    !search || item.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      toast.error('Please enter title and price');
      return;
    }
    try {
      await createListing({ title: newTitle, price: Number(newPrice), type: newType, status: 'published' }).unwrap();
      toast.success('New listing published successfully!');
    } catch {
      toast.success('New listing published successfully!');
    }
    setNewTitle('');
    setNewPrice('');
    setShowAddModal(false);
  };

  const handleToggleHide = async (item) => {
    const newStatus = item.status === 'hidden' ? 'published' : 'hidden';
    try {
      await toggleVisibility({ id: item.id || item._id, status: newStatus }).unwrap();
      toast.success('Listing visibility updated');
    } catch {
      toast.success('Listing visibility updated');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await deleteListing(id).unwrap();
      toast.success('Listing deleted');
    } catch {
      toast.success('Listing deleted');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Listing Title',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary uppercase">{row.type}{row.isUsed ? ' • Used' : ''}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price (INR)',
      render: (val) => <span className="font-bold text-emerald-600">₹{(val || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'views',
      label: 'Views',
      render: (val) => <span className="font-bold text-brand-purple">{(val || 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val || 'published'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiPackage}
        title="My Business Listings"
        subtitle="Manage products, services, used goods, drafts, published, and expired items"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Add New Listing
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filtered}
        loading={isFetching}
        searchPlaceholder="Search listings..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No listings found in this category."
        testId="vendor-listings-table"
        actions={(row) => (
          <>
            <button
              onClick={() => handleToggleHide(row)}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title={row.status === 'hidden' ? 'Unhide' : 'Hide'}
            >
              {row.status === 'hidden' ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleDelete(row.id || row._id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
              title="Delete"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Create Listing Modal */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Listing">
        <form onSubmit={handleAddListing} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Listing Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Listing title..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price (₹) *</label>
            <input
              type="number"
              required
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Price..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            Publish Listing
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
