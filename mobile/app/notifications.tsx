import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '@/src/components/GlassCard';
import { notifApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await notifApi.list({ limit: 50 });
      setItems(data.items || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const readAll = async () => {
    try { await notifApi.readAll(); load(); } catch {}
  };

  const renderItem = ({ item: n }: { item: any }) => (
    <TouchableOpacity
      testID={`notif-${n.id}`}
      onPress={() => { notifApi.read(n.id).catch(() => {}); if (n.action_url) router.push(n.action_url as any); }}
      activeOpacity={0.7}
    >
      <GlassCard style={[styles.notifCard, !n.is_read && styles.notifUnread]}>
        <View style={[styles.notifIcon, !n.is_read ? styles.notifIconActive : styles.notifIconRead]}>
          <Ionicons name="notifications" size={16} color="#fff" />
        </View>
        <View style={styles.notifBody}>
          <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
          {n.body && <Text style={styles.notifText} numberOfLines={2}>{n.body}</Text>}
          <Text style={styles.notifType}>{(n.type || '').replace(/_/g, ' ')}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity testID="read-all-btn" onPress={readAll} style={styles.readAllBtn}>
          <Ionicons name="checkmark-done" size={16} color="#fff" />
          <Text style={styles.readAllText}>Read all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color="#ec4899" size="large" /></View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap} testID="notifs-empty">
          <Ionicons name="notifications-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>All caught up!</Text>
        </View>
      ) : (
        <FlatList
          testID="notifs-list"
          data={items}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#ec4899" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#fff' },
  readAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  readAllText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, marginBottom: 0 },
  notifUnread: { borderColor: 'rgba(236,72,153,0.4)' },
  notifIcon: { height: 36, width: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifIconActive: { backgroundColor: '#a855f7' },
  notifIconRead: { backgroundColor: 'rgba(255,255,255,0.1)' },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  notifText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 17 },
  notifType: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'capitalize' },
});
