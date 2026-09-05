import apiSlice from '../../api/apiSlice';

/**
 * Chat API Slice
 * Manages queries and updates for real-time customer and vendor chat.
 */
const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Retrieve conversations list (role-scoped)
    getConversations: builder.query({
      query: (arg) => {
        const role = typeof arg === 'string' ? arg : arg?.role;
        return role ? `/chat/conversations?role=${role}` : '/chat/conversations';
      },
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

    // Clear chat history
    clearChat: builder.mutation({
      query: (conversationId) => ({
        url: `/chat/${conversationId}/clear`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Delete entire conversation
    deleteConversation: builder.mutation({
      query: (conversationId) => ({
        url: `/chat/${conversationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Delete message for me
    deleteMessageForMe: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}/me`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),

    // Delete message for everyone
    deleteMessageForEveryone: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}/everyone`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useClearChatMutation,
  useDeleteConversationMutation,
  useDeleteMessageForMeMutation,
  useDeleteMessageForEveryoneMutation,
} = chatApi;

export default chatApi;
