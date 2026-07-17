import apiSlice from '../../api/apiSlice';

/**
 * Creator Marketplace API Slice
 * Manages creator listings search and hire contracts proposal flows.
 */
const marketplaceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Search creators lists
    searchCreators: builder.query({
      query: (params) => ({
        url: '/listings', // Reuses the unified listings query or users search
        params: { ...params, type: 'creator' }, // Mapped internally or queried via general listings
      }),
      providesTags: ['Creators'],
    }),

    // Retrieve active hire requests (contracts logs)
    getHireRequests: builder.query({
      query: (role) => `/hires?role=${role}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.hireRequests.map(({ _id }) => ({ type: 'Orders', id: _id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    // Vendor proposes campaign collaboration contract
    proposeHire: builder.mutation({
      query: (data) => ({
        url: '/hires',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }, 'User'],
    }),

    // Creator accepts/rejects OR Vendor completes and pays
    updateHireStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/hires/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Orders', id },
        { type: 'Orders', id: 'LIST' },
        'User', // Wallet balance update reload
      ],
    }),
  }),
});

export const {
  useSearchCreatorsQuery,
  useGetHireRequestsQuery,
  useProposeHireMutation,
  useUpdateHireStatusMutation,
} = marketplaceApi;

export default marketplaceApi;
