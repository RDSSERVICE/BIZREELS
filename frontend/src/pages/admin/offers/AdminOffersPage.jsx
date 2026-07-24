import React, { useState, useEffect } from 'react';
import { 
  FiGift, FiPlus, FiTag, FiUsers, FiDollarSign, FiClock, 
  FiTrash2, FiEdit2, FiCopy, FiEye, FiCheckCircle, FiXCircle, 
  FiInfo, FiSearch, FiCalendar, FiFilter, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import { getSocket } from '../../../lib/socket';
import {
  useListOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useActivateOfferMutation,
  useDeactivateOfferMutation,
  useDuplicateOfferMutation,
  useGetOfferAnalyticsQuery,
  useListCategoriesQuery
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'offers', label: 'Offers & Campaigns', icon: FiGift },
];

export default function AdminOffersPage() {
  const [activeTab, setActiveTab] = useState('offers');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    code: '',
    targetRoles: [], // array: vendor, creator, customer
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountLimit: '',
    usageLimit: '',
    perUserLimit: 1,
    startTime: '',
    endTime: '',
    timezone: 'Asia/Kolkata',
    priority: 0,
    terms: '',
    image: '',
    applicableCategories: [],
    status: 'Draft'
  };

  const [form, setForm] = useState(initialFormState);

  // Queries & Mutations
  const { data: offersData, isFetching: isFetchingOffers, refetch } = useListOffersQuery({
    q: search,
    status: statusFilter,
    role: roleFilter,
    from: dateFrom,
    to: dateTo,
    page: currentPage,
    limit: 10
  });

  const { data: categoriesData } = useListCategoriesQuery();
  const { data: analyticsData, isFetching: isFetchingAnalytics } = useGetOfferAnalyticsQuery(selectedOfferId, {
    skip: !selectedOfferId || !showAnalyticsModal
  });

  const [createOffer] = useCreateOfferMutation();
  const [updateOffer] = useUpdateOfferMutation();
  const [deleteOffer] = useDeleteOfferMutation();
  const [activateOffer] = useActivateOfferMutation();
  const [deactivateOffer] = useDeactivateOfferMutation();
  const [duplicateOffer] = useDuplicateOfferMutation();

  const offers = offersData?.items || [];
  const categoriesList = categoriesData?.items || [];
  const pagination = offersData?.pagination || { page: 1, totalPages: 1 };

  // Real-Time Sync via Websockets
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      refetch();
    };

    socket.on('offer:created', handleRealtimeUpdate);
    socket.on('offer:updated', handleRealtimeUpdate);
    socket.on('offer:deleted', handleRealtimeUpdate);
    socket.on('offer:activated', handleRealtimeUpdate);
    socket.on('offer:expired', handleRealtimeUpdate);

    return () => {
      socket.off('offer:created', handleRealtimeUpdate);
      socket.off('offer:updated', handleRealtimeUpdate);
      socket.off('offer:deleted', handleRealtimeUpdate);
      socket.off('offer:activated', handleRealtimeUpdate);
      socket.off('offer:expired', handleRealtimeUpdate);
    };
  }, [refetch]);

  // Handle live duration display
  const [liveDuration, setLiveDuration] = useState('0m');
  useEffect(() => {
    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime);
      const end = new Date(form.endTime);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        const diffMins = Math.floor(diffMs / 60000);
        const days = Math.floor(diffMins / 1440);
        const hours = Math.floor((diffMins % 1440) / 60);
        const mins = diffMins % 60;
        let str = '';
        if (days > 0) str += `${days}d `;
        if (hours > 0) str += `${hours}h `;
        if (mins > 0 || str === '') str += `${mins}m`;
        setLiveDuration(str.trim());
      } else {
        setLiveDuration('Invalid end time');
      }
    } else {
      setLiveDuration('0m');
    }
  }, [form.startTime, form.endTime]);

  const resetForm = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setSelectedOfferId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleOpenEditModal = (offer) => {
    setIsEditing(true);
    setSelectedOfferId(offer.id);
    setForm({
      title: offer.title || '',
      description: offer.description || '',
      code: offer.code || '',
      targetRoles: offer.targetRoles || [],
      discountType: offer.discountType || 'percentage',
      discountValue: offer.discountValue || 0,
      minOrderAmount: offer.minOrderAmount || 0,
      maxDiscountLimit: offer.maxDiscountLimit || '',
      usageLimit: offer.usageLimit || '',
      perUserLimit: offer.perUserLimit || 1,
      startTime: offer.startTime ? new Date(offer.startTime).toISOString().slice(0, 16) : '',
      endTime: offer.endTime ? new Date(offer.endTime).toISOString().slice(0, 16) : '',
      timezone: offer.timezone || 'Asia/Kolkata',
      priority: offer.priority || 0,
      terms: offer.terms || '',
      image: offer.image || '',
      applicableCategories: offer.applicableCategories || [],
      status: offer.status || 'Draft'
    });
    setShowFormModal(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.discountValue || !form.startTime || !form.endTime) {
      return toast.error('Please fill in all required fields');
    }
    if (form.targetRoles.length === 0) {
      return toast.error('Please select at least one Target Audience role');
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error('End date/time must be after the start date/time');
    }

    try {
      const payload = {
        ...form,
        maxDiscountLimit: form.maxDiscountLimit === '' ? null : Number(form.maxDiscountLimit),
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        perUserLimit: Number(form.perUserLimit),
        priority: Number(form.priority)
      };

      if (isEditing) {
        await updateOffer({ id: selectedOfferId, ...payload }).unwrap();
        toast.success('Offer updated successfully!');
      } else {
        await createOffer(payload).unwrap();
        toast.success('Offer campaign created successfully!');
      }
      setShowFormModal(false);
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save offer campaign');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer campaign? This action is irreversible.')) return;
    try {
      await deleteOffer(id).unwrap();
      toast.success('Offer deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  const handleDuplicateOffer = async (id) => {
    try {
      await duplicateOffer(id).unwrap();
      toast.success('Offer duplicated as Draft.');
    } catch (err) {
      toast.error('Failed to duplicate offer');
    }
  };

  const handleToggleStatus = async (offer) => {
    try {
      if (offer.status === 'Active') {
        await deactivateOffer(offer.id).unwrap();
        toast.success('Offer campaign disabled.');
      } else {
        await activateOffer(offer.id).unwrap();
        toast.success('Offer campaign activated successfully!');
      }
    } catch (err) {
      toast.error('Failed to change offer status');
    }
  };

  const handleOpenAnalytics = (offerId) => {
    setSelectedOfferId(offerId);
    setShowAnalyticsModal(true);
  };

  const handleCheckboxChange = (role) => {
    setForm(prev => {
      const targetRoles = prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role];
      return { ...prev, targetRoles };
    });
  };

  const handleCategoryCheckboxChange = (catName) => {
    setForm(prev => {
      const applicableCategories = prev.applicableCategories.includes(catName)
        ? prev.applicableCategories.filter(c => c !== catName)
        : [...prev.applicableCategories, catName];
      return { ...prev, applicableCategories };
    });
  };

  const getStatusBadgeType = (status) => {
    switch (status) {
      case 'Active': return 'Active';
      case 'Scheduled': return 'Pending';
      case 'Draft': return 'Secondary';
      case 'Disabled': return 'Rejected';
      case 'Expired': return 'Expired';
      default: return 'Secondary';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiGift}
        title="Real-Time Offers & Coupons"
        subtitle="Create, manage, and schedule promotional offers, target specific audiences, and track conversion analytics in real time."
      >
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Create Offer Campaign
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* FILTER PANEL */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center justify-between shadow-card bg-surface/50 backdrop-blur-md">
        <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Search by title or coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-purple appearance-none cursor-pointer"
            >
              <option value="all">Target Roles (All)</option>
              <option value="vendor">Vendor Offers</option>
              <option value="creator">Creator Offers</option>
              <option value="customer">Customer Offers</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-purple appearance-none cursor-pointer"
            >
              <option value="all">Status (All)</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Disabled">Disabled</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <FiCalendar className="text-text-tertiary" size={14} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 bg-surface-secondary border border-border rounded-lg text-[11px] font-semibold focus:outline-none"
            title="Start date filter"
          />
          <span className="text-text-tertiary text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 bg-surface-secondary border border-border rounded-lg text-[11px] font-semibold focus:outline-none"
            title="End date filter"
          />
          {(dateFrom || dateTo || search || statusFilter !== 'all' || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setRoleFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="p-2 text-xs font-semibold text-brand-pink hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* OFFERS LISTING TABLE */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary/70 border-b border-border text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">
                <th className="p-4 pl-6">Campaign Info</th>
                <th className="p-4">Audience</th>
                <th className="p-4">Coupon/Promo</th>
                <th className="p-4">Discount details</th>
                <th className="p-4">Duration & Times</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {isFetchingOffers ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-text-tertiary">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold">Syncing offers database...</span>
                    </div>
                  </td>
                </tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-text-tertiary font-bold">
                    No active or scheduled offer campaigns found matching filters.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="p-4 pl-6 max-w-[200px]">
                      <div className="font-bold text-text-primary truncate" title={offer.title}>
                        {offer.title}
                      </div>
                      <div className="text-[10px] text-text-tertiary line-clamp-1 mt-0.5">
                        {offer.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {offer.targetRoles.map(role => (
                          <span 
                            key={role}
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border capitalize ${
                              role === 'vendor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              role === 'creator' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {offer.code ? (
                        <span className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded border border-brand-purple/20">
                          {offer.code}
                        </span>
                      ) : (
                        <span className="text-text-tertiary italic text-[10px]">No code required</span>
                      )}
                    </td>
                    <td className="p-4 font-bold">
                      {offer.discountType === 'percentage' ? (
                        <span className="text-emerald-500">{offer.discountValue}% OFF</span>
                      ) : (
                        <span className="text-emerald-500">₹{offer.discountValue} OFF</span>
                      )}
                      <div className="text-[10px] text-text-tertiary font-semibold mt-0.5">
                        Min. Order: ₹{offer.minOrderAmount}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-text-primary">
                        <FiClock className="text-brand-purple" />
                        <span>{offer.duration || 'N/A'}</span>
                      </div>
                      <div className="text-[9px] text-text-tertiary mt-0.5">
                        Until {new Date(offer.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <AdminStatusBadge status={getStatusBadgeType(offer.status)} label={offer.status} />
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          className={`p-1.5 rounded-lg border transition ${
                            offer.status === 'Active'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                          title={offer.status === 'Active' ? 'Deactivate Offer' : 'Activate Offer'}
                        >
                          {offer.status === 'Active' ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                        </button>

                        {/* View Analytics */}
                        <button
                          onClick={() => handleOpenAnalytics(offer.id)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition"
                          title="View Campaigns Analytics"
                        >
                          <FiEye size={14} />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateOffer(offer.id)}
                          className="p-1.5 rounded-lg bg-surface-tertiary text-text-secondary border border-border hover:bg-surface transition"
                          title="Duplicate Offer"
                        >
                          <FiCopy size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-1.5 rounded-lg bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20 transition"
                          title="Edit Campaign"
                        >
                          <FiEdit2 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 rounded-lg bg-brand-pink/10 text-brand-pink border border-brand-pink/20 hover:bg-brand-pink/20 transition"
                          title="Delete Campaign"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-tertiary">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-surface border border-border rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 bg-surface border border-border rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      <AdminModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditing ? 'Edit Offer Campaign' : 'Create Offer Campaign'}
      >
        <form onSubmit={handleSaveOffer} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Offer Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Campaign Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Festival Season Bonanza"
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Promo/Coupon Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. FESTIVAL500"
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Campaign Description *</label>
            <textarea
              required
              rows={2}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the discount details, eligible users, and core terms..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-semibold"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Target Audience Roles *</label>
            <div className="flex gap-4 pt-1">
              {['vendor', 'creator', 'customer'].map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary capitalize">
                  <input
                    type="checkbox"
                    checked={form.targetRoles.includes(role)}
                    onChange={() => handleCheckboxChange(role)}
                    className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple border-border cursor-pointer bg-surface-secondary"
                  />
                  <span>{role}s</span>
                </label>
              ))}
            </div>
          </div>

          {/* Discount Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-secondary/40 p-3 rounded-2xl border border-white/5">
            <div>
              <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value }))}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">Value *</label>
              <input
                type="number"
                required
                value={form.discountValue}
                onChange={(e) => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">Min. Order Amount (₹)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-tertiary uppercase block mb-1">Max Discount (₹)</label>
              <input
                type="number"
                disabled={form.discountType === 'fixed'}
                value={form.maxDiscountLimit}
                onChange={(e) => setForm(prev => ({ ...prev, maxDiscountLimit: e.target.value }))}
                placeholder={form.discountType === 'fixed' ? 'N/A' : 'Unlimited'}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-bold disabled:opacity-55"
              />
            </div>
          </div>

          {/* Usage & Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Overall Usage Limit (Total)</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Limit Per User</label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => setForm(prev => ({ ...prev, perUserLimit: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
          </div>

          {/* Dates & Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-brand-purple/5 p-3 rounded-2xl border border-brand-purple/10">
            <div>
              <label className="text-[9px] font-bold text-brand-purple uppercase block mb-1">Start Date & Exact Time *</label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-semibold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-brand-purple uppercase block mb-1">End Date & Exact Time *</label>
              <input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-[11px] focus:outline-none focus:border-brand-purple font-semibold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-brand-purple uppercase block mb-1">Campaign Duration (Auto)</label>
              <div className="w-full px-2.5 py-2 bg-surface border border-border rounded-lg text-[11px] font-bold text-text-primary flex items-center gap-1">
                <FiClock className="text-brand-purple" />
                <span>{liveDuration}</span>
              </div>
            </div>
          </div>

          {/* Timezone, Priority & Banner Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Campaign Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-bold"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Priority Weight (Sort)</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-bold"
              >
                <option value="Draft">Draft (Hold)</option>
                <option value="Scheduled">Scheduled (Auto-Active)</option>
                <option value="Active">Active (Launch Immediately)</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Banner / Image URL (Campaign Artwork)</label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://example.com/banners/summer_offer.jpg"
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-semibold"
            />
          </div>

          {/* Applicable Categories */}
          {categoriesList.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Applicable Business Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border p-3 rounded-2xl bg-surface-secondary/40 max-h-32 overflow-y-auto">
                {categoriesList.map(cat => (
                  <label key={cat._id} className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.applicableCategories.includes(cat.name)}
                      onChange={() => handleCategoryCheckboxChange(cat.name)}
                      className="w-3.5 h-3.5 border-border rounded bg-surface"
                    />
                    <span className="truncate">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Terms & Conditions</label>
            <textarea
              rows={2}
              value={form.terms}
              onChange={(e) => setForm(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="e.g. Valid on first purchase only. Maximum discount ₹500. Cannot be combined with other offers."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple font-semibold"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 bg-surface-tertiary text-text-secondary rounded-xl text-xs font-bold border border-border hover:bg-surface-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition"
            >
              {isEditing ? 'Save Changes' : 'Launch Campaign'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ANALYTICS DETAILS MODAL */}
      <AdminModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        title="Offer Campaign Analytics & Engagement"
      >
        {isFetchingAnalytics ? (
          <div className="p-8 text-center text-text-tertiary">
            <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-bold">Retrieving campaign tracking logs...</span>
          </div>
        ) : !analyticsData?.analytics ? (
          <div className="p-8 text-center text-text-tertiary font-bold text-xs">
            Failed to load analytics details for this offer campaign.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grid of stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface-secondary border border-border p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold text-text-tertiary block">RECIPIENTS</span>
                <span className="text-lg font-bold text-text-primary">{analyticsData.analytics.recipientCount || 0}</span>
                <span className="text-[9px] text-text-tertiary block">Notified Users</span>
              </div>
              <div className="bg-surface-secondary border border-border p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold text-text-tertiary block">VIEWS</span>
                <span className="text-lg font-bold text-blue-500">{analyticsData.analytics.viewsCount || 0}</span>
                <span className="text-[9px] text-text-tertiary block">Total Impressions</span>
              </div>
              <div className="bg-surface-secondary border border-border p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold text-text-tertiary block">CLICKS</span>
                <span className="text-lg font-bold text-brand-purple">{analyticsData.analytics.clicksCount || 0}</span>
                <span className="text-[9px] text-text-tertiary block">CTA Conversions</span>
              </div>
              <div className="bg-surface-secondary border border-border p-3 rounded-2xl text-center">
                <span className="text-[9px] font-bold text-text-tertiary block">REDEMPTIONS</span>
                <span className="text-lg font-bold text-emerald-500">{analyticsData.analytics.usedCount || 0}</span>
                <span className="text-[9px] text-text-tertiary block">Times Applied</span>
              </div>
            </div>

            {/* Notification logs */}
            <div className="bg-brand-purple/5 border border-brand-purple/10 p-3 rounded-2xl text-xs space-y-1">
              <h4 className="font-bold text-brand-purple flex items-center gap-1.5">
                <FiInfo /> Broadcast Alert Status
              </h4>
              <div className="grid grid-cols-2 text-[10px] text-text-secondary pt-1 gap-y-1">
                <span>Notification Sent:</span>
                <strong className="text-text-primary">{analyticsData.analytics.notification?.sent ? '✅ Yes' : '❌ Pending'}</strong>
                
                {analyticsData.analytics.notification?.sent && (
                  <>
                    <span>Sent At Timestamp:</span>
                    <strong className="text-text-primary">
                      {new Date(analyticsData.analytics.notification.sentAt).toLocaleString()}
                    </strong>
                    <span>Delivery Success Rate:</span>
                    <strong className="text-text-primary">{analyticsData.analytics.notification.deliveryRate}%</strong>
                  </>
                )}
              </div>
            </div>

            {/* Redemption List Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-primary">Campaign Redemption History</h4>
              <div className="border border-border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-surface-secondary border-b border-border text-[9px] font-extrabold uppercase text-text-tertiary">
                      <th className="p-2 pl-3">User</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Applied At</th>
                      <th className="p-2 text-right pr-3">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analyticsData.analytics.redemptions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-text-tertiary italic">
                          No customer redemptions recorded yet for this offer.
                        </td>
                      </tr>
                    ) : (
                      analyticsData.analytics.redemptions.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 pl-3 font-bold text-text-primary">{r.userId?.name || 'Customer'}</td>
                          <td className="p-2 text-text-secondary">{r.userId?.phone || 'N/A'}</td>
                          <td className="p-2 text-text-tertiary">
                            {new Date(r.redeemedAt).toLocaleDateString()} {new Date(r.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-2 text-right pr-3 text-emerald-500 font-bold">₹{r.discountAmount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAnalyticsModal(false)}
              className="w-full py-2 bg-surface-tertiary text-text-secondary font-bold rounded-xl border border-border hover:bg-surface-secondary transition text-xs mt-2"
            >
              Close Panel
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
