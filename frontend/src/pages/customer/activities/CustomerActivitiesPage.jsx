import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiBookmark, FiPackage, FiMessageSquare, FiDollarSign, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

import {
  useGetOrdersQuery,
  useGetInquiriesQuery,
  useGetQuotesQuery,
  useGetFollowingQuery,
  useGetSavedListingsQuery,
  useUnsaveListingMutation,
  useDeleteInquiryMutation,
  useCloseInquiryMutation,
  useUpdateQuoteStatusMutation,
  useUnfollowUserMutation,
} from '../../../features/customer/activitiesApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import api from '../../../lib/api';

// Subcomponents
import ActivitiesHeader from './components/ActivitiesHeader';
import ActivitiesTabBar from './components/ActivitiesTabBar';
import ActivitiesFilterBar from './components/ActivitiesFilterBar';
import SavedProductsTab from './components/SavedProductsTab';
import SavedServicesTab from './components/SavedServicesTab';
import SavedReelsTab from './components/SavedReelsTab';
import SavedImagesTab from './components/SavedImagesTab';
import ContactHistoryTab from './components/ContactHistoryTab';
import MyOrdersTab from './components/MyOrdersTab';
import InquiriesTab from './components/InquiriesTab';
import QuotesTab from './components/QuotesTab';
import FollowingVendorsTab from './components/FollowingVendorsTab';
import BookServiceModal from './components/BookServiceModal';
import CancelOrderModal from './components/CancelOrderModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import ReviewModal from './components/ReviewModal';
import ConfirmActionModal from './components/ConfirmActionModal';

