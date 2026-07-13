import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/src/components/ScreenHeader';
import { chatApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

function relTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString();
}

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await chatApi.myThreads();
      setItems(data.items || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user?.id]);

  if (!user) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScreenHeader title="Chats" />
        <View style={styles.emptyWrap}>
          <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyTitle}>Sign in to chat</Text>
          <TouchableOpacity testID="chat-login-btn" onPress={() => router.push('/login')} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderThread = ({ item: t }: { item: any }) => (
    <TouchableOpacity
      testID={`thread-${t.id}`}
      style={styles.thread}
      onPress={() => router.push(`/chat-thread/${t.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(t.peer?.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.threadInfo}>
        <View style={styles.threadRow}>
          <Text style={styles.threadName} numberOfLines={1}>{t.peer?.name || 'Unknown'}</Text>
          <Text style={styles.threadTime}>{relTime(t.last_message?.created_at || t.updated_at)}</Text>
        </View>
        <View style={styles.threadRow}>
          <Text style={styles.threadPreview} numberOfLines={1}>{t.last_message?.text || 'Say hi 👋'}</Text>
          {t.my_unread > 0 && (
            <View style={styles.unreadBadge} testID={`unread-${t.id}`}>
              <Text style={styles.unreadText}>{t.my_unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Chats" subtitle="Your conversations" />
      {loading ? (
        <View style={styles.loadingWrap} testID="chat-loading">
          <ActivityIndicator color="#ec4899" size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap} testID="chat-empty">
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>No conversations yet. Start one from a listing.</Text>
        </View>
      ) : (
        <FlatList
          testID="chat-threads"
          data={items}
          keyExtractor={(t) => t.id}
          renderItem={renderThread}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#ec4899" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  list: { paddingHorizontal: 16 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  loginBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loginBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  thread: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: borderRadius.xl,
  },
  avatar: {
    height: 48, width: 48, borderRadius: 24,
    backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  threadInfo: { flex: 1, gap: 4 },
  threadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  threadName: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  threadTime: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  threadPreview: { fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 },
  unreadBadge: {
    backgroundColor: '#ec4899', height: 20, minWidth: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  unreadText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
