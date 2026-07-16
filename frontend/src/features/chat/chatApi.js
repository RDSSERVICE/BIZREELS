import apiSlice from '../../api/apiSlice';

/**
 * Chat API Slice
 * Manages queries and updates for real-time customer and vendor chat.
 */
const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Retrieve conversations list
    getConversations: builder.query({
      query: () => '/chat/conversations',
      providesTags: ['Chat'],
    }),

    // Retrieve specific chat history
    getMessages: builder.query({
      query: ({ conversationId, page = 1, limit = 30 }) =>
        `/chat/${conversationId}/messages?page=${page}&limit=${limit}`,
      providesTags: (result, error, { conversationId }) => [
        { type: 'Chat', id: `MESSAGES-${conversationId}` },
      ],
    }),

    // Post direct message
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/chat/messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Chat'],
      // Optimistic update of chat details is handled inside frontend pages via websocket integration
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;

export default chatApi;
