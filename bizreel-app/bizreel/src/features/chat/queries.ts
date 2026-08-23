import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchConversations, fetchMessages, sendMessage } from './api';

export const CHAT_QUERY_KEY = ['chat', 'conversations'] as const;

export function useConversations() {
  return useQuery({
    queryKey: CHAT_QUERY_KEY,
    queryFn: fetchConversations,
    refetchInterval: 5000, // 5s auto polling for live messages
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => (conversationId ? fetchMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    refetchInterval: 3000, // 3s polling for real-time thread messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
    },
  });
}
