import apiSlice from '../../api/apiSlice';

/**
 * Activities API Slice
 * Handles client endpoint logic for saved listings, followings, orders, and inquiries.
 */
const activitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Orders ───────────────────────────────────────────
    getOrders: builder.query({
      query: (params = {}) => ({
        url: '/orders',
        params: { role: 'customer', ...params },
      }),
      providesTags: ['Orders'],
    }),
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Orders', 'User'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Orders'],
    }),

    // ── Inquiries ────────────────────────────────────────
    getInquiries: builder.query({
      query: (params = {}) => ({
        url: '/inquiries',
        params: { role: 'customer', ...params },
      }),
      providesTags: ['Chat', 'Inquiries'],
    }),
    createInquiry: builder.mutation({
      query: (data) => ({
        url: '/inquiries',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
    }),
    closeInquiry: builder.mutation({
      query: (id) => ({
        url: `/inquiries/${id}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Chat'],
    }),
    deleteInquiry: builder.mutation({
      query: (id) => ({
        url: `/inquiries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    // ── Save / Unsave Listing ────────────────────────────
    saveListing: builder.mutation({
      query: (id) => ({
        url: `/listings/${id}/save`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    unsaveListing: builder.mutation({
      query: (id) => ({
        url: `/listings/${id}/unsave`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // ── Follow / Unfollow User ───────────────────────────
    followUser: builder.mutation({
      query: (id) => ({
        url: `/auth/users/${id}/follow`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    unfollowUser: builder.mutation({
      query: (id) => ({
        url: `/auth/users/${id}/unfollow`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    // ── Saved Listings ───────────────────────────────────
    getSavedListings: builder.query({
      query: (params) => ({
        url: '/users/me/saved',
        params,
      }),
      providesTags: ['User', 'Products'],
    }),

    // ── Quotes ────────────────────────────────────────────
    getQuotes: builder.query({
      query: (params) => ({
        url: '/requirements/quotes',
        params,
      }),
      providesTags: ['Requirements'],
    }),
    updateQuoteStatus: builder.mutation({
      query: ({ quoteId, status }) => ({
        url: `/requirements/quotes/${quoteId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Requirements'],
    }),

    // ── Followings ────────────────────────────────────────
    getFollowing: builder.query({
      query: (params) => ({
        url: '/follows/me/following',
        params,
      }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useGetInquiriesQuery,
  useCreateInquiryMutation,
  useCloseInquiryMutation,
  useDeleteInquiryMutation,
  useSaveListingMutation,
  useUnsaveListingMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetSavedListingsQuery,
  useGetQuotesQuery,
  useUpdateQuoteStatusMutation,
  useGetFollowingQuery,
} = activitiesApi;

export default activitiesApi;
