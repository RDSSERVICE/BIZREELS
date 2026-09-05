/**
 * Vendor Analytics & Specific Product Insights Screen — Mobile Application
 * Displays specific product performance metrics when clicked from listing catalog.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function VendorAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { listingId, title, price, views, likes, orders } = useLocalSearchParams<any>();

  const isSpecificProduct = !!listingId;

  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (isSpecificProduct) {
      api.get(`/listings/${listingId}/analytics`)
        .then(({ data }) => setLiveData(data?.data || data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      Promise.all([
        api.get('/vendor/analytics/overview?range=30d').catch(() => ({ data: {} })),
        api.get('/analytics/vendor').catch(() => ({ data: {} })),
      ])
        .then(([overviewRes, leadsRes]) => {
          const overview = overviewRes.data?.data || overviewRes.data || {};
          const leads = leadsRes.data?.data || leadsRes.data || {};
          setLiveData({ ...overview, ...leads });
        })
        .finally(() => setLoading(false));
    }
  }, [listingId]);

  const productTitle = title || 'Product Performance';
  const productPrice = price ? `₹${parseFloat(price).toLocaleString('en-IN')}` : '₹0';

  const kpis = liveData?.kpis || liveData || {};
  const totalViews = kpis?.views ?? liveData?.totalViews ?? (views ? parseInt(views, 10) : 0);
  const totalLikes = kpis?.saves ?? liveData?.likes ?? (likes ? parseInt(likes, 10) : 0);
  const totalOrders = kpis?.total_orders ?? kpis?.deals_started ?? liveData?.ordersCount ?? (orders ? parseInt(orders, 10) : 0);
  const rawRevenue = kpis?.total_revenue ?? kpis?.revenue ?? liveData?.revenue ?? (orders && price ? parseInt(orders, 10) * parseFloat(price) : 0);
  const totalRevenue = `₹${rawRevenue.toLocaleString('en-IN')}`;

  const viewToCartRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : '0.0';
  const likeEngagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSpecificProduct ? 'Product Analytics' : 'Store Analytics & Insights'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Specific Product Banner Card */}
        {isSpecificProduct ? (
          <View style={styles.productBannerCard}>
            <View style={styles.bannerHeaderRow}>
              <View style={styles.itemBadge}>
                <Ionicons name="cube" size={14} color="#fff" />
                <Text style={styles.itemBadgeText}>SPECIFIC ITEM PERFORMANCE</Text>
              </View>
              <Text style={styles.productPriceText}>{productPrice}</Text>
            </View>

            <Text style={styles.productTitleText} numberOfLines={2}>
              {productTitle}
            </Text>

            <Text style={styles.productIdText}>Listing ID: {listingId}</Text>
          </View>
        ) : (
          <View style={styles.storeBannerCard}>
            <Text style={styles.storeBannerTitle}>🏪 Overall Store Performance</Text>
            <Text style={styles.storeBannerSub}>Aggregated analytics for all active products, services & video reels.</Text>
          </View>
        )}

        {/* ── 4 Main Metrics Grid ── */}
        <Text style={styles.sectionHeaderTitle}>PERFORMANCE METRICS</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Ionicons name="eye-outline" size={18} color="#38BDF8" />
            </View>
            <Text style={styles.statLabel}>Total Impressions & Views</Text>
            <Text style={styles.statValue}>{totalViews.toLocaleString('en-IN')}</Text>
            <Text style={styles.statSub}>+18% view growth</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(236,72,153,0.15)' }]}>
              <Ionicons name="heart-outline" size={18} color="#EC4899" />
            </View>
            <Text style={styles.statLabel}>Wishlist & Favorites</Text>
            <Text style={styles.statValue}>{totalLikes.toLocaleString('en-IN')}</Text>
            <Text style={styles.statSub}>{likeEngagementRate}% engagement</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Ionicons name="cart-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.statLabel}>Orders & Inquiries</Text>
            <Text style={styles.statValue}>{totalOrders.toLocaleString('en-IN')}</Text>
            <Text style={styles.statSub}>{viewToCartRate}% conversion rate</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
              <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statLabel}>Generated Revenue</Text>
            <Text style={styles.statValue}>{totalRevenue}</Text>
            <Text style={styles.statSub}>Direct store sales</Text>
          </View>
        </View>

        {/* ── Conversion Funnel Breakdown ── */}
        <View style={styles.funnelCard}>
          <Text style={styles.funnelTitle}>📊 Conversion Breakdown</Text>

          <View style={styles.funnelRow}>
            <Text style={styles.funnelLabel}>Impression to Click Rate</Text>
            <Text style={styles.funnelValue}>8.4%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '42%', backgroundColor: '#38BDF8' }]} />
          </View>

          <View style={styles.funnelRow}>
            <Text style={styles.funnelLabel}>Click to Cart / Order Rate</Text>
            <Text style={styles.funnelValue}>{viewToCartRate}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(parseFloat(viewToCartRate) * 5, 100)}%`, backgroundColor: '#10B981' }]} />
          </View>
        </View>

        {/* Action Button to Boost Listing */}
        {isSpecificProduct && (
          <TouchableOpacity
            style={styles.boostBtn}
            onPress={() => router.push('/vendor/reels/create' as any)}>
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.boostBtnText}>🚀 Boost & Create AI Video Reel for this Product</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
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
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  scrollContent: { padding: Spacing.four, gap: Spacing.four },

  productBannerCard: {
    backgroundColor: '#1a1c24',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  itemBadgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold },
  productPriceText: { color: '#10B981', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  productTitleText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  productIdText: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },

  storeBannerCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  storeBannerTitle: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  storeBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },

  sectionHeaderTitle: { color: '#D97706', fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  statCard: {
    width: '47%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56,189,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: FontWeight.bold },
  statValue: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
  statSub: { color: BrandColors.primaryLight, fontSize: 10, fontWeight: FontWeight.bold },

  funnelCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  funnelTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  funnelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  funnelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  funnelValue: { color: BrandColors.primaryLight, fontSize: 11, fontWeight: FontWeight.bold },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#2c2c2e', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    marginTop: Spacing.two,
  },
  boostBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
