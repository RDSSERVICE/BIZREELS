import apiSlice from '../../api/apiSlice';

/**
 * Listings API Slice
 * Injects endpoints for products and services catalog discovery.
 */
const listingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Query list of listings
    getListings: builder.query({
      query: (params) => ({
        url: '/listings',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Products', id: _id })),
              { type: 'Products', id: 'LIST' },
              { type: 'Services', id: 'LIST' },
            ]
          : [
              { type: 'Products', id: 'LIST' },
              { type: 'Services', id: 'LIST' },
            ],
    }),

    // Get single listing details
    getListingDetails: builder.query({
      query: (id) => `/listings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Products', id }],
    }),

    // Create listing
    createListing: builder.mutation({
      query: (data) => ({
        url: '/listings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'Products', id: 'LIST' },
        { type: 'Services', id: 'LIST' },
      ],
    }),

    // Update listing
    updateListing: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/listings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Products', id },
        { type: 'Products', id: 'LIST' },
        { type: 'Services', id: 'LIST' },
      ],
    }),

    // Delete listing
    deleteListing: builder.mutation({
      query: (id) => ({
        url: `/listings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Products', id: 'LIST' },
        { type: 'Services', id: 'LIST' },
      ],
    }),

    // Synthesize AI descriptions and tags copy
    generateAICopy: builder.mutation({
      query: (data) => ({
        url: '/listings/ai-copy',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingDetailsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useGenerateAICopyMutation,
} = listingsApi;

export default listingsApi;
