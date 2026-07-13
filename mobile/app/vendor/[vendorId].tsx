import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/src/components/GlassCard';
import GradientButton from '@/src/components/GradientButton';
import ListingCard from '@/src/components/ListingCard';
import { vendorApi, followApi, reviewApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

export default function VendorProfile() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<'all' | 'products' | 'services'>('all');

  useEffect(() => {
    Promise.all([
      vendorApi.get(vendorId!),
      vendorApi.listings(vendorId!),
    ]).then(([vRes, lRes]) => {
      setVendor(vRes.data);
      setListings(lRes.data.items || []);
      setFollowing(vRes.data.viewer_state?.following || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [vendorId]);

  const toggleFollow = async () => {
    if (!user) return router.push('/login');
    try {
      if (following) { await followApi.unfollow(vendorId!); setFollowing(false); }
      else { await followApi.follow(vendorId!); setFollowing(true); }
    } catch {}
  };

  const filteredListings = tab === 'all' ? listings :
    tab === 'products' ? listings.filter(l => l.type !== 'service') :
    listings.filter(l => l.type === 'service');

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingWrap}><ActivityIndicator color="#ec4899" size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>Vendor not found</Text>
          <GradientButton title="Go back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile */}
        <View style={styles.profileSection}>
          <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.avatar}>
            <Text style={styles.avatarText}>{(vendor.name || '?').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          {vendor.city && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.cityText}>{vendor.city}</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <StatItem label="Listings" value={vendor.listings_count || listings.length} />
            <StatItem label="Followers" value={vendor.followers_count || 0} />
            <StatItem label="Rating" value={vendor.rating_avg ? vendor.rating_avg.toFixed(1) : '-'} />
          </View>
          {user && user.id !== vendorId && (
            <View style={styles.actionRow}>
              <TouchableOpacity testID="follow-vendor-btn" onPress={toggleFollow} style={[styles.followBtn, following && styles.followBtnActive]}>
                <Text style={styles.followBtnText}>{following ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {vendor.avg_response_time_seconds && (
            <View style={styles.responseBadge} testID="response-time-badge">
              <Ionicons name="time-outline" size={12} color="#4ade80" />
              <Text style={styles.responseText}>
                Typically responds in ~{Math.round(vendor.avg_response_time_seconds / 3600)}h
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['all', 'products', 'services'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listings */}
        <View style={styles.listingsSection}>
          {filteredListings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No listings yet</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredListings.map(l => (
                <View key={l.id} style={styles.gridItem}>
                  <ListingCard listing={l} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 24 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  profileSection: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
  avatar: { height: 80, width: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  vendorName: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 12 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cityText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  statsRow: { flexDirection: 'row', gap: 32, marginTop: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  followBtn: {
    paddingHorizontal: 32, paddingVertical: 10, borderRadius: borderRadius.full,
    backgroundColor: '#ec4899',
  },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  followBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  responseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(74,222,128,0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  responseText: { fontSize: 12, color: '#4ade80' },
  tabs: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 24, gap: 0 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#ec4899' },
  tabText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  listingsSection: { paddingHorizontal: 16, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
