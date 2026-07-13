import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListingCard from '@/src/components/ListingCard';
import { categoryApi, listingApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function BrowseCategory() {
  const { categorySlug } = useLocalSearchParams<{ categorySlug: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<any>(null);
  const [subCats, setSubCats] = useState<any[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.bySlug(categorySlug!).then(({ data }) => {
      setCategory(data);
      setSubCats(data.children || []);
    }).catch(() => {});
  }, [categorySlug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    const params: any = { limit: 24, category_id: category.id };
    if (activeSubId) params.sub_category_id = activeSubId;
    listingApi.list(params).then(({ data }) => {
      setItems(data.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [category?.id, activeSubId]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.title}>{category?.name || 'Category'}</Text>
      </View>

      {subCats.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subRow} testID="sub-category-chips">
          <TouchableOpacity testID="sub-chip-all" onPress={() => setActiveSubId(null)} style={[styles.subChip, !activeSubId && styles.subChipActive]}>
            <Text style={[styles.subChipText, !activeSubId && styles.subChipTextActive]}>All</Text>
          </TouchableOpacity>
          {subCats.map(s => (
            <TouchableOpacity key={s.id} testID={`sub-chip-${s.slug}`} onPress={() => setActiveSubId(s.id === activeSubId ? null : s.id)} style={[styles.subChip, s.id === activeSubId && styles.subChipActive]}>
              <Text style={[styles.subChipText, s.id === activeSubId && styles.subChipTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color="#ec4899" style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No listings in this category</Text>
          </View>
        ) : (
          <View style={styles.grid}>
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
  subRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  subChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  subChipActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  subChipText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  subChipTextActive: { color: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
