/**
 * Vendor Control Center & Business Dashboard — Mobile Application
 * Complete parity with Web Frontend Dashboard:
 * 1. Vendor Credit Wallet Banner & Breakdown (Available, Deposited, Earned, Used)
 * 2. Control Center Banner with quick CTA buttons (+ Post Reel, + Add Listing)
 * 3. 8 Bento Overview Stat Cards (Products, Services, Reels, Views, Followers, Enquiries, Orders, Revenue)
 * 4. Recent Customer Enquiries Panel (with status tags NEW / REPLIED / CLOSED)
 * 5. Active Subscription & Verification Panel (KYC Badge & Perks)
 * 6. Vendor Operations & Management Shortcuts Grid
 * Updated to Light Theme & Warm Gold Editorial Bento Grid Design System
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { VendorDrawerModal } from '@/components/vendor-drawer-modal';
import { FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Consolidated Dashboard State
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalServices: 0,
    totalReels: 0,
    totalViews: 0,
    followers: 0,
    leadEnquiries: 0,
    totalOrders: 0,
    totalSales: 0,
  });

  const [credits, setCredits] = useState({
    available: 100,
    deposited: 0,
    earned: 100,
    used: 0,
  });

  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, leadsRes, analyticsRes, conversationsRes, walletRes] = await Promise.all([
        api.get('/vendor/analytics/overview?range=30d').catch(() => ({ data: {} })),
        api.get('/inquiries').catch(() => ({ data: {} })),
        api.get('/analytics/vendor-lead-summary').catch(() => ({ data: {} })),
        api.get('/chat/conversations').catch(() => ({ data: {} })),
        api.get('/wallet/balance').catch(() => ({ data: {} })),
      ]);

      const rawOverview = overviewRes.data?.data || overviewRes.data || {};
      const kpis = rawOverview.kpis || {};
      const inquiriesList = leadsRes.data?.data || leadsRes.data || [];
      const leadSummary = analyticsRes.data?.data || analyticsRes.data || {};
      const conversationsList = conversationsRes.data?.data || conversationsRes.data || conversationsRes.data?.conversations || [];
      const conversationsCount = Array.isArray(conversationsList) ? conversationsList.length : 0;
      const walletData = walletRes.data?.data || walletRes.data || {};

      const productsCount = Number(rawOverview.totalProducts ?? kpis.products_total ?? rawOverview.activeListings ?? kpis.listings_active ?? 0);
      const servicesCount = Number(rawOverview.totalServices ?? kpis.services_total ?? 0);
      const reelsCount = Number(rawOverview.totalReels ?? kpis.reels_total ?? rawOverview.reelsStats?.totalReels ?? 0);
      const totalViewsCount = Number(rawOverview.views ?? kpis.views ?? 0);
      const followersCount = Number((user as any)?.followers_count || rawOverview.followers || kpis.followers || (user as any)?.followersCount || 0);
      const enquiriesCount = Math.max(
        Number(leadSummary.inquiriesCount || 0),
        Number(leadSummary.chatsCount || 0),
        Number(leadSummary.chatThreadsCount || 0),
        Number(leadSummary.directInquiriesCount || 0),
        conversationsCount,
        Number(kpis.inquiriesCount || 0),
        Number(rawOverview.leadEnquiries || 0),
        Array.isArray(inquiriesList) ? inquiriesList.length : 0
      );
      const ordersCount = Number(rawOverview.ordersCount ?? kpis.total_orders ?? kpis.ordersCount ?? 0);
      const salesAmount = Number(rawOverview.revenue ?? kpis.total_revenue ?? kpis.revenue ?? 0);

      setMetrics({
        totalProducts: productsCount,
        totalServices: servicesCount,
        totalReels: reelsCount,
        totalViews: totalViewsCount,
        followers: followersCount,
        leadEnquiries: enquiriesCount,
        totalOrders: ordersCount,
        totalSales: salesAmount,
      });

      if (Array.isArray(inquiriesList)) {
        setRecentLeads(inquiriesList.slice(0, 4));
      }

      if (walletData.balance !== undefined) {
        setCredits({
          available: walletData.balance || 100,
          deposited: walletData.deposited || 0,
          earned: walletData.earned || 100,
          used: walletData.used || 0,
        });
      }
    } catch (err) {
      console.warn('Vendor dashboard fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const isKycApproved = (user as any)?.kyc_status === 'approved';

  const bentoStats = [
    { label: 'TOTAL PRODUCTS', value: metrics.totalProducts, icon: 'cube-outline', color: '#2563EB' },
    { label: 'TOTAL SERVICES', value: metrics.totalServices, icon: 'key-outline', color: '#7C3AED' },
    { label: 'TOTAL REELS', value: metrics.totalReels, icon: 'videocam-outline', color: '#DB2777' },
    { label: 'TOTAL VIEWS', value: metrics.totalViews.toLocaleString('en-IN'), icon: 'eye-outline', color: '#D99A3D' },
    { label: 'FOLLOWERS', value: metrics.followers.toLocaleString('en-IN'), icon: 'people-outline', color: '#059669' },
    { label: 'ENQUIRIES', value: metrics.leadEnquiries, icon: 'mail-outline', color: '#0891B2' },
    { label: 'ORDER REQUESTS', value: metrics.totalOrders, icon: 'cart-outline', color: '#4F46E5' },
    { label: 'REVENUE (GROSS)', value: `₹${metrics.totalSales.toLocaleString('en-IN')}`, icon: 'cash-outline', color: '#059669' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center' }}
          onPress={() => router.push('/vendor/profile' as any)}>
          <Text style={styles.headerTitle}>VENDOR CONTROL CENTER</Text>
          <Text style={styles.headerSub}>
            {(user as any)?.vendorProfile?.businessName || user?.name || 'Store Operations'} • Edit Profile ›
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <VendorDrawerModal isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }>
          {/* ── 0. VERIFICATION ALERT BANNER ── */}
          {!isKycApproved && (
            <View style={styles.verifyBanner}>
              <View style={styles.verifyBannerLeft}>
                <Ionicons name="shield-outline" size={18} color="#D99A3D" />
                <Text style={styles.verifyText} numberOfLines={2}>
                  Verify your business to get 5x more leads & maximum buyer trust!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => router.push('/vendor/verification' as any)}>
                <Text style={styles.verifyBtnText}>Verify Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 1. VENDOR CREDIT WALLET BANNER ── */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.walletTitleRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.walletTitle}>VENDOR CREDIT WALLET</Text>
                  <View style={styles.rateBadge}>
                    <Text style={styles.rateBadgeText}>1 Credit = ₹1</Text>
                  </View>
                </View>
                <Text style={styles.walletSubText}>
                  Use credits for listings, video reels, AI boosts & lead unlocks.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.topupBtn}
                onPress={() => router.push('/vendor/wallet' as any)}>
                <Text style={styles.topupBtnText}>+ TOP-UP</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Credit Breakdown 4 Columns */}
            <View style={styles.creditGrid}>
              <View style={styles.creditCell}>
                <Text style={styles.creditCellLabel}>AVAILABLE</Text>
                <Text style={[styles.creditCellValue, { color: '#059669' }]}>{credits.available}</Text>
                <Text style={styles.creditCellSub}>₹{credits.available} Balance</Text>
              </View>

              <View style={styles.creditCell}>
                <Text style={styles.creditCellLabel}>DEPOSITED</Text>
                <Text style={[styles.creditCellValue, { color: '#2563EB' }]}>{credits.deposited}</Text>
                <Text style={styles.creditCellSub}>₹{credits.deposited} Added</Text>
              </View>

              <View style={styles.creditCell}>
                <Text style={styles.creditCellLabel}>EARNED</Text>
                <Text style={[styles.creditCellValue, { color: GOLD }]}>{credits.earned}</Text>
                <Text style={styles.creditCellSub}>Rewards</Text>
              </View>

              <View style={styles.creditCell}>
                <Text style={styles.creditCellLabel}>USED SPENT</Text>
                <Text style={[styles.creditCellValue, { color: TEXT_MUTED }]}>{credits.used}</Text>
                <Text style={styles.creditCellSub}>Credits</Text>
              </View>
            </View>

            {/* Quick Wallet Action Links */}
            <View style={styles.walletActionsRow}>
              <TouchableOpacity
                style={styles.walletActionBtn}
                onPress={() => router.push('/vendor/rates' as any)}>
                <Ionicons name="pricetag-outline" size={14} color={ESPRESSO} />
                <Text style={styles.walletActionBtnText}>Credit Rates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletActionBtn}
                onPress={() => router.push('/vendor/referrals' as any)}>
                <Ionicons name="gift-outline" size={14} color={ESPRESSO} />
                <Text style={styles.walletActionBtnText}>Refer & Earn</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 2. QUICK CTA ACTION BANNER ── */}
          <View style={styles.heroCtaBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroCtaTag}>STORE MANAGEMENT</Text>
              <Text style={styles.heroCtaTitle}>Create & Grow Business</Text>
            </View>

            <View style={styles.heroCtaRow}>
              <TouchableOpacity
                style={styles.ctaYellowBtn}
                onPress={() => router.push('/vendor/reels/create' as any)}>
                <Ionicons name="videocam" size={15} color="#0F172A" />
                <Text style={styles.ctaYellowBtnText}>+ REEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaDarkBtn}
                onPress={() => router.push('/vendor/listings/create' as any)}>
                <Ionicons name="cube-outline" size={15} color={GOLD} />
                <Text style={styles.ctaDarkBtnText}>+ ITEM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ctaDarkBtn}
                onPress={() => router.push('/vendor/offers/create' as any)}>
                <Ionicons name="pricetag-outline" size={15} color={GOLD} />
                <Text style={styles.ctaDarkBtnText}>+ OFFER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 3. 8 BENTO OVERVIEW STAT CARDS ── */}
          <Text style={styles.sectionHeaderTitle}>BUSINESS METRICS OVERVIEW</Text>

          <View style={styles.bentoGrid}>
            {bentoStats.map((stat, idx) => (
              <View key={idx} style={styles.bentoCard}>
                <View style={styles.bentoHeaderRow}>
                  <Text style={styles.bentoLabel} numberOfLines={1}>
                    {stat.label}
                  </Text>
                  <View style={[styles.bentoIconBox, { backgroundColor: stat.color + '15' }]}>
                    <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                  </View>
                </View>
                <Text style={styles.bentoValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* ── 4. RECENT CUSTOMER ENQUIRIES PANEL ── */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeaderRow}>
              <View style={styles.panelTitleGroup}>
                <Ionicons name="mail" size={16} color={GOLD} />
                <Text style={styles.panelTitle}>RECENT CUSTOMER ENQUIRIES</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{recentLeads.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push('/messages' as any)}>
                <Text style={styles.panelLinkText}>View All ›</Text>
              </TouchableOpacity>
            </View>

            {recentLeads.length === 0 ? (
              <View style={styles.emptyPanelBox}>
                <Text style={styles.emptyPanelText}>No recent customer enquiries received.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {recentLeads.map((lead, i) => (
                  <TouchableOpacity
                    key={lead._id || i}
                    style={styles.leadRow}
                    onPress={() => router.push('/messages' as any)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leadSubject} numberOfLines={1}>
                        {lead.subject || lead.message || 'Inquiry Request'}
                      </Text>
                      <Text style={styles.leadCustomerText} numberOfLines={1}>
                        Buyer: {lead.customerName || lead.customer?.name || 'Customer'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, lead.status === 'replied' && styles.statusBadgeReplied]}>
                      <Text style={styles.statusBadgeText}>
                        {lead.status === 'replied' ? 'REPLIED' : 'NEW'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── 5. ACTIVE SUBSCRIPTION & VERIFICATION PANEL ── */}
          <View style={styles.panelCard}>
            <View style={styles.panelHeaderRow}>
              <View style={styles.panelTitleGroup}>
                <Ionicons name="shield-checkmark" size={16} color={GOLD} />
                <Text style={styles.panelTitle}>ACTIVE SUBSCRIPTION FEATURES</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/vendor/subscription' as any)}>
                <Text style={styles.panelLinkText}>Upgrade Plan</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresRow}>
              <View style={styles.featureChip}>
                <View style={[styles.featureDot, isKycApproved && styles.featureDotActive]} />
                <Text style={styles.featureChipText}>
                  {isKycApproved ? 'KYC Verified Store' : 'KYC Pending'}
                </Text>
              </View>

              <View style={styles.featureChip}>
                <View style={[styles.featureDot, styles.featureDotActive]} />
                <Text style={styles.featureChipText}>Full Analytics Access</Text>
              </View>

              <View style={styles.featureChip}>
                <View style={[styles.featureDot, styles.featureDotActive]} />
                <Text style={styles.featureChipText}>Product Video Boosts</Text>
              </View>

              <View style={styles.featureChip}>
                <View style={[styles.featureDot, styles.featureDotActive]} />
                <Text style={styles.featureChipText}>Direct Customer Leads</Text>
              </View>
            </View>
          </View>

          {/* ── 6. VENDOR OPERATIONS SHORTCUTS ── */}
          <Text style={styles.sectionHeaderTitle}>STORE OPERATIONS & CONTROL</Text>

          <View style={styles.opsGrid}>
            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/reels' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="videocam" size={20} color="#DB2777" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>Video Reels Studio</Text>
                <Text style={styles.opsSub}>Create & boost product videos</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/listings' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="cube" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>Product Catalog</Text>
                <Text style={styles.opsSub}>Manage stock & prices</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/orders' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="receipt" size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>Customer Orders</Text>
                <Text style={styles.opsSub}>Fulfill buyer requests</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/verification' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>KYC Verification</Text>
                <Text style={styles.opsSub}>Upload PAN / GSTIN / Aadhaar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/wallet' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="wallet" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>Credit Wallet</Text>
                <Text style={styles.opsSub}>Top-up & rates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opsCard}
              onPress={() => router.push('/vendor/settings' as any)}>
              <View style={[styles.opsIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="options" size={20} color={ESPRESSO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.opsTitle}>Store Settings</Text>
                <Text style={styles.opsSub}>Hours, contact & profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: ESPRESSO,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: 16,
  },

  /* Section Title */
  sectionHeaderTitle: {
    color: ESPRESSO,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },

  /* 1. Credit Wallet Card */
  walletCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    gap: 14,
    ...Shadows.sm,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  walletTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rateBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: GOLD,
  },
  rateBadgeText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
  },
  walletSubText: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  topupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ESPRESSO,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  topupBtnText: {
    color: GOLD,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  creditGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingVertical: 12,
  },
  creditCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  creditCellLabel: {
    color: TEXT_MUTED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  creditCellValue: {
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  creditCellSub: {
    color: TEXT_MUTED,
    fontSize: 9,
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  walletActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  walletActionBtnText: {
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '800',
  },

  /* 2. Hero CTA Banner */
  heroCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ESPRESSO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    ...Shadows.md,
  },
  heroCtaTag: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroCtaTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '900',
    marginTop: 2,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ctaYellowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  ctaYellowBtnText: {
    color: '#0F172A',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  ctaDarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: GOLD,
  },
  ctaDarkBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: '800',
  },

  /* 3. Bento Grid */
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoCard: {
    width: '48.5%',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    gap: 8,
    ...Shadows.sm,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  bentoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoValue: {
    color: TEXT_MAIN,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },

  /* 4 & 5. Panels */
  panelCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    gap: 12,
    ...Shadows.sm,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 10,
  },
  panelTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  countPillText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
  },
  panelLinkText: {
    color: GOLD,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  emptyPanelBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  emptyPanelText: {
    color: TEXT_MUTED,
    fontSize: 11,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  leadSubject: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  leadCustomerText: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: GOLD,
  },
  statusBadgeReplied: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  statusBadgeText: {
    color: TEXT_MAIN,
    fontSize: 8,
    fontWeight: '900',
  },

  /* Feature Chips */
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  featureDotActive: {
    backgroundColor: GOLD,
  },
  featureChipText: {
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '800',
  },

  /* 6. Operations Shortcuts Grid */
  opsGrid: {
    gap: 10,
  },
  opsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    gap: 12,
    ...Shadows.sm,
  },
  opsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  opsDesc: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 2,
  },
  opsSub: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 1,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginBottom: 4,
    ...Shadows.sm,
  },
  verifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyText: {
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '800',
  },
  verifyBtn: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  verifyBtnText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
  },
});
