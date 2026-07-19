import apiSlice from '../../api/apiSlice';

/**
 * Creator API Slice
 * Injects RTK Query endpoints for creator-specific features.
 * All query hooks support pollingInterval for real-time data.
 */
const creatorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Dashboard Overview ─────────────────────────────────
    getCreatorDashboard: builder.query({
      query: () => '/creator/dashboard',
      providesTags: ['CreatorDashboard'],
    }),

    // ── Portfolio ───────────────────────────────────────────
    getCreatorPortfolio: builder.query({
      query: () => '/creator/portfolio',
      providesTags: ['CreatorPortfolio'],
    }),
    uploadPortfolioReel: builder.mutation({
      query: (body) => ({ url: '/creator/portfolio/reels', method: 'POST', body }),
      invalidatesTags: ['CreatorPortfolio'],
    }),
    uploadPortfolioImage: builder.mutation({
      query: (body) => ({ url: '/creator/portfolio/images', method: 'POST', body }),
      invalidatesTags: ['CreatorPortfolio'],
    }),
    deletePortfolioItem: builder.mutation({
      query: ({ type, id }) => ({ url: `/creator/portfolio/${type}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CreatorPortfolio'],
    }),

    // ── Pricing ─────────────────────────────────────────────
    getCreatorPricing: builder.query({
      query: () => '/creator/pricing',
      providesTags: ['CreatorPricing'],
    }),
    updateCreatorPricing: builder.mutation({
      query: (body) => ({ url: '/creator/pricing', method: 'PATCH', body }),
      invalidatesTags: ['CreatorPricing'],
    }),

    // ── Availability ────────────────────────────────────────
    getCreatorAvailability: builder.query({
      query: () => '/creator/availability',
      providesTags: ['CreatorAvailability'],
    }),
    updateCreatorAvailability: builder.mutation({
      query: (body) => ({ url: '/creator/availability', method: 'PATCH', body }),
      invalidatesTags: ['CreatorAvailability', 'User'],
    }),

    // ── Orders / Projects ───────────────────────────────────
    getCreatorOrders: builder.query({
      query: (params = {}) => ({ url: '/creator/orders', params }),
      providesTags: ['CreatorOrders'],
    }),
    updateCreatorOrderStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/creator/orders/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['CreatorOrders', 'CreatorDashboard'],
    }),

    // ── Wallet / Earnings ───────────────────────────────────
    getCreatorWallet: builder.query({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),
    getCreatorTransactions: builder.query({
      query: (params = {}) => ({ url: '/wallet/transactions', params }),
      providesTags: ['Wallet'],
    }),
    requestPayout: builder.mutation({
      query: (body) => ({ url: '/wallet/payout', method: 'POST', body }),
      invalidatesTags: ['Wallet'],
    }),

    // ── Subscription ────────────────────────────────────────
    getCreatorSubscription: builder.query({
      query: () => '/subscription',
      providesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetCreatorDashboardQuery,
  useGetCreatorPortfolioQuery,
  useUploadPortfolioReelMutation,
  useUploadPortfolioImageMutation,
  useDeletePortfolioItemMutation,
  useGetCreatorPricingQuery,
  useUpdateCreatorPricingMutation,
  useGetCreatorAvailabilityQuery,
  useUpdateCreatorAvailabilityMutation,
  useGetCreatorOrdersQuery,
  useUpdateCreatorOrderStatusMutation,
  useGetCreatorWalletQuery,
  useGetCreatorTransactionsQuery,
  useRequestPayoutMutation,
  useGetCreatorSubscriptionQuery,
} = creatorApi;

export default creatorApi;
