import apiSlice from '../../api/apiSlice';

/**
 * Activities API Slice
 * Handles client endpoint logic for saved listings, followings, orders, and inquiries.
 */
const activitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Orders ───────────────────────────────────────────
    getOrders: builder.query({
      query: () => '/orders',
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

    // ── Inquiries ────────────────────────────────────────
    getInquiries: builder.query({
      query: () => '/inquiries',
      providesTags: ['Chat'],
    }),
    createInquiry: builder.mutation({
      query: (data) => ({
        url: '/inquiries',
        method: 'POST',
        body: data,
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
      query: () => '/users/me/saved',
      providesTags: ['User', 'Products'],
    }),

    // ── Quotes ────────────────────────────────────────────
    getQuotes: builder.query({
      query: () => '/requirements/quotes',
      providesTags: ['Requirements'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useGetInquiriesQuery,
  useCreateInquiryMutation,
  useSaveListingMutation,
  useUnsaveListingMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetSavedListingsQuery,
  useGetQuotesQuery,
} = activitiesApi;

export default activitiesApi;
