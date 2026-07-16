import apiSlice from '../../api/apiSlice';

/**
 * Reels API Endpoints
 * RTK Query integrations for Reels catalog feed, liking, and commenting.
 */
const reelsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Get Feed ──────────────────────────────────────────
    getReelsFeed: builder.query({
      query: (params) => ({
        url: '/reels',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Reels', id: _id })),
              { type: 'Reels', id: 'FEED' },
            ]
          : [{ type: 'Reels', id: 'FEED' }],
    }),

    // ── Publish Reel (Multipart/form-data) ────────────────
    publishReel: builder.mutation({
      query: (formData) => ({
        url: '/reels',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Reels', id: 'FEED' }],
    }),

    // ── Toggle Like ───────────────────────────────────────
    toggleLikeReel: builder.mutation({
      query: (id) => ({
        url: `/reels/${id}/like`,
        method: 'POST',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistic update of like status on feed
        const patchResult = dispatch(
          reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
            const reel = draft.data.find((r) => r._id === id);
            if (reel) {
              if (reel.hasLiked) {
                reel.likesCount = Math.max(0, reel.likesCount - 1);
                reel.hasLiked = false;
              } else {
                reel.likesCount += 1;
                reel.hasLiked = true;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // ── Register View Count ───────────────────────────────
    viewReel: builder.mutation({
      query: (id) => ({
        url: `/reels/${id}/view`,
        method: 'POST',
      }),
    }),

    // ── Comments ──────────────────────────────────────────
    getReelComments: builder.query({
      query: ({ reelId, page = 1, limit = 15 }) => `/reels/${reelId}/comments?page=${page}&limit=${limit}`,
      providesTags: (result, error, { reelId }) => [{ type: 'Reels', id: `COMMENTS-${reelId}` }],
    }),

    postComment: builder.mutation({
      query: ({ reelId, content }) => ({
        url: `/reels/${reelId}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { reelId }) => [{ type: 'Reels', id: `COMMENTS-${reelId}` }],
      async onQueryStarted({ reelId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Increment comment count locally on feed item
          dispatch(
            reelsApi.util.updateQueryData('getReelsFeed', undefined, (draft) => {
              const reel = draft.data.find((r) => r._id === reelId);
              if (reel) reel.commentsCount += 1;
            })
          );
        } catch {}
      },
    }),

    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/reels/comments/${commentId}`,
        method: 'DELETE',
      }),
      // We invalidate active thread to force reload list
      invalidatesTags: (result, error, { reelId }) => [{ type: 'Reels', id: `COMMENTS-${reelId}` }],
    }),
  }),
});

export const {
  useGetReelsFeedQuery,
  usePublishReelMutation,
  useToggleLikeReelMutation,
  useViewReelMutation,
  useGetReelCommentsQuery,
  usePostCommentMutation,
  useDeleteCommentMutation,
} = reelsApi;

export default reelsApi;
