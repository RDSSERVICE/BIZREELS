/**
 * Vendor Analytics & Performance Overview Dashboard.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number;
    totalOrders: number;
    activeListings: number;
    totalViews: number;
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    activeListings: 0,
    totalViews: 0,
  });

  const fetchDashboardStats = async () => {
    try {
      const { data } = await api.get('/analytics/vendor');
      const stats = data.data || data || {};
      setAnalytics({
        totalRevenue: stats.totalRevenue || stats.revenue || 0,
        totalOrders: stats.totalOrders || stats.ordersCount || 0,
        activeListings: stats.activeListings || stats.listingsCount || 0,
        totalViews: stats.totalViews || stats.views || 0,
      });
    } catch (err) {
      console.warn('Analytics fetch error fallback', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Store Dashboard</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }>
          {/* Revenue Card */}
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Store Revenue</Text>
            <Text style={styles.revenueValue}>₹{analytics.totalRevenue.toLocaleString()}</Text>
            <View style={styles.revenueBadge}>
              <Ionicons name="trending-up" size={14} color="#22C55E" />
              <Text style={styles.revenueBadgeText}>Gross Sales Earnings</Text>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.grid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconCircle}>
                <Ionicons name="receipt-outline" size={22} color={BrandColors.primary} />
              </View>
              <Text style={styles.metricValue}>{analytics.totalOrders}</Text>
              <Text style={styles.metricLabel}>Total Orders</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconCircle}>
                <Ionicons name="cube-outline" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.metricValue}>{analytics.activeListings}</Text>
              <Text style={styles.metricLabel}>Catalog Items</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconCircle}>
                <Ionicons name="eye-outline" size={22} color="#EC407A" />
              </View>
              <Text style={styles.metricValue}>{analytics.totalViews}</Text>
              <Text style={styles.metricLabel}>Product Views</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconCircle}>
                <Ionicons name="sparkles-outline" size={22} color="#EAB308" />
              </View>
              <Text style={styles.metricValue}>100%</Text>
              <Text style={styles.metricLabel}>Seller Rating</Text>
            </View>
          </View>

          {/* Quick Management Shortcuts */}
          <Text style={styles.sectionTitle}>Vendor Operations</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/reels' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="videocam" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Video Reels Studio</Text>
              <Text style={styles.actionSub}>Create, publish & boost short video reels</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/listings' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="cube" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Manage Product & Service Catalog</Text>
              <Text style={styles.actionSub}>Add items, update stock, prices and specs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/orders' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(217, 154, 61, 0.15)' }]}>
              <Ionicons name="receipt" size={20} color={BrandColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Customer Orders & Fulfillment</Text>
              <Text style={styles.actionSub}>Track pending orders, update shipping and status</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/offers' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(236, 64, 122, 0.15)' }]}>
              <Ionicons name="pricetag" size={20} color="#EC407A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Promotional Offers & Coupons</Text>
              <Text style={styles.actionSub}>Create discount coupons to boost sales</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/verification' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>KYC Business Verification</Text>
              <Text style={styles.actionSub}>Verify PAN, GSTIN, Bank and payout account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/vendor/settings' as any)}>
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="settings" size={20} color="#A855F7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Store Settings & Operating Schedule</Text>
              <Text style={styles.actionSub}>Business info, address, and close schedule toggle</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  revenueCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.primary + '50',
    gap: Spacing.one,
  },
  revenueLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  revenueValue: {
    color: BrandColors.primaryLight,
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  revenueBadgeText: {
    color: '#22C55E',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.one,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.three,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  actionSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
