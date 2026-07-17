import apiSlice from '../../api/apiSlice';

/**
 * Live Streaming API Slice
 * Manages live stream rooms initialization, listings, comments tickers, and view registers.
 */
const liveApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch active stream directory lists
    getActiveStreams: builder.query({
      query: () => '/live',
      providesTags: ['Reels'],
    }),

    // Start stream session
    startStream: builder.mutation({
      query: (data) => ({
        url: '/live',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reels'],
    }),

    // End stream session
    endStream: builder.mutation({
      query: (id) => ({
        url: `/live/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: ['Reels'],
    }),

    // Join stream viewer counts
    joinStream: builder.mutation({
      query: (id) => ({
        url: `/live/${id}/join`,
        method: 'POST',
      }),
    }),

    // Leave stream viewer counts
    leaveStream: builder.mutation({
      query: (id) => ({
        url: `/live/${id}/leave`,
        method: 'POST',
      }),
    }),

    // Send like pulse trigger
    likeStream: builder.mutation({
      query: (id) => ({
        url: `/live/${id}/like`,
        method: 'POST',
      }),
    }),

    // Send stream chat comment message
    sendStreamComment: builder.mutation({
      query: ({ id, text }) => ({
        url: `/live/${id}/comment`,
        method: 'POST',
        body: { text },
      }),
    }),
  }),
});

export const {
  useGetActiveStreamsQuery,
  useStartStreamMutation,
  useEndStreamMutation,
  useJoinStreamMutation,
  useLeaveStreamMutation,
  useLikeStreamMutation,
  useSendStreamCommentMutation,
} = liveApi;

export default liveApi;
