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
import { useChatMessages, useSendMessage } from '@/features/chat/queries';
import { api } from '@/lib/api';

export default function DirectChatThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentUserId = user?._id || (user as any)?.id;

  const { id: conversationIdParam, recipientId: recipientIdParam, name, avatar } = useLocalSearchParams<any>();

  const conversationId = conversationIdParam || null;
  const participantName = name || 'User Chat';
  const participantAvatar = avatar || null;

  const [textInput, setTextInput] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: messages = [], isLoading, refetch } = useChatMessages(conversationId);
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

    if (!recipientIdParam && !conversationId) {
      Alert.alert('Error', 'No recipient specified for message.');
      return;
    }

    const payload = {
      recipientId: recipientIdParam || '',
      text: textInput.trim() || undefined,
      media: attachedMedia || undefined,
    };

    setTextInput('');
    setAttachedMedia(null);

    sendMessageMutation.mutate(payload, {
      onSuccess: () => {
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
          <Ionicons name="arrow-back" size={20} color="#fff" />
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
          <View>
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Active Now • 98% Response Rate</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={refetch}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages Feed */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
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
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.attachmentBtn}
          onPress={pickPhotoMedia}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={BrandColors.primary} />
          ) : (
            <Ionicons name="image-outline" size={22} color={BrandColors.primary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.chatInput}
          placeholder="Type your message here..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={textInput}
          onChangeText={setTextInput}
          multiline
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!textInput.trim() && !attachedMedia) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!textInput.trim() && !attachedMedia}>
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#16171d',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22242e',
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
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  headerName: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesContainer: { padding: Spacing.three, gap: 10 },

  messageBubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },

  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleMe: {
    backgroundColor: BrandColors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#242634',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2f3244',
  },

  mediaImage: {
    width: 180,
    height: 140,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  messageTextMe: { color: '#fff', fontWeight: FontWeight.semibold },
  messageTextOther: { color: '#fff' },

  messageTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
  messageTimeOther: { color: 'rgba(255,255,255,0.4)' },

  attachedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f212b',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#2b2d3b',
  },
  attachedImageThumb: { width: 28, height: 28, borderRadius: 6 },
  attachedText: { flex: 1, color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181920',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#252733',
  },
  attachmentBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#252734',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#242634',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: FontSize.xs,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#333644',
  },
});
