import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '@/src/components/GlassCard';
import { dealApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

const STATUS_COLORS: Record<string, string> = {
  negotiating: '#eab308',
  accepted: '#22c55e',
  rejected: '#ef4444',
  completed: '#3b82f6',
  cancelled: '#6b7280',
  expired: '#6b7280',
};

export default function Deals() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await dealApi.mine();
      setDeals(data.items || data.deals || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Deals</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color="#ec4899" size="large" /></View>
      ) : deals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>No deals yet</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#ec4899" />}
        >
          {deals.map(d => (
            <GlassCard key={d.id} style={styles.dealCard}>
              <View style={styles.dealRow}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[d.status] || '#6b7280' }]} />
                <Text style={styles.dealStatus}>{d.status}</Text>
                <Text style={styles.dealAmount}>₹{new Intl.NumberFormat('en-IN').format(d.current_amount || d.initial_offer || 0)}</Text>
              </View>
              {d.note && <Text style={styles.dealNote} numberOfLines={2}>{d.note}</Text>}
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  scrollContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  dealCard: { padding: 16 },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { height: 8, width: 8, borderRadius: 4 },
  dealStatus: { fontSize: 13, fontWeight: '600', color: '#fff', textTransform: 'capitalize', flex: 1 },
  dealAmount: { fontSize: 16, fontWeight: '700', color: '#fff' },
  dealNote: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
});
