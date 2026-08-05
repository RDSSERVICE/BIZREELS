import apiSlice from '../../api/apiSlice';

/**
 * Vendor API Slice
 * Injects RTK Query endpoints for vendor-specific features.
 * All query hooks support pollingInterval for real-time data.
 */
const vendorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Dashboard Overview ─────────────────────────────────
    getVendorDashboard: builder.query({
      query: () => '/vendor/dashboard',
      providesTags: ['VendorDashboard'],
    }),

    // ── Listings ────────────────────────────────────────────
    getVendorListings: builder.query({
      query: (params = {}) => ({ url: '/listings', params: { limit: 50, ...params } }),
      providesTags: (result) => {
        const items = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.listings)
          ? result.listings
          : Array.isArray(result)
          ? result
          : [];
        return [
          ...items.map((item) => ({ type: 'Products', id: item._id || item.id })),
          { type: 'Products', id: 'LIST' },
        ];
      },
    }),
    createListing: builder.mutation({
      query: (body) => ({ url: '/listings', method: 'POST', body }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'VendorDashboard'],
    }),
    updateListing: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/listings/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    deleteListing: builder.mutation({
      query: (id) => ({ url: `/listings/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'VendorDashboard'],
    }),
    toggleListingVisibility: builder.mutation({
      query: ({ id, status }) => ({ url: `/listings/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    duplicateListing: builder.mutation({
      query: (id) => ({ url: `/listings/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'VendorDashboard'],
    }),
    bulkUpdateListings: builder.mutation({
      query: (body) => ({ url: '/listings/bulk', method: 'POST', body }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, 'VendorDashboard'],
    }),
    getListingAnalytics: builder.query({
      query: (id) => `/listings/${id}/analytics`,
      providesTags: (result, error, id) => [{ type: 'Products', id }],
    }),
    updateListingStock: builder.mutation({
      query: ({ id, stock }) => ({ url: `/listings/${id}/stock`, method: 'PATCH', body: { stock } }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),

    // ── Vendor Offers ────────────────────────────────────────
    getVendorOffers: builder.query({
      query: () => '/vendors/me/offers',
      providesTags: ['VendorOffers'],
    }),
    createVendorOffer: builder.mutation({
      query: (body) => ({ url: '/vendors/me/offers', method: 'POST', body }),
      invalidatesTags: ['VendorOffers', 'VendorDashboard'],
    }),
    updateVendorOffer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/vendors/me/offers/${id}`, method: 'PUT', body }),
      invalidatesTags: ['VendorOffers'],
    }),
    deleteVendorOffer: builder.mutation({
      query: (id) => ({ url: `/vendors/me/offers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['VendorOffers', 'VendorDashboard'],
    }),
    duplicateVendorOffer: builder.mutation({
      query: (id) => ({ url: `/vendors/me/offers/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['VendorOffers'],
    }),
    toggleOfferStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/vendors/me/offers/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['VendorOffers'],
    }),

    // ── Reels ───────────────────────────────────────────────
    getVendorReels: builder.query({
      query: (params = {}) => ({ url: '/reels/my-reels', params }),
      providesTags: ['Reels'],
    }),
    createReel: builder.mutation({
      query: (body) => ({ url: '/reels', method: 'POST', body }),
      invalidatesTags: ['Reels', 'VendorDashboard'],
    }),
    deleteReel: builder.mutation({
      query: (id) => ({ url: `/reels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reels', 'VendorDashboard'],
    }),
    // NOTE: Boosts endpoints removed — boost system deprecated

    // ── Leads / Enquiries ───────────────────────────────────
    getVendorLeads: builder.query({
      query: (params = {}) => ({ url: '/leads', params }),
      providesTags: ['VendorLeads'],
    }),
    replyToLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/reply`, method: 'POST', body }),
      invalidatesTags: ['VendorLeads'],
    }),

    // ── Orders ──────────────────────────────────────────────
    getVendorOrders: builder.query({
      query: (params = {}) => ({ url: '/orders', params }),
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/orders/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Orders', 'VendorDashboard'],
    }),

    // ── Analytics ────────────────────────────────────────────
    getVendorAnalytics: builder.query({
      query: (params = {}) => ({ url: '/vendor/analytics', params }),
      providesTags: ['Analytics'],
    }),
    getVendorAnalyticsOverview: builder.query({
      query: (range = '30d') => ({ url: '/vendor/analytics/overview', params: { range } }),
      providesTags: ['Analytics'],
    }),
    getVendorAnalyticsListings: builder.query({
      query: (params = {}) => ({ url: '/vendor/analytics/listings', params }),
      providesTags: ['Analytics'],
    }),
    getVendorAnalyticsTimeseries: builder.query({
      query: ({ range = '30d', metric = 'views' } = {}) => ({ url: '/vendor/analytics/timeseries', params: { range, metric } }),
      providesTags: ['Analytics'],
    }),
    getVendorAnalyticsBoostRoi: builder.query({
      query: (listingId) => ({ url: '/vendor/analytics/boost-roi', params: { listing_id: listingId } }),
      providesTags: ['Analytics'],
    }),
    simulateVendorAnalytics: builder.mutation({
      query: () => ({ url: '/vendor/analytics/simulate', method: 'POST' }),
      invalidatesTags: ['Analytics', 'VendorDashboard', 'Products', 'Reels'],
    }),

    // ── Reviews ─────────────────────────────────────────────
    getVendorReviews: builder.query({
      query: (params = {}) => ({ url: '/reviews', params }),
      providesTags: ['Reviews'],
    }),
    replyToReview: builder.mutation({
      query: ({ id, reply }) => ({ url: `/reviews/${id}/reply`, method: 'POST', body: { reply } }),
      invalidatesTags: ['Reviews'],
    }),

    // ── Wallet ──────────────────────────────────────────────
    getVendorWallet: builder.query({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),
    getWalletTransactions: builder.query({
      query: (params = {}) => ({ url: '/wallet/transactions', params }),
      providesTags: ['Wallet'],
    }),
    rechargeWallet: builder.mutation({
      query: (body) => ({ url: '/wallet/recharge', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'VendorDashboard'],
    }),

    // ── Subscription ────────────────────────────────────────
    getVendorSubscription: builder.query({
      query: () => '/subscription?role=vendor',
      providesTags: ['Subscription'],
    }),
    getSubscriptionPlans: builder.query({
      query: (params = {}) => ({ url: '/subscription/plans', params: { role: 'vendor', ...params } }),
      providesTags: ['Subscription', 'SubscriptionPlans'],
    }),
    changeSubscription: builder.mutation({
      query: (body) => ({ url: '/subscription/change', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'User'],
    }),
    purchaseSubscriptionRazorpay: builder.mutation({
      query: (body) => ({ url: '/subscription/purchase-razorpay', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'User'],
    }),
  }),
});

export const {
  useGetVendorDashboardQuery,
  useGetVendorListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useToggleListingVisibilityMutation,
  useDuplicateListingMutation,
  useBulkUpdateListingsMutation,
  useGetListingAnalyticsQuery,
  useUpdateListingStockMutation,
  useGetVendorOffersQuery,
  useCreateVendorOfferMutation,
  useUpdateVendorOfferMutation,
  useDeleteVendorOfferMutation,
  useDuplicateVendorOfferMutation,
  useToggleOfferStatusMutation,
  useGetVendorReelsQuery,
  useCreateReelMutation,
  useDeleteReelMutation,
  // NOTE: Boost hooks removed
  useGetVendorLeadsQuery,
  useReplyToLeadMutation,
  useGetVendorOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetVendorAnalyticsQuery,
  useGetVendorAnalyticsOverviewQuery,
  useGetVendorAnalyticsListingsQuery,
  useGetVendorAnalyticsTimeseriesQuery,
  useGetVendorAnalyticsBoostRoiQuery,
  useSimulateVendorAnalyticsMutation,
  useGetVendorReviewsQuery,
  useReplyToReviewMutation,
  useGetVendorWalletQuery,
  useGetWalletTransactionsQuery,
  useRechargeWalletMutation,
  useGetVendorSubscriptionQuery,
  useGetSubscriptionPlansQuery,
  useChangeSubscriptionMutation,
  usePurchaseSubscriptionRazorpayMutation,
} = vendorApi;

export default vendorApi;