export default function CustomerActivitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'saved-products';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
    setPage(1);
    setSearch('');
    setCategory('');
    setStatus('');
    setMinPrice('');
    setMaxPrice('');
  };

  // Activity counts
  const [counts, setCounts] = useState({
    savedProducts: 0,
    savedServices: 0,
    savedReels: 0,
    savedImages: 0,
    clickToCalled: 0,
    whatsappContacted: 0,
    chatInquiries: 0,
    total: 0,
  });

  const [customActivities, setCustomActivities] = useState({
    data: [],
    pagination: { page: 1, limit: 6, total: 0 },
  });
  const [customLoading, setCustomLoading] = useState(false);

  const fetchCounts = async () => {
    try {
      const res = await api.get('/v1/users/me/activity-counts');
      if (res.data) setCounts(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchCounts();
  }, [activeTab]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewListingId, setReviewListingId] = useState('');
  const [reviewVendorId, setReviewVendorId] = useState('');

  const [selectedService, setSelectedService] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Cancellation & Refund Modal state
  const [cancelOrderModal, setCancelOrderModal] = useState({
    show: false,
    order: null,
    reason: '',
    submitting: false,
  });

  // Destructive confirmations
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const isCustomTab = [
    'saved-products',
    'saved-services',
    'saved-reels',
    'saved-images',
    'click-to-called',
    'whatsapp-contacted',
    'chat-inquiries',
  ].includes(activeTab);

  useEffect(() => {
    if (!isCustomTab) return;
    const fetchActivities = async () => {
      setCustomLoading(true);
      try {
        const params = new URLSearchParams({
          type: activeTab,
          page: page.toString(),
          limit: '6',
        });
        if (search) params.append('search', search);
        if (sortBy) params.append('sortBy', sortBy);

        const res = await api.get(`/v1/users/me/activities?${params.toString()}`);
        if (res.data) {
          setCustomActivities({
            data: res.data.data || [],
            pagination: res.data.pagination || { page: 1, limit: 6, total: res.data.data?.length || 0 },
          });
        }
      } catch (err) {
        console.error('Failed to fetch user activities:', err);
      } finally {
        setCustomLoading(false);
      }
    };
    fetchActivities();
  }, [activeTab, page, search, sortBy]);

  // RTK Query hooks
  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
    sortBy,
    page,
    limit: 6,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  };

  const { data: savedData, isLoading: savedLoading, refetch: refetchSaved } = useGetSavedListingsQuery(
    queryParams,
    { skip: activeTab !== 'saved-products' && activeTab !== 'saved-services' && activeTab !== 'saved-images' }
  );

  const { data: inquiriesData, isLoading: inquiriesLoading, refetch: refetchInquiries } = useGetInquiriesQuery(
    queryParams,
    { skip: activeTab !== 'inquiries' }
  );

  const { data: quotesData, isLoading: quotesLoading, refetch: refetchQuotes } = useGetQuotesQuery(
    queryParams,
    { skip: activeTab !== 'quotes' }
  );

  const { data: vendorsData, isLoading: vendorsLoading, refetch: refetchVendors } = useGetFollowingQuery(
    queryParams,
    { skip: activeTab !== 'following-vendors' }
  );

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useGetOrdersQuery(
    queryParams,
    { skip: activeTab !== 'my-orders' }
  );

  const { data: categoriesData } = useListCategoriesQuery();

  // Mutations
  const [unsaveListing] = useUnsaveListingMutation();
  const [deleteInquiry] = useDeleteInquiryMutation();
  const [closeInquiry] = useCloseInquiryMutation();
  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Actions
  const handleRemoveSaved = async (id) => {
    try {
      if (isCustomTab) {
        await api.delete(`/v1/users/me/activities/item/${id}`);
        setCustomActivities((prev) => ({
          ...prev,
          data: prev.data.filter((item) => item.id !== id && item._id !== id),
        }));
        fetchCounts();
        toast.success('Removed from saved activities');
      } else {
        await unsaveListing(id).unwrap();
        toast.success('Listing removed from saved items');
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleRemoveSavedReel = async (id) => {
    try {
      await api.delete(`/v1/users/me/activities/item/${id}`);
      setCustomActivities((prev) => ({
        ...prev,
        data: prev.data.filter((item) => item.id !== id && item._id !== id),
      }));
      fetchCounts();
      toast.success('Reel removed from saved activities');
    } catch {
      toast.error('Failed to remove reel');
    }
  };

  const handleRemoveSavedImage = async (id) => {
    try {
      await api.delete(`/v1/users/me/activities/item/${id}`);
      setCustomActivities((prev) => ({
        ...prev,
        data: prev.data.filter((item) => item.id !== id && item._id !== id),
      }));
      fetchCounts();
      toast.success('Image removed from saved activities');
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const handleDeleteInquiry = (id) => {
    setConfirmModal({
      show: true,
      title: 'Delete Inquiry Record',
      message: 'Are you sure you want to permanently delete this inquiry record from your history?',
      onConfirm: async () => {
        try {
          await deleteInquiry(id).unwrap();
          toast.success('Inquiry record deleted');
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        } catch {
          toast.error('Failed to delete inquiry');
        }
      },
    });
  };

  const handleCloseInquiry = async (id) => {
    try {
      await closeInquiry(id).unwrap();
      toast.success('Inquiry marked as closed');
    } catch {
      toast.error('Failed to update inquiry');
    }
  };

  const handleUpdateQuote = async (id, newStatus, vendorName) => {
    try {
      await updateQuoteStatus({ quoteId: id, status: newStatus }).unwrap();
      toast.success(`Proposal from ${vendorName} was ${newStatus.toUpperCase()}`);
    } catch {
      toast.error('Failed to update quotation proposal');
    }
  };

  const handleUnfollow = (id, name) => {
    setConfirmModal({
      show: true,
      title: `Unfollow ${name}`,
      message: `Are you sure you want to stop following ${name}? You will no longer receive immediate notifications about their new listings.`,
      onConfirm: async () => {
        try {
          await unfollowUser(id).unwrap();
          toast.success(`Unfollowed ${name}`);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        } catch {
          toast.error('Failed to unfollow vendor');
        }
      },
    });
  };

  const handleShare = (type, id, title) => {
    const url = `${window.location.origin}/customer/search?${type}=${id}`;
    if (navigator.share) {
      navigator.share({ title: `Check out ${title} on BizReels!`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddToCart = (id) => {
    toast.success('Direct purchase initiated! Redirecting to checkout...');
    navigate(`/customer/search?buyNow=${id}`);
  };

  const handleOpenReview = (listingId, vendorId) => {
    setReviewListingId(listingId);
    setReviewVendorId(vendorId);
    setReviewRating(5);
    setReviewComment('');
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error('Please write a brief comment.');
      return;
    }
    const toastId = toast.loading('Submitting review...');
    try {
      await api.post('/v1/reviews', {
        listingId: reviewListingId,
        vendorId: reviewVendorId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted successfully! Thank you.', { id: toastId });
      setIsReviewOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.', { id: toastId });
    }
  };

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setBookingDate('');
    setBookingTime('10:00 AM');
    setBookingAddress('');
    setBookingNotes('');
    setIsBookingOpen(true);
  };

  const handleBookServiceSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || !bookingAddress) {
      toast.error('Please fill in Date, Time, and Address.');
      return;
    }
    const toastId = toast.loading('Submitting booking...');
    try {
      await api.post('/v1/orders', {
        listingId: selectedService.id || selectedService._id,
        quantity: 1,
        bookingDate,
        bookingTime,
        address: `[Scheduled: ${bookingDate} at ${bookingTime}] Delivery Location: ${bookingAddress}. Remarks: ${bookingNotes || 'None'}`,
      });
      toast.success('Booking requested successfully! Tracking request.', { id: toastId });
      setIsBookingOpen(false);
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking request failed.', { id: toastId });
    }
  };

  const handleOpenCancelModal = (order) => {
    setCancelOrderModal({
      show: true,
      order,
      reason: '',
      submitting: false,
    });
  };

  const handleCancelOrderSubmit = async (e) => {
    if (e) e.preventDefault();
    const order = cancelOrderModal.order;
    if (!order) return;

    setCancelOrderModal((prev) => ({ ...prev, submitting: true }));
    const toastId = toast.loading('Processing cancellation and calculating refund...');
    try {
      const res = await api.patch(`/v1/orders/${order._id || order.id}/cancel`, {
        reason: cancelOrderModal.reason || 'Cancelled by customer',
      });
      const data = res.data?.data || res.data || {};
      toast.success(
        data.policyExplanation || `Order cancelled. ₹${data.refundAmount ?? order.price} refunded to wallet!`,
        { id: toastId }
      );
      setCancelOrderModal({ show: false, order: null, reason: '', submitting: false });
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.', { id: toastId });
      setCancelOrderModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handlePrintInvoice = (order) => {
    toast.success(`Generating Receipt for ${order._id || order.id}...`);
    window.print();
  };

  const handleReorder = async (listingId, quantity, address) => {
    const toastId = toast.loading('Reordering item...');
    try {
      await api.post('/v1/orders', {
        listingId,
        quantity: quantity || 1,
        address: address || 'Default Customer Profile Delivery Address',
      });
      toast.success('Order placed again successfully!', { id: toastId });
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reorder item.', { id: toastId });
    }
  };

  const handleClearCustomLogs = () => {
    setConfirmModal({
      show: true,
      title: `Clear ${activeTab.replace('-', ' ')} Logs`,
      message: 'Are you sure you want to clear this entire activity log? This cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/v1/users/me/activities/clear?type=${activeTab}`);
          setCustomActivities({ data: [], pagination: { page: 1, limit: 6, total: 0 } });
          fetchCounts();
          toast.success('Activities log cleared');
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
        } catch {
          toast.error('Failed to clear activities');
        }
      },
    });
  };

  const openTracker = (order) => {
    setSelectedOrder(order);
    setIsTrackerOpen(true);
  };

  // Helper data & loading mappings
  const getData = () => {
    if (isCustomTab) return customActivities.data || [];
    switch (activeTab) {
      case 'inquiries': return inquiriesData?.data || [];
      case 'quotes': return quotesData?.data || [];
      case 'following-vendors': return vendorsData?.data || [];
      case 'my-orders': return ordersData?.data || [];
      default: return savedData?.data || [];
    }
  };

  const getLoading = () => {
    if (isCustomTab) return customLoading;
    switch (activeTab) {
      case 'inquiries': return inquiriesLoading;
      case 'quotes': return quotesLoading;
      case 'following-vendors': return vendorsLoading;
      case 'my-orders': return ordersLoading;
      default: return savedLoading;
    }
  };

  const getTotalPages = () => {
    if (isCustomTab) {
      const total = customActivities.pagination?.total || 0;
      return Math.ceil(total / (customActivities.pagination?.limit || 6)) || 1;
    }
    let total = 0;
    switch (activeTab) {
      case 'inquiries': total = inquiriesData?.total || 0; break;
      case 'quotes': total = quotesData?.total || 0; break;
      case 'following-vendors': total = vendorsData?.total || 0; break;
      case 'my-orders': total = ordersData?.total || 0; break;
      default: total = savedData?.total || 0; break;
    }
    return Math.ceil(total / 6) || 1;
  };

  const data = getData();
  const loading = getLoading();
  const totalPages = getTotalPages();
  const categoriesList = categoriesData?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* HEADER */}
      <ActivitiesHeader />

      {/* DYNAMIC TAB BAR */}
      <ActivitiesTabBar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

      {/* SEARCH AND FILTERS */}
      <ActivitiesFilterBar
        activeTab={activeTab}
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        setPage={setPage}
        categoriesList={categoriesList}
        dataCount={data.length}
        onClearAll={handleClearCustomLogs}
      />

      {/* CARDS DISPLAY CONTAINER */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card min-h-[400px] flex flex-col justify-between">
        {loading ? (
          /* SKELETON LOADING GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/30 h-64 flex flex-col justify-between">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex-shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    <div className="h-3 bg-white/20 rounded w-5/6"></div>
                  </div>
                </div>
                <div className="h-10 bg-white/20 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          /* EMPTY STATES */
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-brand-purple/5 flex items-center justify-center text-brand-purple border border-brand-purple/20">
              {activeTab.startsWith('saved') ? (
                <FiBookmark size={40} />
              ) : activeTab === 'my-orders' ? (
                <FiPackage size={40} />
              ) : activeTab === 'inquiries' ? (
                <FiMessageSquare size={40} />
              ) : activeTab === 'quotes' ? (
                <FiDollarSign size={40} />
              ) : (
                <FiUserCheck size={40} />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-primary">No Activities Found</h3>
              <p className="text-xs text-text-tertiary max-w-sm">
                We couldn't find any listings or records matching your dashboard filters. Browse feed or update filters!
              </p>
            </div>
            <button
              onClick={() => navigate('/customer/search')}
              className="px-4 py-2 gradient-brand text-white text-xs font-bold rounded-xl shadow-premium hover:opacity-95 transition"
            >
              Explore Feed & Listings
            </button>
          </div>
        ) : (
          /* ACTIVE TABS CONTENT */
          <div>
            {activeTab === 'saved-products' && (
              <SavedProductsTab
                products={data}
                onAddToCart={handleAddToCart}
                onRemove={handleRemoveSaved}
                onShare={handleShare}
              />
            )}

            {activeTab === 'saved-services' && (
              <SavedServicesTab
                services={data}
                onOpenBooking={handleOpenBooking}
                onRemove={handleRemoveSaved}
                onShare={handleShare}
              />
            )}

            {activeTab === 'saved-reels' && (
              <SavedReelsTab reels={data} onRemove={handleRemoveSavedReel} />
            )}

            {activeTab === 'saved-images' && (
              <SavedImagesTab images={data} onRemove={handleRemoveSavedImage} />
            )}

            {['click-to-called', 'whatsapp-contacted', 'chat-inquiries'].includes(activeTab) && (
              <ContactHistoryTab activeTab={activeTab} items={data} />
            )}

            {activeTab === 'my-orders' && (
              <MyOrdersTab
                orders={data}
                onOpenTracker={openTracker}
                onOpenCancelModal={handleOpenCancelModal}
                onOpenReview={handleOpenReview}
                onPrintInvoice={handlePrintInvoice}
                onReorder={handleReorder}
              />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesTab
                inquiries={data}
                onCloseInquiry={handleCloseInquiry}
                onDeleteInquiry={handleDeleteInquiry}
              />
            )}

            {activeTab === 'quotes' && (
              <QuotesTab quotes={data} onUpdateQuote={handleUpdateQuote} />
            )}

            {(activeTab === 'following-vendors' || activeTab === 'following-services') && (
              <FollowingVendorsTab
                vendors={data}
                onUnfollow={handleUnfollow}
                onShare={handleShare}
              />
            )}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary disabled:opacity-40 hover:bg-surface-secondary transition"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary disabled:opacity-40 hover:bg-surface-secondary transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      <ConfirmActionModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
      />

      {/* ORDER TRACKING TIMELINE MODAL */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        order={selectedOrder}
        onClose={() => setIsTrackerOpen(false)}
      />

      {/* LEAVE REVIEW MODAL */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleReviewSubmit}
        rating={reviewRating}
        setRating={setReviewRating}
        comment={reviewComment}
        setComment={setReviewComment}
      />

      {/* BOOK SERVICE DIALOG */}
      <BookServiceModal
        isOpen={isBookingOpen}
        service={selectedService}
        onClose={() => setIsBookingOpen(false)}
        onSubmit={handleBookServiceSubmit}
        bookingDate={bookingDate}
        setBookingDate={setBookingDate}
        bookingTime={bookingTime}
        setBookingTime={setBookingTime}
        bookingAddress={bookingAddress}
        setBookingAddress={setBookingAddress}
        bookingNotes={bookingNotes}
        setBookingNotes={setBookingNotes}
      />

      {/* INTERACTIVE CANCEL & REFUND CALCULATION MODAL */}
      <CancelOrderModal
        isOpen={cancelOrderModal.show}
        order={cancelOrderModal.order}
        reason={cancelOrderModal.reason}
        setReason={(val) => setCancelOrderModal((prev) => ({ ...prev, reason: val }))}
        submitting={cancelOrderModal.submitting}
        onClose={() => setCancelOrderModal({ show: false, order: null, reason: '', submitting: false })}
        onSubmit={handleCancelOrderSubmit}
      />
    </div>
  );
}