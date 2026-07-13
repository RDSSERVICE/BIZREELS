import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TrustBadge from '@/src/components/TrustBadge';
import { chatApi, dealApi } from '@/src/lib/api';
import { getSocket, getSocketSync } from '@/src/lib/socket';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

export default function ChatThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<any>(null);
  const lastTypingEmit = useRef(0);

  useEffect(() => {
    let alive = true;
    // Load thread + initial messages
    chatApi.getThread(threadId!).then(({ data }) => { if (alive) setThread(data); }).catch(() => router.back());
    chatApi.messages(threadId!, { limit: 100 }).then(({ data }) => {
      if (!alive) return;
      setMsgs([...(data.items || [])].reverse());
    });
    chatApi.read(threadId!).catch(() => {});

    // Socket setup
    let socketCleanup: (() => void) | null = null;
    (async () => {
      const s = await getSocket();
      if (!s || !alive) return;
      s.emit('thread:join', { thread_id: threadId });

      const onNew = (m: any) => {
        if (m.thread_id === threadId) {
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          if (m.receiver_id === user?.id) chatApi.read(threadId!).catch(() => {});
        }
      };
      const onRead = (evt: any) => {
        if (evt.thread_id === threadId) {
          setMsgs((prev) => prev.map((m) =>
            m.receiver_id === evt.reader_id ? { ...m, read_at: evt.read_at } : m
          ));
        }
      };
      const onTyping = (evt: any) => {
        if (evt.thread_id === threadId && evt.user_id !== user?.id) {
          setTyping(evt.is_typing);
          if (evt.is_typing) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setTyping(false), 3000);
          }
        }
      };

      s.on('message:new', onNew);
      s.on('message:read', onRead);
      s.on('thread:typing', onTyping);

      socketCleanup = () => {
        s.emit('thread:leave', { thread_id: threadId });
        s.off('message:new', onNew);
        s.off('message:read', onRead);
        s.off('thread:typing', onTyping);
      };
    })();

    return () => {
      alive = false;
      socketCleanup?.();
      clearTimeout(typingTimerRef.current);
    };
  }, [threadId, user?.id]);

  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmit.current < 2000) return;
    lastTypingEmit.current = now;
    const s = getSocketSync();
    if (s) s.emit('typing', { thread_id: threadId, is_typing: true });
  }, [threadId]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      await chatApi.send(threadId!, { type: 'text', text: t });
      // Socket will echo via message:new
    } catch {
      Alert.alert('Error', 'Failed to send');
    }
  };

  const sendOffer = async () => {
    const amt = Number(offer);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter valid amount'); return; }
    try {
      await dealApi.create({ thread_id: threadId, initial_offer: amt, note: `Offer: ₹${amt.toLocaleString('en-IN')}` });
      setOffer('');
      setOfferOpen(false);
      Alert.alert('Sent', 'Offer sent');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed');
    }
  };

  const peer = thread?.peer;

  const renderMessage = ({ item: m }: { item: any }) => {
    const mine = m.sender_id === user?.id;
    const isSystem = m.type === 'system';
    const isQuote = m.type === 'quote';

    if (isSystem) {
      return (
        <View style={styles.systemMsg} testID={`msg-${m.id}`}>
          <Text style={styles.systemText}>{m.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowOther]} testID={`msg-${m.id}`}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          {mine ? (
            <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleMineGrad}>
              {isQuote ? (
                <View>
                  <Text style={styles.quoteLabel}>Offer</Text>
                  <Text style={styles.quoteAmount}>₹{new Intl.NumberFormat('en-IN').format(m.quote?.amount || 0)}</Text>
                  {m.quote?.note && <Text style={styles.quoteNote}>{m.quote.note}</Text>}
                </View>
              ) : (
                <Text style={styles.msgText}>{m.text}</Text>
              )}
              <View style={styles.tickRow}>
                {m.read_at ? (
                  <Ionicons testID={`read-tick-${m.id}`} name="checkmark-done" size={12} color="#93c5fd" />
                ) : m.delivered_at ? (
                  <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.8)" />
                ) : (
                  <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.8)" />
                )}
              </View>
            </LinearGradient>
          ) : (
            <>
              {isQuote ? (
                <View>
                  <Text style={[styles.quoteLabel, { color: 'rgba(255,255,255,0.6)' }]}>Offer</Text>
                  <Text style={[styles.quoteAmount, { color: '#fff' }]}>₹{new Intl.NumberFormat('en-IN').format(m.quote?.amount || 0)}</Text>
                  {m.quote?.note && <Text style={[styles.quoteNote, { color: 'rgba(255,255,255,0.7)' }]}>{m.quote.note}</Text>}
                </View>
              ) : (
                <Text style={[styles.msgText, { color: '#fff' }]}>{m.text}</Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header} testID="chat-header">
        <TouchableOpacity testID="chat-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>{peer?.name || 'Chat'}</Text>
            {peer?.is_verified && <Ionicons name="checkmark-circle" size={14} color="#3b82f6" testID="verified-badge" />}
            {peer?.trust_score != null && <TrustBadge score={peer.trust_score} tier={peer.trust_tier} size="xs" />}
          </View>
          <Text style={styles.headerSub}>{typing ? 'typing...' : (thread?.thread_type || '')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={0}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          testID="chat-messages"
          data={msgs}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={typing ? <Text testID="typing-indicator" style={styles.typingText}>typing...</Text> : null}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity testID="send-offer-btn" onPress={() => setOfferOpen(true)} style={styles.offerBtn}>
            <Text style={styles.offerBtnText}>₹</Text>
          </TouchableOpacity>
          <TextInput
            testID="message-input"
            style={styles.msgInput}
            value={text}
            onChangeText={(t) => { setText(t); emitTyping(); }}
            placeholder="Message..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity testID="send-btn" onPress={send} style={styles.sendBtn}>
            <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.sendBtnGrad}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Offer modal */}
      <Modal visible={offerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send an offer</Text>
            <TextInput
              testID="offer-amount-input"
              style={styles.modalInput}
              value={offer}
              onChangeText={(t) => setOffer(t.replace(/\D/g, ''))}
              placeholder="Amount in ₹"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity testID="offer-submit-btn" onPress={sendOffer}>
              <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.modalGradBtn}>
                <Text style={styles.modalGradBtnText}>Send offer</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOfferOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { height: 36, width: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff', flexShrink: 1 },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  msgList: { paddingHorizontal: 16, paddingVertical: 8, flexGrow: 1 },
  msgRow: { marginVertical: 2 },
  msgRowMine: { alignItems: 'flex-end' },
  msgRowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 16, overflow: 'hidden' },
  bubbleMine: {},
  bubbleMineGrad: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  quoteLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  quoteAmount: { fontSize: 18, fontWeight: '700', color: '#fff' },
  quoteNote: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  tickRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  systemMsg: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  typingText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', paddingHorizontal: 4, paddingVertical: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  offerBtn: {
    height: 44, width: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  offerBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  msgInput: {
    flex: 1, height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 14,
  },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendBtnGrad: { height: 44, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: borderRadius.xl, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalInput: {
    height: 48, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 16,
  },
  modalGradBtn: { height: 48, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  modalGradBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});
