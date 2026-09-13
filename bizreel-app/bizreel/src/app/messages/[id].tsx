/**
 * Direct Chat Thread View Screen — Mobile Application
 * Implements real-time direct messaging between buyers, vendors, and creators.
 */

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useChatMessages, useConversations, useSendMessage } from '@/features/chat/queries';
import { api } from '@/lib/api';

export default function DirectChatThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentUserId = (user?._id || (user as any)?.id)?.toString();

  const { id: conversationIdParam, recipientId: recipientIdParam, name, avatar } = useLocalSearchParams<any>();
  const { data: conversations = [] } = useConversations();

  // Extract raw params
  const rawId = (conversationIdParam || '').toString().trim();
  const rawRecipientId = (recipientIdParam || '').toString().trim();

  // Clean recipient ID (strip prefixes like direct_)
  let cleanRecipientId = rawRecipientId.startsWith('direct_')
    ? rawRecipientId.replace('direct_', '')
    : rawRecipientId;

  if (!cleanRecipientId && rawId.startsWith('direct_')) {
    cleanRecipientId = rawId.replace('direct_', '');
  }

  // Active conversation ID for fetching thread messages
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 1. If rawId is a valid 24-character hex string (and not direct_), check if it matches a conversation ID directly
    if (rawId && !rawId.startsWith('direct_') && rawId.length === 24) {
      const foundByConvId = conversations.find(
        (c) => (c._id || c.id)?.toString() === rawId
      );
      if (foundByConvId) {
        setActiveConversationId((foundByConvId._id || foundByConvId.id)?.toString() || rawId);
        return;
      }
    }

    // 2. Search existing conversations matching cleanRecipientId or rawId
    const targetIdToSearch = cleanRecipientId || (rawId.length === 24 ? rawId : '');
    if (targetIdToSearch) {
      const foundByParticipant = conversations.find((c) =>
        c.participants?.some(
          (p) => (p._id || p.id || (typeof p === 'string' ? p : ''))?.toString() === targetIdToSearch
        )
      );
      if (foundByParticipant) {
        setActiveConversationId((foundByParticipant._id || foundByParticipant.id)?.toString() || null);
        return;
      }
    }

    // 3. Fallback: If rawId looks like a conversation ID (24 hex chars) and cleanRecipientId was separate, set rawId
    if (rawId && !rawId.startsWith('direct_') && rawId.length === 24 && rawId !== cleanRecipientId) {
      setActiveConversationId(rawId);
    }
  }, [rawId, cleanRecipientId, conversations]);

  // Extract final recipient ID for sending
  const targetRecipientId = cleanRecipientId || (rawId !== activeConversationId && rawId.length === 24 ? rawId : '');

  // Extract participant name & avatar fallbacks
  let participantName = name || 'User Chat';
  let participantAvatar = avatar || null;

  if (activeConversationId) {
    const activeConv = conversations.find((c) => (c._id || c.id)?.toString() === activeConversationId);
    if (activeConv && activeConv.participants) {
      const otherParticipant = activeConv.participants.find(
        (p) => (p._id || p.id || (typeof p === 'string' ? p : ''))?.toString() !== currentUserId
      );
      if (otherParticipant && typeof otherParticipant === 'object') {
        if (otherParticipant.name || (otherParticipant as any).shopName || (otherParticipant as any).businessName) {
          participantName = (otherParticipant.name || (otherParticipant as any).shopName || (otherParticipant as any).businessName) as string;
        }
        if (otherParticipant.avatarUrl || (otherParticipant as any).profile_pic) {
          participantAvatar = (otherParticipant.avatarUrl || (otherParticipant as any).profile_pic) as string;
        }
      }
    }
  }

  const [textInput, setTextInput] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: messages = [], isLoading, refetch } = useChatMessages(activeConversationId);
  const sendMessageMutation = useSendMessage();
  const listRef = useRef<FlatList>(null);

  async function pickPhotoMedia() {
    setUploading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'chat-attachment.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);
        formData.append('folder', 'listings/misc');

        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = res.data?.secure_url || res.data?.url || res.data?.path || asset.uri;
        setAttachedMedia(uploadedUrl);
        Alert.alert('Photo Attached!', 'Ready to send in chat.');
      }
    } catch (err: any) {
      Alert.alert('Media Error', err?.message || 'Could not pick image.');
    } finally {
      setUploading(false);
    }
  }

  function handleSend() {
    if (!textInput.trim() && !attachedMedia) return;

    if (!targetRecipientId && !activeConversationId) {
      Alert.alert('Error', 'No recipient specified for message.');
      return;
    }

    const payload = {
      recipientId: targetRecipientId || '',
      text: textInput.trim() || undefined,
      media: attachedMedia || undefined,
    };

    setTextInput('');
    setAttachedMedia(null);

    sendMessageMutation.mutate(payload, {
      onSuccess: (res: any) => {
        const createdConvId = res?.conversation || res?.conversationId || res?.conversation_id;
        if (createdConvId && typeof createdConvId === 'string') {
          setActiveConversationId(createdConvId);
        }
        refetch();
        listRef.current?.scrollToEnd({ animated: true });
      },
      onError: (err: any) => Alert.alert('Delivery Error', err?.message || 'Failed to send message'),
    });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#1E1B18" />
        </TouchableOpacity>

        {/* Participant Header Info */}
        <View style={styles.headerParticipant}>
          {participantAvatar ? (
            <Image source={{ uri: participantAvatar }} style={styles.headerAvatar} contentFit="cover" />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>{participantName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Active Now • Fast Response</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => refetch()}>
          <Ionicons name="refresh" size={18} color="#D99A3D" />
        </TouchableOpacity>
      </View>

      {/* Messages Feed */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D99A3D" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const senderIdStr = typeof item.sender === 'object' ? item.sender?._id || item.sender?.id : item.sender || item.senderId;
            const isMe = senderIdStr === currentUserId;
            const messageText = item.text || item.content || '';
            const mediaUrl = item.media || item.mediaUrl;
            const timeStr = item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View style={[styles.messageBubbleWrapper, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  {mediaUrl && (
                    <Image source={{ uri: mediaUrl }} style={styles.mediaImage} contentFit="cover" />
                  )}

                  {messageText.length > 0 && (
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                      {messageText}
                    </Text>
                  )}

                  <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                    {timeStr} {isMe ? '✓✓' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Attached Media Preview Pill */}
      {attachedMedia && (
        <View style={styles.attachedPreviewRow}>
          <Image source={{ uri: attachedMedia }} style={styles.attachedImageThumb} contentFit="cover" />
          <Text style={styles.attachedText}>Photo attached</Text>
          <TouchableOpacity onPress={() => setAttachedMedia(null)}>
            <Ionicons name="close-circle" size={18} color={BrandColors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Message Input Footer Bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.attachmentBtn}
          onPress={pickPhotoMedia}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#D99A3D" />
          ) : (
            <Ionicons name="image-outline" size={20} color="#D99A3D" />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.chatInput}
          placeholder="Type your message..."
          placeholderTextColor="#6E675F"
          value={textInput}
          onChangeText={setTextInput}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!textInput.trim() && !attachedMedia) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!textInput.trim() && !attachedMedia}>
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#D99A3D" />
          ) : (
            <Ionicons name="send" size={15} color="#D99A3D" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_MATTE = '#F6F4EE';
const CARD_MATTE = '#FBF9F5';
const INSET_MATTE = '#F0EDE4';
const BORDER_MATTE = '#E5E0D4';
const TEXT_MAIN = '#1E1B18';
const TEXT_MUTED = '#6E675F';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_MATTE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: CARD_MATTE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_MATTE,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerParticipant: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ESPRESSO,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: GOLD, fontSize: FontSize.sm, fontWeight: '900' },
  headerName: { color: TEXT_MAIN, fontSize: FontSize.sm, fontWeight: '900' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 9999, backgroundColor: '#10B981' },
  statusText: { color: TEXT_MUTED, fontSize: 10, fontWeight: '600' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesContainer: { padding: Spacing.three, gap: 10 },

  messageBubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },

  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: ESPRESSO,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: CARD_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    borderBottomLeftRadius: 4,
  },

  mediaImage: {
    width: 180,
    height: 140,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  messageTextMe: { color: '#F8FAFC', fontWeight: '600' },
  messageTextOther: { color: TEXT_MAIN, fontWeight: '600' },

  messageTime: {
    fontSize: 9.5,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageTimeMe: { color: GOLD, fontWeight: '700' },
  messageTimeOther: { color: TEXT_MUTED, fontWeight: '600' },

  attachedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_MATTE,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER_MATTE,
  },
  attachedImageThumb: { width: 32, height: 32, borderRadius: 8 },
  attachedText: { flex: 1, color: TEXT_MAIN, fontSize: 11, fontWeight: '700' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_MATTE,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER_MATTE,
  },
  attachmentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: INSET_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: INSET_MATTE,
    color: TEXT_MAIN,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: FontSize.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ESPRESSO,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  sendBtnDisabled: {
    backgroundColor: INSET_MATTE,
    borderColor: BORDER_MATTE,
    opacity: 0.5,
  },
});
