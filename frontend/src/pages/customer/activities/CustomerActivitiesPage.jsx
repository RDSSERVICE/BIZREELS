import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity, FiBookmark, FiTool, FiPackage, FiMessageSquare,
  FiDollarSign, FiUserCheck, FiSearch, FiCalendar, FiMapPin, FiStar,
  FiChevronRight, FiClock, FiTrash2, FiExternalLink, FiShare2, FiRefreshCw,
  FiShoppingBag, FiInfo, FiTruck, FiAlertCircle, FiXCircle, FiCheckCircle, FiPhone,
  FiVideo, FiImage
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useGetOrdersQuery,
  useCancelOrderMutation,
  useGetInquiriesQuery,
  useCloseInquiryMutation,
  useDeleteInquiryMutation,
  useGetSavedListingsQuery,
  useUnsaveListingMutation,
  useSaveListingMutation,
  useGetQuotesQuery,
  useUpdateQuoteStatusMutation,
  useGetFollowingQuery,
  useUnfollowUserMutation,
} from '../../../features/customer/activitiesApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { resolveMediaUrl, api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';



export default function CustomerActivitiesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('saved-products');

  const { data: categoriesDataRes } = useListCategoriesQuery();
  const categoriesList = categoriesDataRes?.items || [];
  const parentCategories = categoriesList.filter(c => !c.parent_id);

  // Activity Counts
  const [counts, setCounts] = useState({
    savedProducts: 0,
    savedServices: 0,
    savedReels: 0,
    savedImages: 0,
    clickToCalled: 0,
    whatsappContacted: 0,
    chatInquiries: 0,
    total: 0
  });

  const [customActivities, setCustomActivities] = useState({ data: [], pagination: { page: 1, limit: 6, total: 0 } });
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

  const dynamicTabs = [
    { key: 'saved-products', label: 'Saved Products', icon: FiBookmark, count: counts.savedProducts },
    { key: 'saved-services', label: 'Saved Services', icon: FiTool, count: counts.savedServices },
    { key: 'saved-reels', label: 'Saved Reels', icon: FiVideo, count: counts.savedReels },
    { key: 'saved-images', label: 'Saved Images', icon: FiImage, count: counts.savedImages },
    { key: 'click-to-called', label: 'Click to Called', icon: FiPhone, count: counts.clickToCalled },
    { key: 'whatsapp-contacted', label: 'WhatsApp', icon: FaWhatsapp, count: counts.whatsappContacted },
    { key: 'chat-inquiries', label: 'Chat/Inquiry', icon: FiMessageSquare, count: counts.chatInquiries },
    { key: 'my-orders', label: 'My Orders Request', icon: FiPackage },
    { key: 'quotes', label: 'Quotes Received', icon: FiDollarSign },
    { key: 'following-vendors', label: 'Following Vendors', icon: FiUserCheck },
  ];

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

  // Destructive confirmations
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const isCustomTab = [
    'saved-products',
    'saved-services',
    'saved-reels',
    'saved-images',
    'click-to-called',
    'whatsapp-contacted',
    'chat-inquiries'
  ].includes(activeTab);

  useEffect(() => {
    if (!isCustomTab) return;
    const fetchActivities = async () => {
      setCustomLoading(true);
      try {
        const params = new URLSearchParams({
          type: activeTab,
          page: page.toString(),
          limit: '6'
        });
        if (search) params.append('search', search);
        if (sortBy) params.append('sortBy', sortBy);

        const res = await api.get(`/v1/users/me/activities?${params.toString()}`);
        if (res.data) {
          setCustomActivities({
            data: res.data.data || [],
            pagination: res.data.pagination || { page, limit: 6, total: 0 }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCustomLoading(false);
      }
    };
    fetchActivities();
  }, [activeTab, page, search, sortBy, isCustomTab]);

  // RTK Queries
  const skipSaved = true; // Use activities endpoint instead of RTK query for saved-products/saved-services
  const savedData = null;
  const savedLoading = false;
  const refetchSaved = () => {};

  const skipOrders = activeTab !== 'my-orders';
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useGetOrdersQuery({
    search,
    status,
    sortBy,
    page,
    limit: 6
  }, { skip: skipOrders, refetchOnMountOrArgChange: true });

  const skipInquiries = activeTab !== 'inquiries';
  const { data: inquiriesData, isLoading: inquiriesLoading, refetch: refetchInquiries } = useGetInquiriesQuery({
    search,
    status,
    page,
    limit: 6
  }, { skip: skipInquiries, refetchOnMountOrArgChange: true });

  const skipQuotes = activeTab !== 'quotes';
  const { data: quotesData, isLoading: quotesLoading, refetch: refetchQuotes } = useGetQuotesQuery({
    search,
    status,
    sortBy,
    page,
    limit: 6
  }, { skip: skipQuotes, refetchOnMountOrArgChange: true });

  const skipFollowingVendors = activeTab !== 'following-vendors';
  const { data: followingVendorsData, isLoading: followingVendorsLoading, refetch: refetchFollowingVendors } = useGetFollowingQuery({
    search,
    role: 'vendor',
    excludeBusinessType: 'Service Provider',
    sortBy,
    page,
    limit: 6
  }, { skip: skipFollowingVendors, refetchOnMountOrArgChange: true });

  const skipFollowingServices = activeTab !== 'following-services';
  const { data: followingServicesData, isLoading: followingServicesLoading, refetch: refetchFollowingServices } = useGetFollowingQuery({
    search,
    role: 'vendor',
    businessType: 'Service Provider',
    sortBy,
    page,
    limit: 6
  }, { skip: skipFollowingServices, refetchOnMountOrArgChange: true });

  // Mutations
  const [unsaveListing] = useUnsaveListingMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [closeInquiry] = useCloseInquiryMutation();
  const [deleteInquiry] = useDeleteInquiryMutation();
  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Socket.IO Real-time Connection Setup
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRefetch = () => {
      if (!skipOrders) refetchOrders();
      if (!skipInquiries) refetchInquiries();
      if (!skipSaved) refetchSaved();
      if (!skipQuotes) refetchQuotes();
      if (!skipFollowingVendors) refetchFollowingVendors();
      if (!skipFollowingServices) refetchFollowingServices();
    };

    socket.on('order:updated', handleRefetch);
    socket.on('inquiry:updated', handleRefetch);
    socket.on('inquiry:deleted', handleRefetch);
    socket.on('proposal:submitted', handleRefetch);
    socket.on('proposal:accepted', handleRefetch);
    socket.on('proposal:rejected', handleRefetch);
    socket.on('following_update', handleRefetch);
    socket.on('connect', handleRefetch);

    socket.on('notification:new', (notif) => {
      toast.success(notif.title || 'New activity update received');
      handleRefetch();
    });

    return () => {
      socket.off('order:updated', handleRefetch);
      socket.off('inquiry:updated', handleRefetch);
      socket.off('inquiry:deleted', handleRefetch);
      socket.off('proposal:submitted', handleRefetch);
      socket.off('proposal:accepted', handleRefetch);
      socket.off('proposal:rejected', handleRefetch);
      socket.off('following_update', handleRefetch);
      socket.off('connect', handleRefetch);
      socket.off('notification:new');
    };
  }, [
    skipOrders, skipInquiries, skipSaved, skipQuotes, skipFollowingVendors, skipFollowingServices,
    refetchOrders, refetchInquiries, refetchSaved, refetchQuotes, refetchFollowingVendors, refetchFollowingServices
  ]);

  // Tab switching helper
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearch('');
    setCategory('');
    setStatus('');
    setSortBy('latest');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  // Actions
  const handleRemoveSaved = async (listingId) => {
    try {
      await unsaveListing(listingId).unwrap();
      toast.success('Removed from saved items');
      fetchCounts();
      setCustomActivities(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== listingId && item._id !== listingId)
      }));
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleUnfollow = (userId, name) => {
    setConfirmModal({
      show: true,
      title: 'Unfollow Account',
      message: `Are you sure you want to stop following ${name}? You will no longer receive their latest reels, posts, or business offers in your feed.`,
      onConfirm: async () => {
        try {
          await unfollowUser(userId).unwrap();
          toast.success(`Unfollowed ${name}`);
        } catch (err) {
          toast.error('Failed to unfollow');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleCancelOrder = (orderId, listingTitle) => {
    setConfirmModal({
      show: true,
      title: 'Cancel Order Request',
      message: `Are you sure you want to cancel your order for "${listingTitle}"? The payment amount will be refunded back to your wallet instantly.`,
      onConfirm: async () => {
        const toastId = toast.loading('Cancelling order...');
        try {
          await cancelOrder(orderId).unwrap();
          toast.success('Order cancelled and wallet refunded.', { id: toastId });
          refetchOrders();
        } catch (err) {
          toast.error(err.data?.message || 'Failed to cancel order.', { id: toastId });
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleCloseInquiry = (inquiryId) => {
    setConfirmModal({
      show: true,
      title: 'Close Inquiry Thread',
      message: 'Are you sure you want to close this inquiry? This indicates the enquiry is resolved and no further response is needed.',
      onConfirm: async () => {
        try {
          await closeInquiry(inquiryId).unwrap();
          toast.success('Inquiry closed successfully');
          refetchInquiries();
        } catch (err) {
          toast.error('Failed to close inquiry');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleDeleteInquiry = (inquiryId) => {
    setConfirmModal({
      show: true,
      title: 'Delete Inquiry History',
      message: 'Are you sure you want to remove this inquiry from your dashboard? This will soft-delete the record.',
      onConfirm: async () => {
        try {
          await deleteInquiry(inquiryId).unwrap();
          toast.success('Inquiry removed');
          refetchInquiries();
        } catch (err) {
          toast.error('Failed to delete inquiry');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleUpdateQuote = (quoteId, status, vendorName) => {
    setConfirmModal({
      show: true,
      title: `${status === 'accepted' ? 'Accept' : 'Reject'} Quotation`,
      message: `Are you sure you want to ${status} the quotation from "${vendorName}"? ${status === 'accepted' ? 'This will automatically debit your wallet and notify the vendor.' : ''}`,
      onConfirm: async () => {
        const toastId = toast.loading(`${status === 'accepted' ? 'Accepting' : 'Rejecting'} quote...`);
        try {
          await updateQuoteStatus({ quoteId, status }).unwrap();
          toast.success(`Quote ${status} successfully!`, { id: toastId });
          refetchQuotes();
        } catch (err) {
          toast.error(err.data?.message || 'Failed to update quote status.', { id: toastId });
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleAddToCart = async (listingId) => {
    const toastId = toast.loading('Adding to cart...');
    try {
      await api.post('/v1/cart/me/add', { listingId, quantity: 1 });
      toast.success('Listing added to cart!', { id: toastId });
      if (window.dispatchEvent) {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      toast.error('Failed to add to cart. Try again.', { id: toastId });
    }
  };

  const handleReorder = async (listingId, quantity, address) => {
    const toastId = toast.loading('Placing reorder request...');
    try {
      await api.post('/v1/orders', { listingId, quantity, address });
      toast.success('Reordered successfully!', { id: toastId });
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place reorder request.', { id: toastId });
    }
  };

  const handleShare = async (type, id, title) => {
    const path = `/customer/${type}/${id}`;
    const url = `${window.location.origin}${path}`;
    const shareData = {
      title: title || 'BizReels Item',
      text: `Check this out on BizReels!`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    } else {
      toast.success(`Share this link: ${url}`);
    }
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
      toast.error('Please write a comment for your review.');
      return;
    }
    const toastId = toast.loading('Submitting review...');
    try {
      await api.post('/v1/reviews', {
        targetListing: reviewListingId || undefined,
        targetUser: reviewVendorId,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review submitted successfully!', { id: toastId });
      setIsReviewOpen(false);
      refetchOrders();
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
        address: `[Scheduled: ${bookingDate} at ${bookingTime}] Delivery Location: ${bookingAddress}. Remarks: ${bookingNotes || 'None'}`
      });
      toast.success('Booking requested successfully! Tracking request.', { id: toastId });
      setIsBookingOpen(false);
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking request failed.', { id: toastId });
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - BizReels</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e5e7eb; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
            .logo { font-size: 26px; font-weight: 800; color: #8b5cf6; text-transform: uppercase; letter-spacing: 1px; }
            .title { font-size: 20px; font-weight: 700; color: #111827; }
            .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .details h3 { margin-bottom: 6px; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
            .details p { margin: 0; font-size: 15px; font-weight: 700; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { background: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #4b5563; font-size: 11px; text-transform: uppercase; font-weight: 600; }
            td { padding: 16px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
            .total { text-align: right; margin-top: 30px; font-size: 22px; font-weight: 800; color: #111827; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="logo">BizReels</div>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Online B2B/B2C Marketplace</p>
              </div>
              <div class="title">OFFICIAL INVOICE</div>
            </div>
            <div class="details">
              <div>
                <h3>Invoice Date</h3>
                <p>${new Date(order.createdAt).toLocaleDateString()}</p>
                <h3 style="margin-top: 16px;">Order Request ID</h3>
                <p>${order._id}</p>
              </div>
              <div>
                <h3>Seller Profile</h3>
                <p>${order.vendor?.name || 'Verified Vendor'}</p>
                <h3 style="margin-top: 16px;">Billing Customer</h3>
                <p>${order.customer?.name || 'Authorized Buyer'}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product / Service Description</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 700; color: #111827;">${order.listing?.title || order.item || 'Order Request Item'}</td>
                  <td>${order.listing?.category || 'General'}</td>
                  <td>${order.quantity}</td>
                  <td>₹${(order.price / order.quantity).toLocaleString()}</td>
                  <td style="font-weight: 700; color: #111827;">₹${order.price.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <div class="total">Amount Paid: ₹${order.price.toLocaleString()}</div>
            <div class="footer">
              <p>Thank you for purchasing on BizReels! This is a system-generated invoice receipt.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleRemoveSavedReel = async (id) => {
    try {
      await api.post(`/v1/reels/${id}/unsave`);
      toast.success('Removed from saved reels');
      fetchCounts();
      setCustomActivities(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== id && item._id !== id)
      }));
    } catch {
      toast.error('Failed to unsave reel');
    }
  };

  const handleRemoveSavedImage = async (id) => {
    try {
      await api.post(`/v1/listings/${id}/unsave-image`);
      toast.success('Removed from saved images');
      fetchCounts();
      setCustomActivities(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== id && item._id !== id)
      }));
    } catch {
      toast.error('Failed to unsave image');
    }
  };

  // Get current active state datasets & loading
  const getActiveTabState = () => {
    if (isCustomTab) {
      return {
        data: customActivities.data || [],
        loading: customLoading,
        pagination: customActivities.pagination
      };
    }
    switch (activeTab) {
      case 'my-orders':
        return {
          data: ordersData?.orders || [],
          loading: ordersLoading,
          pagination: ordersData?.pagination
        };
      case 'inquiries':
        return {
          data: inquiriesData?.inquiries || [],
          loading: inquiriesLoading,
          pagination: inquiriesData?.pagination
        };
      case 'quotes':
        return {
          data: quotesData?.quotes || [],
          loading: quotesLoading,
          pagination: quotesData?.pagination
        };
      case 'following-vendors':
        return {
          data: followingVendorsData?.items || [],
          loading: followingVendorsLoading,
          pagination: followingVendorsData ? { page: page, limit: 6, total: followingVendorsData.count } : undefined
        };
      case 'following-services':
        return {
          data: followingServicesData?.items || [],
          loading: followingServicesLoading,
          pagination: followingServicesData ? { page: page, limit: 6, total: followingServicesData.count } : undefined
        };
      default:
        return { data: [], loading: false };
    }
  };

  const { data, loading, pagination } = getActiveTabState();
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  // Track Timeline Order Handler
  const openTracker = (order) => {
    setSelectedOrder(order);
    setIsTrackerOpen(true);
  };

  // Timeline statuses
  const TIMELINE_STEPS = [
    { key: 'pending', label: 'Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStepStatusIndex = (currentStatus) => {
    const statuses = ['pending', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    return statuses.indexOf(currentStatus.toLowerCase());
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in p-2 sm:p-4 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">CUSTOMER PORTAL</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            MY ACTIVITIES &amp; SAVED CONTENT
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Track saved items, order requests, inquiries, quote biddings, and followed vendors.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiActivity size={20} />
        </div>
      </div>

      {/* Dynamic Bento Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {dynamicTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-2 rounded-md text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs scale-[1.01]'
                  : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec] hover:text-[#1a1a1a]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#d99a3d]' : 'text-slate-500'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-[#241b15] text-[#d99a3d]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="glass rounded-2xl p-4 border border-white/40 shadow-card flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={`Search ${activeTab.replace('-', ' ')}...`}
            className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple transition font-medium"
          />
          <FiSearch className="absolute left-3 top-2.5 text-text-tertiary" size={14} />
        </div>

        {/* Tab-Specific Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Category Filter for Saved Bookmarks */}
          {(activeTab === 'saved-products' || activeTab === 'saved-services') && (
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
            >
              <option value="">All Categories</option>
              {parentCategories.map(cat => (
                <option key={cat.id || cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {/* Price Range for Saved Bookmarks */}
          {(activeTab === 'saved-products' || activeTab === 'saved-services') && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="Min ₹"
                className="w-20 px-2 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
              <span className="text-[10px] text-text-tertiary">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="Max ₹"
                className="w-20 px-2 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
            </div>
          )}

          {/* Status Filters */}
          {(activeTab === 'my-orders' || activeTab === 'inquiries' || activeTab === 'quotes') && (
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
            >
              <option value="">All Statuses</option>
              {activeTab === 'my-orders' && (
                <>
                  <option value="active">Active Requests</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                  <option value="refunded">Refunded</option>
                </>
              )}
              {activeTab === 'inquiries' && (
                <>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </>
              )}
              {activeTab === 'quotes' && (
                <>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </>
              )}
            </select>
          )}

          {/* Sort Menu */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-secondary focus:outline-none focus:border-brand-purple"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            {['saved-products', 'saved-services', 'my-orders', 'quotes'].includes(activeTab) && (
              <>
                <option value="price_low_high">Price: Low → High</option>
                <option value="price_high_low">Price: High → Low</option>
              </>
            )}
            {['saved-products', 'saved-services', 'following-vendors', 'following-services'].includes(activeTab) && (
              <>
                <option value="highest_rated">Highest Rated</option>
                <option value="most_popular">Most Popular</option>
              </>
            )}
          </select>
        </div>
      </div>

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
          /* EMPTY STATES WITH SVG */
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-brand-purple/5 flex items-center justify-center text-brand-purple border border-brand-purple/20">
              {activeTab.startsWith('saved') ? <FiBookmark size={40} /> : activeTab === 'my-orders' ? <FiPackage size={40} /> : activeTab === 'inquiries' ? <FiMessageSquare size={40} /> : activeTab === 'quotes' ? <FiDollarSign size={40} /> : <FiUserCheck size={40} />}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text-primary">No Activities Found</h3>
              <p className="text-xs text-text-tertiary max-w-sm">We couldn't find any listings or records matching your dashboard filters. Browse feed or update filters!</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* SAVED PRODUCTS */}
            {activeTab === 'saved-products' && data.map((p) => {
              const hasDiscount = p.discount > 0 || (p.actualPrice && p.sellingPrice && p.actualPrice > p.sellingPrice);
              const origPrice = p.actualPrice || p.price || 0;
              const salePrice = p.sellingPrice || p.salePrice || p.price || 0;
              const inStock = p.stock > 0;

              return (
                <div key={p.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                      <img
                        src={resolveMediaUrl(p.images?.[0] || 'https://via.placeholder.com/300')}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${inStock ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{p.category}</span>
                      <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{p.title}</h4>
                      <p className="text-[10px] text-text-tertiary truncate">By <span className="font-semibold text-text-secondary cursor-pointer hover:underline" onClick={() => navigate(`/customer/vendor/${p.vendor?.id || p.vendor?._id}`)}>{p.vendor?.vendorProfile?.shopName || p.vendor?.name || 'Verified Vendor'}</span></p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold">
                        <FiStar size={11} fill="currentColor" />
                        <span>{p.rating || 0}</span>
                        <span className="text-[9px] text-text-tertiary">({p.totalReviews || 0})</span>
                      </div>

                      {/* Prices */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-bold text-text-primary">₹{salePrice.toLocaleString()}</span>
                        {hasDiscount && (
                          <>
                            <span className="text-[10px] text-text-tertiary line-through">₹{origPrice.toLocaleString()}</span>
                            <span className="text-[9px] px-1 bg-red-500/10 text-red-500 rounded font-bold">{p.discount || Math.round(((origPrice - salePrice) / origPrice) * 100)}% Off</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleAddToCart(p.id)}
                      disabled={!inStock}
                      className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <FiShoppingBag size={11} /> Buy Now
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(p.id)}
                      className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      <FiTrash2 size={11} /> Remove
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
                    <span>Saved: {new Date(p.updatedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleShare('listing', p.id, p.title)} className="hover:text-brand-purple p-1"><FiShare2 size={11} /></button>
                      <button onClick={() => navigate(`/customer/search?search=${p.title}`)} className="hover:text-brand-purple p-1"><FiExternalLink size={11} /></button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SAVED SERVICES */}
            {activeTab === 'saved-services' && data.map((s) => {
              const coverImg = s.serviceDetails?.coverImage || s.images?.[0] || 'https://via.placeholder.com/300';
              const activeStatus = s.status === 'published';

              return (
                <div key={s.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                      <img
                        src={resolveMediaUrl(coverImg)}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${activeStatus ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                        {activeStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{s.category}</span>
                      <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{s.title}</h4>
                      <p className="text-[10px] text-text-tertiary truncate">By <span className="font-semibold text-text-secondary cursor-pointer hover:underline" onClick={() => navigate(`/customer/vendor/${s.vendor?.id || s.vendor?._id}`)}>{s.vendor?.vendorProfile?.shopName || s.vendor?.name || 'Service Provider'}</span></p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-yellow-500 font-bold">
                        <FiStar size={11} fill="currentColor" />
                        <span>{s.rating || 0}</span>
                      </div>

                      {/* Area & Price */}
                      <div className="text-[9px] text-text-tertiary flex items-center gap-1 mt-1">
                        <FiMapPin size={10} />
                        <span className="truncate">{s.serviceDetails?.serviceArea || 'Local'}</span>
                      </div>

                      <p className="text-xs font-bold text-brand-purple mt-2">Starting: ₹{(s.price || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleOpenBooking(s)}
                      disabled={!activeStatus}
                      className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <FiCalendar size={11} /> Book Service
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(s.id)}
                      className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      <FiTrash2 size={11} /> Remove
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
                    <span>Saved: {new Date(s.updatedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/customer/chat?vendorId=${s.vendor?.id || s.vendor?._id}`)} className="hover:text-brand-purple p-1"><FiMessageSquare size={11} /></button>
                      <button onClick={() => handleShare('listing', s.id, s.title)} className="hover:text-brand-purple p-1"><FiShare2 size={11} /></button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SAVED REELS */}
            {activeTab === 'saved-reels' && data.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                    {r.thumbnailUrl ? (
                      <img
                        src={resolveMediaUrl(r.thumbnailUrl)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-purple/20 flex items-center justify-center">
                        <FiVideo size={24} className="text-brand-purple" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{r.category || 'Reel'}</span>
                    <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{r.caption || 'Video Reel'}</h4>
                    <p className="text-[10px] text-text-tertiary truncate">By <span className="font-semibold text-text-secondary">{r.creator?.vendorProfile?.shopName || r.creator?.name || 'Creator'}</span></p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-tertiary">
                      <span>👁️ {r.views || 0} views</span>
                      <span>❤️ {r.likesCount || 0} likes</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => navigate(`/customer/home?reel=${r.id}`)}
                    className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
                  >
                    <FiExternalLink size={11} /> Watch Reel
                  </button>
                  <button
                    onClick={() => handleRemoveSavedReel(r.id)}
                    className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <FiTrash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            ))}

            {/* SAVED IMAGES */}
            {activeTab === 'saved-images' && data.map((img) => {
              const coverImg = img.images?.[0] || 'https://via.placeholder.com/300';
              return (
                <div key={img.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0 relative">
                      <img
                        src={resolveMediaUrl(coverImg)}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-brand-purple font-bold">{img.category || 'Listing'}</span>
                      <h4 className="font-bold text-xs text-text-primary truncate mb-0.5">{img.title}</h4>
                      <p className="text-[10px] text-text-tertiary truncate">By <span className="font-semibold text-text-secondary">{img.vendor?.vendorProfile?.shopName || img.vendor?.name || 'Vendor'}</span></p>
                      <p className="text-xs font-bold text-brand-purple mt-2">₹{(img.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/customer/search?search=${img.title}`)}
                      className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
                    >
                      <FiExternalLink size={11} /> View Listing
                    </button>
                    <button
                      onClick={() => handleRemoveSavedImage(img.id)}
                      className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      <FiTrash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* INTERACTION LOGS (CALL, WHATSAPP, INQUIRY) */}
            {['click-to-called', 'whatsapp-contacted', 'chat-inquiries'].includes(activeTab) && data.map((item) => (
              <div key={item.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={resolveMediaUrl(item.vendor?.avatarUrl || 'https://via.placeholder.com/150')}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-border"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer truncate" onClick={() => navigate(`/customer/vendor/${item.vendor?.id}`)}>
                      {item.vendor?.vendorProfile?.shopName || item.vendor?.name || 'Verified Vendor'}
                    </h4>
                    <span className="text-[9px] uppercase font-bold text-brand-purple tracking-wider truncate">
                      {activeTab === 'click-to-called' ? '📞 Click to Call Log' : activeTab === 'whatsapp-contacted' ? '💬 WhatsApp Contact Log' : '✉️ Chat Inquiry Log'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary mt-1">
                      <FiClock size={10} />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {item.vendor?.phone ? (
                    <a
                      href={`tel:${item.vendor.phone}`}
                      className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
                    >
                      <FiPhone size={11} /> Call Again
                    </a>
                  ) : (
                    <div className="py-2 bg-surface-tertiary text-text-tertiary text-center rounded-xl text-[10px] font-bold">
                      No Phone
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/customer/chat?vendorId=${item.vendor?.id || item.vendor?._id}`)}
                    className="py-2 glass border border-border text-text-secondary hover:text-brand-purple rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                  >
                    <FiMessageSquare size={11} /> Chat Direct
                  </button>
                </div>
              </div>
            ))}

            {/* MY ORDERS REQUEST */}
            {activeTab === 'my-orders' && data.map((o) => {
              const itemTitle = o.listing?.title || o.item || 'Order Request Item';
              const isService = o.listing?.type === 'service' || (o.address || '').includes('[Scheduled:');
              const isCancelAllowed = o.status === 'pending';
              const canReview = o.status === 'delivered' || o.status === 'completed';

              return (
                <div key={o._id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-start mb-2 border-b border-border/50 pb-2">
                      <div>
                        <span className="text-[8px] text-text-tertiary font-bold tracking-wider uppercase block">Order ID</span>
                        <span className="text-[10px] font-mono text-text-secondary font-bold flex items-center gap-1">
                          {o._id.substring(12)}...
                          <button onClick={() => { navigator.clipboard.writeText(o._id); toast.success('ID copied!'); }} className="text-[8px] px-1 bg-surface rounded hover:text-brand-purple">Copy</button>
                        </span>
                      </div>
                      <AdminStatusBadge status={o.status} />
                    </div>

                    <div className="flex gap-3 my-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/10 border border-border flex-shrink-0">
                        <img
                          src={resolveMediaUrl(o.listing?.images?.[0] || 'https://via.placeholder.com/150')}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-text-primary truncate">{itemTitle}</h4>
                        <p className="text-[10px] text-text-tertiary">From: {o.vendor?.vendorProfile?.shopName || o.vendor?.name || 'Seller'}</p>
                        <p className="text-[10px] font-semibold text-text-secondary mt-1">Quantity: {o.quantity} • Total: <span className="text-emerald-600 font-bold">₹{o.price.toLocaleString()}</span></p>
                      </div>
                    </div>

                    <div className="p-3 bg-surface-secondary/40 rounded-xl border border-border/60 text-[10px] text-text-secondary space-y-1 mt-2">
                      <div className="flex justify-between"><span>Payment:</span><span className="font-bold uppercase text-[9px] text-emerald-600">{o.paymentStatus}</span></div>
                      <div className="flex justify-between"><span>Type:</span><span className="font-bold capitalize">{isService ? 'Service Booking' : 'Product Purchase'}</span></div>
                      <div className="flex justify-between"><span>Placed On:</span><span>{new Date(o.createdAt).toLocaleDateString()}</span></div>
                      {o.expectedDeliveryDate && <div className="flex justify-between"><span>Expected Delivery:</span><span>{new Date(o.expectedDeliveryDate).toLocaleDateString()}</span></div>}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {/* Action Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openTracker(o)}
                        className="py-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <FiClock size={11} /> Track Order
                      </button>

                      {isCancelAllowed ? (
                        <button
                          onClick={() => handleCancelOrder(o._id, itemTitle)}
                          className="py-2 border border-error/20 bg-error-light/5 hover:bg-error-light/10 text-error rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <FiXCircle size={11} /> Cancel Request
                        </button>
                      ) : canReview ? (
                        <button
                          onClick={() => handleOpenReview(o.listing?._id || o.listing?.id || '', o.vendor?._id || o.vendor?.id)}
                          className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <FiStar size={11} /> Leave Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePrintInvoice(o)}
                          className="py-2 border border-border text-text-secondary hover:bg-surface-secondary rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                        >
                          <FiPackage size={11} /> Print Receipt
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-text-tertiary">
                      <button onClick={() => navigate(`/customer/chat?vendorId=${o.vendor?._id || o.vendor?.id}`)} className="hover:text-brand-purple font-semibold flex items-center gap-1"><FiMessageSquare size={10} /> Chat with Seller</button>
                      <button onClick={() => handleReorder(o.listing?._id || o.listing?.id, o.quantity, o.address)} className="hover:text-brand-purple font-semibold flex items-center gap-1"><FiRefreshCw size={10} /> Reorder Item</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* INQUIRY HISTORY */}
            {activeTab === 'inquiries' && data.map((inq) => {
              const isClosed = inq.status === 'closed';

              return (
                <div key={inq._id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                      <span className="text-[9px] text-text-tertiary font-bold tracking-wider uppercase font-mono">Inq ID: {inq._id.substring(16)}</span>
                      <AdminStatusBadge status={inq.status} />
                    </div>

                    <h4 className="font-bold text-xs text-text-primary truncate">{inq.listing?.title || 'Listing Enquiry'}</h4>
                    <p className="text-[10px] text-text-tertiary">Seller: <span className="font-semibold text-text-secondary">{inq.vendor?.vendorProfile?.shopName || inq.vendor?.name || 'Vendor'}</span></p>

                    <div className="p-3 bg-surface-secondary/40 rounded-xl border border-border/60 mt-3">
                      <p className="text-[10px] text-text-secondary italic line-clamp-3">"{inq.message}"</p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-[10px] text-text-tertiary">
                      <FiCalendar size={11} />
                      <span>Sent: {new Date(inq.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                    <button
                      onClick={() => navigate(`/customer/chat?vendorId=${inq.vendor?._id || inq.vendor?.id}`)}
                      className="w-full py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-1"
                    >
                      <FiMessageSquare size={11} /> Continue Chat
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCloseInquiry(inq._id)}
                        disabled={isClosed}
                        className="py-1.5 glass border border-border text-text-secondary hover:text-brand-purple disabled:opacity-40 rounded-xl text-[10px] font-semibold transition"
                      >
                        Close Inquiry
                      </button>
                      <button
                        onClick={() => handleDeleteInquiry(inq._id)}
                        className="py-1.5 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition flex items-center justify-center gap-1"
                      >
                        <FiTrash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* QUOTES RECEIVED */}
            {activeTab === 'quotes' && data.map((q) => {
              const isPending = q.status === 'pending';
              const reqTitle = q.requirement?.title || 'Requirement Quotation Proposal';
              const shopName = q.vendor?.vendorProfile?.shopName || q.vendor?.vendorProfile?.businessName || q.vendor?.name || 'Seller';

              return (
                <div key={q.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300">
                  <div>
                    <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                      <span className="text-[9px] text-text-tertiary font-bold font-mono">Proposal Date: {new Date(q.createdAt).toLocaleDateString()}</span>
                      <AdminStatusBadge status={q.status} />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={resolveMediaUrl(q.vendor?.avatarUrl || q.vendor?.profile_pic || 'https://via.placeholder.com/150')}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer transition" onClick={() => navigate(`/customer/vendor/${q.vendor?._id}`)}>{shopName}</h4>
                        <div className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold">
                          <FiStar size={10} fill="currentColor" />
                          <span>{q.vendor?.rating_avg || 0}</span>
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-text-primary truncate mb-1">For: {reqTitle}</h4>
                    <p className="text-[10px] text-text-secondary line-clamp-3 bg-surface-secondary/40 border border-border/60 rounded-xl p-3 italic">"{q.notes || 'No quotation notes specified.'}"</p>

                    <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-xl text-[10px] text-text-secondary space-y-1 mt-3">
                      <div className="flex justify-between"><span>Bidded Price:</span><span className="font-extrabold text-emerald-600 text-xs">₹{(q.price || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Est. Delivery:</span><span className="font-semibold text-text-primary">{q.estimatedDelivery ? new Date(q.estimatedDelivery).toLocaleDateString() : 'N/A'}</span></div>
                      {q.attachments && q.attachments.length > 0 && <div className="flex justify-between"><span>Attachments:</span><span className="font-bold text-brand-purple cursor-pointer underline flex items-center gap-0.5"><FiPackage size={10} /> View Files</span></div>}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {isPending ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateQuote(q.id, 'accepted', shopName)}
                          className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition"
                        >
                          Accept Quote
                        </button>
                        <button
                          onClick={() => handleUpdateQuote(q.id, 'rejected', shopName)}
                          className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-bold transition"
                        >
                          Reject Quote
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] font-semibold text-text-tertiary text-center bg-surface py-2 rounded-xl border border-border">
                        This quotation proposal status is {q.status.toUpperCase()}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-text-tertiary pt-1">
                      <button onClick={() => navigate(`/customer/chat?vendorId=${q.vendor?._id || q.vendor?.id}`)} className="hover:text-brand-purple font-semibold flex items-center gap-0.5"><FiMessageSquare size={10} /> Chat with Vendor</button>
                      <button onClick={() => navigate(`/customer/vendor/${q.vendor?._id || q.vendor?.id}`)} className="hover:text-brand-purple font-semibold flex items-center gap-0.5"><FiUserCheck size={10} /> View Vendor Profile</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* FOLLOWING VENDORS / SERVICES */}
            {(activeTab === 'following-vendors' || activeTab === 'following-services') && data.map((v) => {
              const shopName = v.vendorProfile?.shopName || v.vendorProfile?.businessName || v.name;
              const logo = v.vendorProfile?.shopLogo || v.profile_pic || v.avatarUrl || 'https://via.placeholder.com/150';
              const categoryText = v.vendorProfile?.category || v.vendorProfile?.categories?.join(', ') || v.roles?.join(', ') || 'Vendor';
              const locationText = v.vendorProfile?.address?.city || v.city || 'Local Area';
              const postsCount = v.vendorProfile?.totalPosts || 0;
              const verified = v.kyc_status === 'approved' || v.is_subscribed_verified;
              const isOnline = v.is_active;

              return (
                <div key={v.id} className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/50 shadow-card flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={resolveMediaUrl(logo)}
                        alt={shopName}
                        className="w-12 h-12 rounded-full object-cover border border-border"
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-xs text-text-primary hover:text-brand-purple cursor-pointer truncate" onClick={() => navigate(`/customer/vendor/${v.id}`)}>{shopName}</h4>
                        {verified && <span className="text-[10px] text-blue-500 font-bold flex-shrink-0" title="Verified Badge">✓</span>}
                      </div>
                      <p className="text-[9px] uppercase font-bold text-brand-purple tracking-wider truncate">{categoryText}</p>
                      <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <FiMapPin size={10} />
                        <span>{locationText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-surface-secondary/40 border border-border/60 rounded-xl text-center text-[10px] text-text-secondary">
                    <div>
                      <span className="block font-bold text-text-primary text-xs">{v.followersCount || 0}</span>
                      <span className="text-[8px] text-text-tertiary uppercase">Followers</span>
                    </div>
                    <div>
                      <span className="block font-bold text-text-primary text-xs">{v.rating_avg || 0}</span>
                      <span className="text-[8px] text-text-tertiary uppercase">Rating</span>
                    </div>
                    <div>
                      <span className="block font-bold text-text-primary text-xs">{postsCount}</span>
                      <span className="text-[8px] text-text-tertiary uppercase">Posts</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/customer/vendor/${v.id}`)}
                      className="py-2 gradient-brand text-white rounded-xl text-[10px] font-bold shadow-premium hover:opacity-95 transition"
                    >
                      Visit Profile
                    </button>
                    <button
                      onClick={() => handleUnfollow(v.id, shopName)}
                      className="py-2 glass border border-border text-text-secondary hover:text-error hover:bg-error-light/10 rounded-xl text-[10px] font-semibold transition"
                    >
                      Unfollow
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-text-tertiary border-t border-border/50 pt-2">
                    <button onClick={() => navigate(`/customer/chat?vendorId=${v.id}`)} className="hover:text-brand-purple font-semibold flex items-center gap-0.5"><FiMessageSquare size={10} /> Chat Direct</button>
                    <button onClick={() => handleShare('vendor', v.id, shopName)} className="hover:text-brand-purple font-semibold flex items-center gap-0.5"><FiShare2 size={10} /> Share</button>
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border/50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary disabled:opacity-40 hover:bg-surface-secondary transition"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-text-secondary">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-secondary disabled:opacity-40 hover:bg-surface-secondary transition"
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
            <div className="flex items-center gap-3 text-brand-purple">
              <FiInfo size={24} />
              <h3 className="text-sm font-extrabold text-text-primary font-display uppercase tracking-wide">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary transition"
              >
                No, Keep it
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER TRACKING TIMELINE MODAL */}
      {isTrackerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="glass max-w-lg w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                <FiTruck className="text-brand-purple" /> Order Tracking status
              </h3>
              <button
                onClick={() => setIsTrackerOpen(false)}
                className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Listing: <span className="font-bold text-text-primary">{selectedOrder.listing?.title || selectedOrder.item}</span></span>
                <span>Vendor: <span className="font-bold text-text-primary">{selectedOrder.vendor?.name}</span></span>
              </div>
              <div className="text-[10px] text-text-tertiary bg-surface-secondary/50 rounded-xl p-3 border border-border">
                <p>Address: <span className="font-semibold text-text-secondary">{selectedOrder.address}</span></p>
                {selectedOrder.expectedDeliveryDate && <p className="mt-1">Exp. Delivery: <span className="font-semibold text-text-secondary">{new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</span></p>}
              </div>

              {/* Visual status stepper */}
              <div className="flex flex-col gap-6 pt-4 pl-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getStepStatusIndex(selectedOrder.status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="flex gap-4 items-start relative">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 flex items-center justify-center ${isCompleted ? 'bg-brand-purple border-brand-purple text-white shadow-md' : 'bg-surface border-border'}`}>
                        {isCompleted && <span className="text-[8px]">✓</span>}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block ${isCurrent ? 'text-brand-purple' : isCompleted ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                          {step.label}
                        </span>
                        {isCurrent && <span className="text-[9px] text-brand-purple/70 block mt-0.5 animate-pulse">● Active state</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE REVIEW MODAL */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <form onSubmit={handleReviewSubmit} className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                <FiStar className="text-yellow-500" /> Submit Vendor Review
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">Select Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2 pt-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <FiStar size={24} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">Write your review / comments</label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your purchase experience, quality of service, or shipping feedback..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
            >
              Submit Official Review
            </button>
          </form>
        </div>
      )}

      {/* BOOK SERVICE DIALOG */}
      {isBookingOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <form onSubmit={handleBookServiceSubmit} className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                <FiCalendar className="text-brand-purple" /> Book Service Appointment
              </h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">Service Title</label>
                <input
                  type="text"
                  disabled
                  value={selectedService.title}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-tertiary font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">Preferred Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">Full Service Address</label>
                <input
                  type="text"
                  required
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                  placeholder="Street, Building, Flat details, City, Pin code..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">Booking Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Bring spare filters, AC gas check..."
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
            >
              Confirm Booking Reservation
            </button>
          </form>
        </div>
      )}

    </div>
  );
}