import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { chatApi, dealApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

export default function ChatThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThread();
    const interval = setInterval(loadMessages, 5000); // poll for new messages
    return () => clearInterval(interval);
  }, [threadId]);

  const loadThread = async () => {
    try {
      const { data } = await chatApi.getThread(threadId!);
      setThread(data);
    } catch { router.back(); }
    loadMessages();
    chatApi.read(threadId!).catch(() => {});
  };

  const loadMessages = async () => {
    try {
      const { data } = await chatApi.messages(threadId!, { limit: 100 });
      setMsgs([...(data.items || [])].reverse());
    } catch {} finally { setLoading(false); }
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      await chatApi.send(threadId!, { type: 'text', text: t });
      loadMessages();
    } catch {
      Alert.alert('Error', 'Failed to send');
    }
  };

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
                </View>
              ) : (
                <Text style={styles.msgText}>{m.text}</Text>
              )}
              <View style={styles.tickRow}>
                {m.read_at ? (
                  <Ionicons testID={`read-tick-${m.id}`} name="checkmark-done" size={12} color="#93c5fd" />
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
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSub}>{thread?.thread_type || '...'}</Text>
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
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            testID="message-input"
            style={styles.msgInput}
            value={text}
            onChangeText={setText}
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
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
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
  tickRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  systemMsg: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.full },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  msgInput: {
    flex: 1, height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 14,
  },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendBtnGrad: { height: 44, width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
