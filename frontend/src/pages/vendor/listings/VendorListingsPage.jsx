import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiShoppingBag, FiTool, FiPercent, FiCheck, FiPlus
} from 'react-icons/fi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';
import {
  useGetVendorListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useToggleListingVisibilityMutation,
  useDuplicateListingMutation,
  useBulkUpdateListingsMutation,
  useUpdateListingStockMutation,
  useGetVendorOffersQuery,
  useCreateVendorOfferMutation,
  useUpdateVendorOfferMutation,
  useDeleteVendorOfferMutation,
  useDuplicateVendorOfferMutation,
  useToggleOfferStatusMutation
} from '../../../features/vendor/vendorApi';

// Sub-components
import ListingHeader from './ListingHeader';
import ListingFilters from './ListingFilters';
import ListingTable from './ListingTable';
import OffersTab from './OffersTab';
import ProductFormModal from './ProductFormModal';
import ServiceFormModal from './ServiceFormModal';
import OfferFormModal from './OfferFormModal';
import ListingDetailDrawer from './ListingDetailDrawer';
import ConfirmDialog from './ConfirmDialog';
import SubscriptionModal from './SubscriptionModal';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';

export default function VendorListingsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};
  const vendorId = currentUser?._id || currentUser?.id;

  // Registered info
  const registeredCat = vendorProfile.category || vendorProfile.businessCategory || '';
  const registeredSubcats = vendorProfile.subcategories || [];

  // Geolocation
  const [vendorCoords, setVendorCoords] = useState(null);

  // States
  const [activeTab, setActiveTab] = useState('products');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Active data for edit/view
  const [editListingData, setEditListingData] = useState(null);
  const [editOfferData, setEditOfferData] = useState(null);
  const [selectedListingDetails, setSelectedListingDetails] = useState(null);

  // Confirmation dialog action tracker
  const [confirmAction, setConfirmAction] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false
  });

  // Categories lists (from live API)
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // RTK Query endpoints
  const { data: listingsData, isFetching: listingsFetching, refetch: refetchListings } = useGetVendorListingsQuery(
    vendorId ? { vendor: vendorId } : undefined,
    { pollingInterval: 5000 }
  );

  const { data: offersData, isFetching: offersFetching, refetch: refetchOffers } = useGetVendorOffersQuery(
    undefined,
    { pollingInterval: 5000 }
  );

  const [createListing] = useCreateListingMutation();
  const [updateListing] = useUpdateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [toggleVisibility] = useToggleListingVisibilityMutation();
  const [duplicateListing] = useDuplicateListingMutation();
  const [bulkUpdateListings] = useBulkUpdateListingsMutation();
  const [updateStock] = useUpdateListingStockMutation();

  const [createOffer] = useCreateVendorOfferMutation();
  const [updateOffer] = useUpdateVendorOfferMutation();
  const [deleteOffer] = useDeleteVendorOfferMutation();
  const [duplicateOffer] = useDuplicateVendorOfferMutation();
  const [toggleOfferStatus] = useToggleOfferStatusMutation();

  // Load Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setVendorCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Vendor geolocation error:', err)
      );
    }
  }, []);

  // Fetch Categories
  const fetchLiveCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/v1/categories');
      const cats = res.data?.items || res.data || res.items || [];
      if (Array.isArray(cats)) {
        setCategoriesList(cats);
      }
    } catch (err) {
      console.error('Error fetching live categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCategories();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    const activeCategory = registeredCat;
    if (activeCategory) {
      const selected = categoriesList.find(
        c => c.name === activeCategory || c.id === activeCategory || c.slug === activeCategory
      );
      if (selected) {
        const subs = categoriesList.filter(c => c.parent_id === selected.id || c.parent_id === selected._id);
        setSubcategoriesList(subs.map(s => s.name));
      } else if (registeredSubcats.length > 0) {
        setSubcategoriesList(registeredSubcats);
      } else {
        setSubcategoriesList(['General', 'Premium', 'Standard']);
      }
    }
  }, [categoriesList, registeredCat]);

  // Transform listings
  const allListings = Array.isArray(listingsData?.data)
    ? listingsData.data
    : Array.isArray(listingsData?.listings)
    ? listingsData.listings
    : Array.isArray(listingsData)
    ? listingsData
    : [];

  const offersList = Array.isArray(offersData?.data)
    ? offersData.data
    : Array.isArray(offersData?.offers)
    ? offersData.offers
    : Array.isArray(offersData)
    ? offersData
    : [];

  // Tab counts
  const productsCount = allListings.filter(i => i.type === 'product').length;
  const servicesCount = allListings.filter(i => i.type === 'service').length;
  const publishedCount = allListings.filter(i => (i.status || 'published') === 'published').length;
  const draftCount = allListings.filter(i => i.status === 'draft').length;
  const hiddenCount = allListings.filter(i => i.status === 'hidden').length;

  const dynamicTabs = [
    { key: 'products', label: 'Products', icon: FiShoppingBag, count: productsCount },
    { key: 'services', label: 'Services', icon: FiTool, count: servicesCount },
    { key: 'offers', label: 'Dynamic Offers', icon: FiPercent, count: offersList.length },
    { key: 'published', label: 'Published', count: publishedCount },
    { key: 'draft', label: 'Draft', count: draftCount },
    { key: 'hidden', label: 'Hidden', count: hiddenCount },
  ];

  // Filtering
  const filteredListings = allListings.filter(item => {
    const itemStatus = item.status || 'published';
    if (activeTab === 'products') return item.type === 'product';
    if (activeTab === 'services') return item.type === 'service';
    if (activeTab === 'draft') return itemStatus === 'draft';
    if (activeTab === 'published') return itemStatus === 'published';
    if (activeTab === 'hidden') return itemStatus === 'hidden';
    return true;
  }).filter(item => {
    // Dropdown filters
    if (statusFilter && item.status !== statusFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    // Search
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      String(item._id || item.id).toLowerCase().includes(q)
    );
  });

  // Sorting
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'price_high') return (b.sellingPrice || b.price) - (a.sellingPrice || a.price);
    if (sortBy === 'price_low') return (a.sellingPrice || a.price) - (b.sellingPrice || b.price);
    if (sortBy === 'most_viewed') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'most_ordered') return (b.orders_count || 0) - (a.orders_count || 0);
    if (sortBy === 'highest_rated') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  // Table Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (idsOnPage) => {
    const allSelected = idsOnPage.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !idsOnPage.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...idsOnPage])]);
    }
  };

  // CRUD Actions
  const handleProductSubmit = async (payload) => {
    const isEdit = !!payload._editId;
    const toastId = toast.loading(`${isEdit ? 'Updating' : 'Publishing'} product listing...`);
    try {
      if (isEdit) {
        await updateListing({ id: payload._editId, ...payload }).unwrap();
        toast.success('Product updated in real-time!', { id: toastId });
      } else {
        await createListing(payload).unwrap();
        toast.success('Product published in real-time!', { id: toastId });
      }
      setShowProductModal(false);
      setEditListingData(null);
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save product listing', { id: toastId });
    }
  };

  const handleServiceSubmit = async (payload) => {
    const isEdit = !!payload._editId;
    const toastId = toast.loading(`${isEdit ? 'Updating' : 'Publishing'} service listing...`);
    try {
      if (isEdit) {
        await updateListing({ id: payload._editId, ...payload }).unwrap();
        toast.success('Service updated in real-time!', { id: toastId });
      } else {
        await createListing(payload).unwrap();
        toast.success('Service published in real-time!', { id: toastId });
      }
      setShowServiceModal(false);
      setEditListingData(null);
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save service listing', { id: toastId });
    }
  };

  const handleOfferSubmit = async (payload) => {
    const isEdit = !!payload._editId;
    const toastId = toast.loading(`${isEdit ? 'Updating' : 'Creating'} dynamic offer...`);
    try {
      if (isEdit) {
        await updateOffer({ id: payload._editId, ...payload }).unwrap();
        toast.success('Dynamic offer updated!', { id: toastId });
      } else {
        await createOffer(payload).unwrap();
        toast.success('Dynamic offer published in real-time!', { id: toastId });
      }
      setShowOfferModal(false);
      setEditOfferData(null);
      refetchOffers();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save offer', { id: toastId });
    }
  };

  // Row Operations
  const handleEditRow = (row) => {
    setEditListingData(row);
    if (row.type === 'product') {
      setShowProductModal(true);
    } else {
      setShowServiceModal(true);
    }
  };

  const handleDuplicateRow = async (row) => {
    const toastId = toast.loading('Duplicating listing in real-time...');
    try {
      await duplicateListing(row._id || row.id).unwrap();
      toast.success('Listing duplicated successfully!', { id: toastId });
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to duplicate listing', { id: toastId });
    }
  };

  const handleToggleRowVisibility = async (row) => {
    const lid = row._id || row.id;
    const nextStatus = row.status === 'hidden' ? 'published' : 'hidden';
    const toastId = toast.loading(`Changing visibility to ${nextStatus}...`);
    try {
      await toggleVisibility({ id: lid, status: nextStatus }).unwrap();
      toast.success(`Listing status is now ${nextStatus}!`, { id: toastId });
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to change visibility', { id: toastId });
    }
  };

  const handleDeleteRow = (row) => {
    const lid = row._id || row.id;
    setConfirmAction({
      title: 'Delete Listing',
      message: `Are you sure you want to delete "${row.title}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, loading: true }));
        try {
          await deleteListing(lid).unwrap();
          toast.success('Listing deleted successfully!');
          setShowConfirm(false);
          refetchListings();
        } catch (err) {
          toast.error(err?.data?.message || 'Failed to delete listing');
        } finally {
          setConfirmAction(prev => ({ ...prev, loading: false }));
        }
      }
    });
    setShowConfirm(true);
  };

  const handleStockUpdate = async (id, stockQty) => {
    const toastId = toast.loading('Updating inventory...');
    try {
      await updateStock({ id, stock: stockQty }).unwrap();
      toast.success('Inventory updated successfully!', { id: toastId });
      refetchListings();
      // Update local state if drawer is open
      if (selectedListingDetails?._id === id || selectedListingDetails?.id === id) {
        setSelectedListingDetails(prev => ({ ...prev, stock: stockQty }));
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update inventory', { id: toastId });
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    const toastId = toast.loading('Bulk publishing selected listings...');
    try {
      await bulkUpdateListings({ ids: selectedIds, action: 'status', status: 'published' }).unwrap();
      toast.success('Selected listings published!', { id: toastId });
      setSelectedIds([]);
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Bulk operation failed', { id: toastId });
    }
  };

  const handleBulkHide = async () => {
    const toastId = toast.loading('Bulk hiding selected listings...');
    try {
      await bulkUpdateListings({ ids: selectedIds, action: 'status', status: 'hidden' }).unwrap();
      toast.success('Selected listings hidden!', { id: toastId });
      setSelectedIds([]);
      refetchListings();
    } catch (err) {
      toast.error(err?.data?.message || 'Bulk operation failed', { id: toastId });
    }
  };

  const handleBulkDelete = () => {
    setConfirmAction({
      title: 'Bulk Delete Listings',
      message: `Are you sure you want to delete ${selectedIds.length} listings? This is permanent.`,
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, loading: true }));
        try {
          await bulkUpdateListings({ ids: selectedIds, action: 'delete' }).unwrap();
          toast.success('Selected listings deleted!');
          setSelectedIds([]);
          setShowConfirm(false);
          refetchListings();
        } catch (err) {
          toast.error(err?.data?.message || 'Bulk delete failed');
        } finally {
          setConfirmAction(prev => ({ ...prev, loading: false }));
        }
      }
    });
    setShowConfirm(true);
  };

  // Offer Tab Actions
  const handleEditOffer = (offer) => {
    setEditOfferData(offer);
    setShowOfferModal(true);
  };

  const handleActivateOffer = async (offer) => {
    const toastId = toast.loading('Activating offer...');
    try {
      await toggleOfferStatus({ id: offer.id || offer._id, status: 'active' }).unwrap();
      toast.success('Offer activated!', { id: toastId });
      refetchOffers();
    } catch (err) {
      toast.error('Failed to activate offer', { id: toastId });
    }
  };

  const handleDisableOffer = async (offer) => {
    const toastId = toast.loading('Disabling offer...');
    try {
      await toggleOfferStatus({ id: offer.id || offer._id, status: 'disabled' }).unwrap();
      toast.success('Offer disabled!', { id: toastId });
      refetchOffers();
    } catch (err) {
      toast.error('Failed to disable offer', { id: toastId });
    }
  };

  const handleDuplicateOffer = async (offer) => {
    const toastId = toast.loading('Duplicating offer...');
    try {
      await duplicateOffer(offer.id || offer._id).unwrap();
      toast.success('Offer duplicated successfully!', { id: toastId });
      refetchOffers();
    } catch (err) {
      toast.error('Failed to duplicate offer', { id: toastId });
    }
  };

  const handleDeleteOffer = (offer) => {
    const offerId = offer.id || offer._id;
    setConfirmAction({
      title: 'Delete Offer',
      message: `Are you sure you want to delete offer "${offer.title}"?`,
      onConfirm: async () => {
        setConfirmAction(prev => ({ ...prev, loading: true }));
        try {
          await deleteOffer(offerId).unwrap();
          toast.success('Offer deleted!');
          setShowConfirm(false);
          refetchOffers();
        } catch (err) {
          toast.error('Failed to delete offer');
        } finally {
          setConfirmAction(prev => ({ ...prev, loading: false }));
        }
      }
    });
    setShowConfirm(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header & Sub Banner */}
      <ListingHeader
        registeredCat={registeredCat}
        onShowSubscription={() => setShowSubscription(true)}
        onShowOfferModal={() => { setEditOfferData(null); setShowOfferModal(true); }}
        onShowAddModal={() => setShowAddChoice(true)}
      />

      {/* Tabs */}
      <div className="border-b border-border flex items-center justify-between overflow-x-auto scrollbar-none">
        <AdminTabBar
          tabs={dynamicTabs}
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setSelectedIds([]); }}
        />
      </div>

      {/* Search & Filters */}
      <ListingFilters
        search={search}
        onSearch={setSearch}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        sortBy={sortBy}
        onSortBy={setSortBy}
        selectedCount={selectedIds.length}
        onBulkPublish={handleBulkPublish}
        onBulkHide={handleBulkHide}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
        activeTab={activeTab}
      />

      {/* Content Area */}
      {activeTab === 'offers' ? (
        <OffersTab
          offers={offersList}
          loading={offersFetching}
          onCreateOffer={() => { setEditOfferData(null); setShowOfferModal(true); }}
          onEditOffer={handleEditOffer}
          onActivateOffer={handleActivateOffer}
          onDisableOffer={handleDisableOffer}
          onDuplicateOffer={handleDuplicateOffer}
          onDeleteOffer={handleDeleteOffer}
        />
      ) : (
        <ListingTable
          listings={sortedListings}
          loading={listingsFetching}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onView={(row) => { setSelectedListingDetails(row); setShowDetailDrawer(true); }}
          onEdit={handleEditRow}
          onDuplicate={handleDuplicateRow}
          onToggleVisibility={handleToggleRowVisibility}
          onShare={(row) => {
            navigator.clipboard.writeText(`${window.location.origin}/listings/${row.slug || row._id}`);
            toast.success('Listing URL copied to clipboard!');
          }}
          onDelete={handleDeleteRow}
          pageSize={10}
        />
      )}

      {/* Choice Modal for Adding Product or Service */}
      {showAddChoice && (
        <ConfirmDialog
          isOpen={showAddChoice}
          onClose={() => setShowAddChoice(false)}
          onConfirm={() => { setShowAddChoice(false); setEditListingData(null); setShowProductModal(true); }}
          onCancel={() => { setShowAddChoice(false); setEditListingData(null); setShowServiceModal(true); }}
          title="Add New Catalog Item"
          message="Would you like to list a physical product with inventory tracking, or a custom service booking model?"
          confirmText="Product"
          cancelText="Service"
          variant="warning"
        />
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <ProductFormModal
          isOpen={showProductModal}
          onClose={() => { setShowProductModal(false); setEditListingData(null); }}
          onSubmit={handleProductSubmit}
          editData={editListingData}
          categoriesList={categoriesList}
          subcategoriesList={subcategoriesList}
          registeredCat={registeredCat}
          registeredSubcats={registeredSubcats}
          vendorCoords={vendorCoords}
        />
      )}

      {/* Service Form Modal */}
      {showServiceModal && (
        <ServiceFormModal
          isOpen={showServiceModal}
          onClose={() => { setShowServiceModal(false); setEditListingData(null); }}
          onSubmit={handleServiceSubmit}
          editData={editListingData}
          categoriesList={categoriesList}
          subcategoriesList={subcategoriesList}
          registeredCat={registeredCat}
          registeredSubcats={registeredSubcats}
          vendorCoords={vendorCoords}
        />
      )}

      {/* Offer Form Modal */}
      {showOfferModal && (
        <OfferFormModal
          isOpen={showOfferModal}
          onClose={() => { setShowOfferModal(false); setEditOfferData(null); }}
          onSubmit={handleOfferSubmit}
          editData={editOfferData}
          allListings={allListings}
        />
      )}

      {/* Listing Detail Drawer */}
      {showDetailDrawer && (
        <ListingDetailDrawer
          listing={selectedListingDetails}
          isOpen={showDetailDrawer}
          onClose={() => { setShowDetailDrawer(false); setSelectedListingDetails(null); }}
          onEdit={handleEditRow}
          onDuplicate={handleDuplicateRow}
          onToggleVisibility={handleToggleRowVisibility}
          onDelete={handleDeleteRow}
          onUpdateStock={handleStockUpdate}
        />
      )}

      {/* Reusable Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmAction.onConfirm}
          title={confirmAction.title}
          message={confirmAction.message}
          loading={confirmAction.loading}
          confirmText="Yes, Proceed"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Subscription Modal */}
      {showSubscription && (
        <SubscriptionModal
          isOpen={showSubscription}
          onClose={() => setShowSubscription(false)}
        />
      )}
    </div>
  );
}
