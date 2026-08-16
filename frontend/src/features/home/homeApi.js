import apiSlice from '../../api/apiSlice';

/**
 * Home API Slice
 * Injects RTK Query endpoint for fetching dynamic homepage feeds, trending items, and stats.
 */
export const homeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHomeTrendingFeed: builder.query({
      query: () => '/feed/home-trending',
      providesTags: ['HomeFeed'],
    }),
  }),
});

export const { useGetHomeTrendingFeedQuery } = homeApi;
