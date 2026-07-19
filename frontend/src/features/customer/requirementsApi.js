import apiSlice from '../../api/apiSlice';

/**
 * Requirements API Slice
 * Handles client endpoint logic for consumer briefs and vendor bidding.
 */
const requirementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Query requirement list (or leads for vendors)
    getRequirements: builder.query({
      query: (params) => ({
        url: '/requirements',
        params,
      }),
      providesTags: (result) => {
        const list = Array.isArray(result?.data?.requirements)
          ? result.data.requirements
          : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.requirements)
          ? result.requirements
          : [];
        return [
          ...list.map((item) => ({ type: 'Requirements', id: item._id || item.id })),
          { type: 'Requirements', id: 'LIST' },
        ];
      },
    }),

    // Get specific details
    getRequirementDetails: builder.query({
      query: (id) => `/requirements/${id}`,
      providesTags: (result, error, id) => [{ type: 'Requirements', id }],
    }),

    // Post new requirement brief
    createRequirement: builder.mutation({
      query: (data) => ({
        url: '/requirements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Requirements', id: 'LIST' }],
    }),

    // Delete requirement brief
    deleteRequirement: builder.mutation({
      query: (id) => ({
        url: `/requirements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Requirements', id: 'LIST' }],
    }),

    // Fetch quotation bids for a specific requirement brief
    getQuotesForRequirement: builder.query({
      query: (requirementId) => `/requirements/${requirementId}/quotes`,
      providesTags: (result, error, requirementId) => [{ type: 'Quotes', id: requirementId }],
    }),

    // Vendor submits new quotation bid
    submitQuote: builder.mutation({
      query: (data) => ({
        url: '/requirements/quotes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { requirementId }) => [
        { type: 'Quotes', id: requirementId },
        { type: 'Requirements', id: 'LIST' },
      ],
    }),

    // Buyer accepts or rejects quote
    updateQuoteStatus: builder.mutation({
      query: ({ quoteId, status }) => ({
        url: `/requirements/quotes/${quoteId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { requirementId }) => [
        { type: 'Quotes', id: requirementId },
        { type: 'Requirements', id: 'LIST' },
        { type: 'User' }, // Wallet adjustment requires refresh of user profile data
      ],
    }),
  }),
});

export const {
  useGetRequirementsQuery,
  useGetRequirementDetailsQuery,
  useCreateRequirementMutation,
  useDeleteRequirementMutation,
  useGetQuotesForRequirementQuery,
  useSubmitQuoteMutation,
  useUpdateQuoteStatusMutation,
} = requirementsApi;

export default requirementsApi;
