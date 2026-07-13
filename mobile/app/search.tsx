import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ListingCard from '@/src/components/ListingCard';
import { searchApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<any>({ listings: [], categories: [] });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q.trim().length >= 2) {
        searchApi.suggest(q).then(({ data }) => setSuggestions(data)).catch(() => {});
      } else {
        setSuggestions({ listings: [], categories: [] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 24, sort: 'recent' };
      if (q.trim()) params.q = q.trim();
      const { data } = await searchApi.search(params);
      setResults(data.items || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="search-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            testID="search-input"
            style={styles.input}
            value={q}
            onChangeText={setQ}
            placeholder="Search listings, vendors..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
            returnKeyType="search"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} style={styles.clearBtn}>
              <Ionicons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions */}
      {q.length >= 2 && (suggestions.listings?.length > 0 || suggestions.categories?.length > 0) && (
        <View style={styles.suggestionsWrap} testID="search-suggestions">
          <Text style={styles.suggestLabel}>SUGGESTIONS</Text>
          {suggestions.listings?.map((s: any) => (
            <TouchableOpacity key={s.slug} testID={`suggest-listing-${s.slug}`} onPress={() => router.push(`/listing/${s.slug}`)} style={styles.suggestRow}>
              <Ionicons name="pricetag-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.suggestText} numberOfLines={1}>{s.title}</Text>
            </TouchableOpacity>
          ))}
          {suggestions.categories?.map((c: any) => (
            <TouchableOpacity key={c.slug} testID={`suggest-category-${c.slug}`} onPress={() => router.push(`/browse/${c.slug}`)} style={styles.suggestRow}>
              <Ionicons name="folder-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.suggestText}>Category · {c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color="#ec4899" style={{ marginTop: 40 }} />
        ) : results.length === 0 ? (
          <View style={styles.emptyWrap} testID="search-empty">
            <Text style={styles.emptyText}>{q ? 'No results found' : 'Start typing to search...'}</Text>
          </View>
        ) : (
          <View style={styles.grid} testID="search-results">
            {results.map((l) => (
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 44, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: '#fff', fontSize: 14 },
  clearBtn: {
    height: 24, width: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  suggestionsWrap: { paddingHorizontal: 16, marginBottom: 8 },
  suggestLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  suggestText: { fontSize: 14, color: '#fff', flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  gridItem: { width: '48%' },
});
