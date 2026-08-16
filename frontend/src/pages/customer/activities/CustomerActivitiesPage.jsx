import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    } catch { }
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

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => { },
  });

  // Queries
  const { data: catData } = useListCategoriesQuery({});
  const categoriesList = catData?.data?.categories || catData?.categories || catData?.data || [];

  const { data: ordersData, refetch: refetchOrders } = useGetOrdersQuery(
    { page, limit: 10, status: status || undefined, search: search || undefined },
    { skip: activeTab !== 'my-orders' }
  );

  const { data: inquiriesData, refetch: refetchInquiries } = useGetInquiriesQuery(
    { page, limit: 10, search: search || undefined },
    { skip: activeTab !== 'chat-inquiries' }
  );

  const { data: quotesData, refetch: refetchQuotes } = useGetQuotesQuery(
    { page, limit: 10, search: search || undefined },
    { skip: activeTab !== 'quotes' }
  );

  const { data: followingData, refetch: refetchFollowing } = useGetFollowingQuery(
    { page, limit: 10, search: search || undefined },
    { skip: activeTab !== 'following-vendors' }
  );

  // Mutations
  const [unsaveListing] = useUnsaveListingMutation();
  const [deleteInquiry] = useDeleteInquiryMutation();
  const [closeInquiry] = useCloseInquiryMutation();
  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Custom activities fetch for dynamic saved tabs
  const fetchCustomActivities = async () => {
    setCustomLoading(true);
    try {
      const res = await api.get('/v1/users/me/activities', {
        params: {
          type: activeTab,
          search: search || undefined,
          category: category || undefined,
          sortBy: sortBy || undefined,
          page,
          limit: 12,
        },
      });
      if (res.data) {
        setCustomActivities({
          data: res.data.data || [],
          pagination: res.data.pagination || { page: 1, limit: 12, total: 0 },
        });
      }
    } catch (err) {
      console.warn('Failed to fetch activities:', err);
    } finally {
      setCustomLoading(false);
    }
  };

  useEffect(() => {
    if (
      [
        'saved-products',
        'saved-services',
        'saved-reels',
        'saved-images',
        'click-to-called',
        'whatsapp-contacted',
      ].includes(activeTab)
    ) {
      fetchCustomActivities();
    }
  }, [activeTab, page, search, category, sortBy]);

  // Handlers
  const handleRemoveSaved = async (id) => {
    try {
      await api.post(`/v1/listings/${id}/unsave`);
      toast.success('Removed from saved items');
      fetchCustomActivities();
      fetchCounts();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleShare = async (type, id, title) => {
    const url = `${window.location.origin}/customer/search?productId=${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'BizReels', url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('🔗 Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenCancelModal = (order) => {
    setSelectedOrder(order);
    setCancellationReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    setCancelLoading(true);
    try {
      await api.patch(`/v1/orders/${selectedOrder._id || selectedOrder.id}/cancel`, {
        reason: cancellationReason,
      });
      toast.success('Order cancelled successfully');
      setIsCancelModalOpen(false);
      if (refetchOrders) refetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleOpenReviewModal = (listingId, vendorId) => {
    setReviewListingId(listingId);
    setReviewVendorId(vendorId);
    setReviewRating(5);
    setReviewComment('');
    setIsReviewOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return toast.error('Please write a review comment');
    try {
      await api.post('/v1/reviews', {
        targetListingId: reviewListingId || undefined,
        targetUserId: reviewVendorId || undefined,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Review submitted successfully!');
      setIsReviewOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleOpenBookModal = (service) => {
    setSelectedService(service);
    setIsBookModalOpen(true);
  };

  const handleUnfollow = async (vendorId) => {
    try {
      await unfollowUser(vendorId).unwrap();
      toast.success('Unfollowed vendor');
      if (refetchFollowing) refetchFollowing();
      fetchCounts();
    } catch (err) {
      toast.error('Failed to unfollow');
    }
  };

  const handleCloseInquiry = async (inqId) => {
    try {
      await closeInquiry(inqId).unwrap();
      toast.success('Inquiry closed');
      if (refetchInquiries) refetchInquiries();
    } catch {
      toast.error('Failed to close inquiry');
    }
  };

  const handleDeleteInquiry = async (inqId) => {
    try {
      await deleteInquiry(inqId).unwrap();
      toast.success('Inquiry deleted');
      if (refetchInquiries) refetchInquiries();
    } catch {
      toast.error('Failed to delete inquiry');
    }
  };

  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await updateQuoteStatus({ id: quoteId, status: newStatus }).unwrap();
      toast.success(`Quote marked as ${newStatus}`);
      if (refetchQuotes) refetchQuotes();
    } catch {
      toast.error('Failed to update quote status');
    }
  };

  // Orders list extracted
  const ordersList = ordersData?.data?.orders || ordersData?.orders || ordersData?.data || [];
  const inquiriesList = inquiriesData?.data?.inquiries || inquiriesData?.inquiries || inquiriesData?.data || [];
  const quotesList = quotesData?.data?.quotes || quotesData?.quotes || quotesData?.data || [];
  const followingList = followingData?.data?.following || followingData?.following || followingData?.data || [];

  return (
    <div className="min-h-screen bg-[#f8f4ec] py-4 px-3 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <ActivitiesHeader totalCount={counts.total} />

        {/* Tab Navigation Chips */}
        <ActivitiesTabBar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

        {/* Search & Filter Bar */}
        <ActivitiesFilterBar
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={categoriesList}
          sortBy={sortBy}
          setSortBy={setSortBy}
          status={status}
          setStatus={setStatus}
          showCategory={['saved-products', 'saved-services', 'saved-images'].includes(activeTab)}
          showStatus={activeTab === 'my-orders'}
          showPriceFilter={['saved-products', 'saved-services'].includes(activeTab)}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />

        {/* ── Active Tab Content Area ── */}
        <div className="mt-4">
          {customLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-[#e3dccb] p-4 space-y-3 animate-pulse">
                  <div className="w-full aspect-[4/3] bg-slate-200 rounded-lg" />
                  <div className="w-2/3 h-4 bg-slate-200 rounded" />
                  <div className="w-1/3 h-3 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'saved-products' && (
                <SavedProductsTab
                  products={customActivities.data}
                  onAddToCart={(id) => navigate(`/customer/search?productId=${id}`)}
                  onRemove={handleRemoveSaved}
                  onShare={handleShare}
                />
              )}

              {activeTab === 'saved-services' && (
                <SavedServicesTab
                  services={customActivities.data}
                  onBookService={handleOpenBookModal}
                  onRemove={handleRemoveSaved}
                  onShare={handleShare}
                />
              )}

              {activeTab === 'saved-reels' && (
                <SavedReelsTab
                  reels={customActivities.data}
                  onRemove={handleRemoveSaved}
                  onShare={handleShare}
                />
              )}

              {activeTab === 'saved-images' && (
                <SavedImagesTab
                  images={customActivities.data}
                  onRemove={handleRemoveSaved}
                  onShare={handleShare}
                />
              )}

              {['click-to-called', 'whatsapp-contacted'].includes(activeTab) && (
                <ContactHistoryTab
                  interactions={customActivities.data}
                  activeTab={activeTab}
                />
              )}

              {activeTab === 'my-orders' && (
                <MyOrdersTab
                  orders={ordersList}
                  onTrackOrder={(order) => {
                    setSelectedOrder(order);
                    setIsTrackerOpen(true);
                  }}
                  onOpenCancelModal={handleOpenCancelModal}
                  onOpenReviewModal={handleOpenReviewModal}
                />
              )}

              {activeTab === 'chat-inquiries' && (
                <InquiriesTab
                  inquiries={inquiriesList}
                  onCloseInquiry={handleCloseInquiry}
                  onDeleteInquiry={handleDeleteInquiry}
                />
              )}

              {activeTab === 'quotes' && (
                <QuotesTab
                  quotes={quotesList}
                  onUpdateQuoteStatus={handleUpdateQuoteStatus}
                />
              )}

              {activeTab === 'following-vendors' && (
                <FollowingVendorsTab
                  following={followingList}
                  onUnfollow={handleUnfollow}
                />
              )}
            </>
          )}
        </div>

        {/* ── Modals ── */}
        <BookServiceModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          service={selectedService}
        />

        <CancelOrderModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          order={selectedOrder}
          reason={cancellationReason}
          setReason={setCancellationReason}
          onConfirm={handleConfirmCancel}
          loading={cancelLoading}
        />

        <OrderTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          order={selectedOrder}
        />

        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          rating={reviewRating}
          setRating={setReviewRating}
          comment={reviewComment}
          setComment={setReviewComment}
          onSubmit={handleSubmitReview}
        />

        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
        />
      </div>
    </div>
  );
}