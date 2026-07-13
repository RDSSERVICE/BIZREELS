import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import ScreenHeader from '@/src/components/ScreenHeader';
import ListingCard from '@/src/components/ListingCard';
import { interactionApi } from '@/src/lib/api';
import { colors } from '@/src/lib/theme';

export default function Saved() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await interactionApi.mySaved();
      setItems(data.items || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#ec4899" />}
      >
        {loading ? (
          <ActivityIndicator color="#ec4899" style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap} testID="saved-empty">
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyText}>No saved items yet</Text>
          </View>
        ) : (
          <View style={styles.grid} testID="saved-listings">
            {items.map(l => (
              <View key={l.id} style={styles.gridItem}>
                <ListingCard listing={l} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  gridItem: { width: '48%' },
});
