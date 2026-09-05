import { api } from '@/lib/api';

export interface ChatParticipant {
  _id: string;
  id?: string;
  name?: string;
  shopName?: string;
  businessName?: string;
  avatarUrl?: string;
  profile_pic?: string;
  vendorProfile?: { logo?: string };
  roles?: string[];
}

export interface Conversation {
  _id: string;
  id?: string;
  participants: ChatParticipant[];
  lastMessage?: { text?: string; content?: string; createdAt?: string };
  unreadCount?: number;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  sender?: ChatParticipant | string;
  senderId?: string;
  recipient?: ChatParticipant | string;
  recipientId?: string;
  text?: string;
  content?: string;
  media?: string;
  mediaUrl?: string;
  createdAt: string;
  read?: boolean;
}

export async function fetchConversations(role?: string): Promise<Conversation[]> {
  const { data } = await api.get('/chat/conversations' + (role ? `?role=${role}` : ''));
  const list = data.data?.conversations || data.conversations || data.data || (Array.isArray(data) ? data : []);
  return Array.isArray(list) ? list : [];
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await api.get(`/chat/${conversationId}/messages`);
  const list = data.data?.messages || data.messages || data.data || (Array.isArray(data) ? data : []);
  return Array.isArray(list) ? list : [];
}

export async function sendMessage(payload: {
  recipientId: string;
  text?: string;
  media?: string;
}): Promise<ChatMessage> {
  const { data } = await api.post('/chat/messages', payload);
  return data.data?.message || data.message || data.data || data;
}
