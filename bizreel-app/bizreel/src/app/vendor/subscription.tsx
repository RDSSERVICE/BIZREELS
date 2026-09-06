/**
 * Vendor Subscription & Growth Plans Screen — Mobile Application
 * High-contrast Brutalist theme matching Web Frontend Subscription & Vendor Portal.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useWalletInfo } from '@/features/wallet/queries';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';
const EMERALD = '#10B981';

export default function VendorSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useWalletInfo();

  const isVerified =
    (user as any)?.kyc_status === 'approved' ||
    (user as any)?.is_verified === true ||
    (user as any)?.vendorProfile?.verificationStatus === 'approved';

  const currentPlan =
    (user as any)?.vendorProfile?.subscription?.plan ||
    (user as any)?.subscription?.plan ||
    'Free Member';

  const planExpires =
    (user as any)?.vendorProfile?.subscription?.expiresAt ||
    (user as any)?.subscription?.expiresAt;

  const walletBalance = walletData?.balance ?? (user as any)?.walletBalance ?? 2068;

  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await api
        .get('/subscription/plans?role=vendor')
        .catch(() => api.get('/wallet/plans?role=vendor'));
      const items = res.data?.data?.items || res.data?.items || res.data?.data || res.data || [];
      if (Array.isArray(items)) {
        setDbPlans(
          items.filter((p: any) => {
            if (!p.is_active || p.is_archived) return false;
            const pRole = (p.user_type || p.target_role || '').toLowerCase();
            return pRole === 'vendor' || pRole === 'all' || !pRole;
          })
        );
      }
    } catch (err) {
      console.warn('Error loading subscription plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlans(), refetchWallet()]);
    setRefreshing(false);
  };

  const plans = dbPlans.map((p) => {
    const rawPrice = selectedCycle === 'yearly' ? p.price_inr_year || p.price_inr * 10 : p.price_inr || p.price;
    const isCurr =
      currentPlan.toLowerCase() === (p.code || '').toLowerCase() ||
      currentPlan.toLowerCase() === (p.title || p.name || '').toLowerCase();

    const rawFeatures =
      Array.isArray(p.features_list) && p.features_list.length > 0
        ? p.features_list
        : typeof p.features === 'string'
        ? p.features.split(',').map((f: string) => f.trim())
        : [];

    return {
      id: p.id || p._id || p.code,
      title: p.title || p.name || p.code || 'GROWTH TIER',
      badge: p.badge || (p.is_popular ? 'RECOMMENDED' : isCurr ? 'CURRENT PLAN' : ''),
      price: `₹${(rawPrice || 0).toLocaleString('en-IN')}`,
      rawPrice: rawPrice || 0,
      period: selectedCycle === 'yearly' ? '/ year' : '/ month',
      description: p.description || 'Full platform access with priority leads & custom badges.',
      isCurrent: isCurr,
      features:
        rawFeatures.length > 0
          ? rawFeatures
          : ['Unlimited Product Listings', 'Priority Buyer Direct Leads', 'Gold Verification Checkmark Badge', '0% Commission Inquiries'],
      isPopular: !!p.is_popular,
    };
  });

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.isCurrent) return;

    if (!isVerified) {
      Alert.alert(
        'Business Verification Required ⚠️',
        'Please verify your business to activate subscription plans and get 5x more buyer leads!',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Verify Now',
            style: 'default',
            onPress: () => router.push('/vendor/verification' as any),
          },
        ]
      );
      return;
    }

    setSelectedPlanForModal(plan);
  };

  const handleConfirmPurchase = async (method: 'wallet' | 'razorpay') => {
    if (!selectedPlanForModal) return;
    const plan = selectedPlanForModal;
    setSelectedPlanForModal(null);

    if (method === 'wallet') {
      if (walletBalance < plan.rawPrice) {
        Alert.alert(
          'Insufficient Wallet Balance',
          `Your wallet balance is ₹${walletBalance.toLocaleString('en-IN')}. Required: ${plan.price}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Recharge Wallet',
              onPress: () => router.push('/vendor/wallet' as any),
            },
          ]
        );
        return;
      }

      try {
        await api.post('/v1/wallet/purchase-plan', { planId: plan.id });
        Alert.alert('🎉 Subscription Activated!', `You are now subscribed to ${plan.title}.`);
        onRefresh();
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to activate plan via wallet.');
      }
    } else {
      Alert.alert(
        'Razorpay Payment Gateway',
        `Redirecting to Razorpay gateway for ${plan.title} (${plan.price} ${plan.period})...`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitleText}>DASHBOARD &gt; FINANCE &amp; GROWTH</Text>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Subscription &amp; Growth Plans
          </Text>
        </View>

        <TouchableOpacity style={styles.walletHeaderBtn} onPress={() => router.push('/vendor/wallet' as any)}>
          <Ionicons name="wallet-outline" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} colors={[YELLOW]} />}
      >
        {/* Quick Action Navigation Bar */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity
            style={styles.quickNavCard}
            onPress={() => router.push('/vendor/verification' as any)}
          >
            <Ionicons name="shield-checkmark" size={16} color={YELLOW} />
            <Text style={styles.quickNavText}>Verification Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickNavCard, styles.quickNavCardDark]}
            onPress={() => router.push('/vendor/wallet' as any)}
          >
            <Ionicons name="trending-up" size={16} color={YELLOW} />
            <Text style={[styles.quickNavText, { color: YELLOW }]}>Vendor Wallet &amp; Credits</Text>
          </TouchableOpacity>
        </View>

        {/* Page Hero Description Header */}
        <View style={styles.pageIntroBox}>
          <Text style={styles.pageIntroTitle}>Subscription &amp; Growth Plans</Text>
          <Text style={styles.pageIntroSubtitle}>
            Unlock priority buyer leads, verified gold merchant badges, and high-impact reel promotions for your business.
          </Text>
        </View>

        {/* Active Membership Hero Card */}
        <View style={styles.activeHeroCard}>
          <View style={styles.activeHeroGlow} />

          <View style={styles.activeHeroContent}>
            {/* Top Badges */}
            <View style={styles.activeHeroBadgeRow}>
              <View style={styles.activeHeroPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeHeroPillText}>ACTIVE MEMBERSHIP</Text>
              </View>

              {isVerified && (
                <View style={styles.verifiedBadgePill}>
                  <Ionicons name="ribbon-outline" size={12} color={YELLOW} />
                  <Text style={styles.verifiedBadgeText}>VERIFIED MERCHANT</Text>
                </View>
              )}
            </View>

            {/* Plan Title & Subtitle */}
            <View style={{ gap: 4 }}>
              <Text style={styles.activeHeroPlanName}>{currentPlan}</Text>
              <Text style={styles.activeHeroSubtext}>
                Verified Merchant Tier · Catalog Listings &amp; Direct Buyer Enquiries Active
              </Text>
            </View>

            {/* Expiry Pill */}
            {planExpires && (
              <View style={styles.expiryBox}>
                <Ionicons name="calendar-outline" size={13} color={YELLOW} />
                <Text style={styles.expiryText}>
                  Renews / Expires on:{' '}
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {new Date(planExpires).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </Text>
              </View>
            )}

            {/* Wallet Balance & Recharge Bar */}
            <View style={styles.walletHeroBox}>
              <View style={styles.walletHeroLeft}>
                <Text style={styles.walletHeroLabel}>VENDOR WALLET BALANCE</Text>
                <Text style={styles.walletHeroAmount}>
                  ₹{(walletBalance || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.rechargeHeroBtn}
                onPress={() => router.push('/vendor/wallet' as any)}
              >
                <Text style={styles.rechargeHeroBtnText}>Recharge</Text>
                <Ionicons name="arrow-forward-outline" size={12} color={BLACK} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Growth Tiers Header & Counter */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Choose Your Growth Tier</Text>
            <Text style={styles.sectionSubtitle}>
              Select a base membership tier and customize with flexible Add-Ons anytime.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{plans.length} plans available</Text>
          </View>
        </View>

        {/* Cycle Toggle */}
        <View style={styles.cycleToggleRow}>
          <TouchableOpacity
            style={[styles.cycleBtn, selectedCycle === 'monthly' && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle('monthly')}
          >
            <Text style={[styles.cycleBtnText, selectedCycle === 'monthly' && styles.cycleBtnTextActive]}>
              Monthly Billing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cycleBtn, selectedCycle === 'yearly' && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle('yearly')}
          >
            <Text style={[styles.cycleBtnText, selectedCycle === 'yearly' && styles.cycleBtnTextActive]}>
              Yearly (Save 25% 🔥)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Growth Tier Cards List or Empty State */}
        {loadingPlans ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={YELLOW} />
            <Text style={styles.loadingText}>Fetching growth tiers...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="layers-outline" size={28} color={YELLOW} />
            </View>
            <Text style={styles.emptyTitle}>Custom Tiers Coming Soon</Text>
            <Text style={styles.emptyDesc}>
              Our flexible tiered plans with AI content booster, direct phone inquiries, and verified badges are launching shortly.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {plans.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.isPopular && styles.planCardPopular,
                  plan.isCurrent && styles.planCardCurrent,
                ]}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{plan.badge || 'POPULAR'}</Text>
                  </View>
                )}

                <View style={styles.planCardHeader}>
                  <Text style={styles.planName}>{plan.title}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.featureList}>
                  {plan.features.map((feat: string, idx: number) => (
                    <View key={idx} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={YELLOW} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planBtn,
                    plan.isPopular && styles.planBtnPopular,
                    plan.isCurrent && styles.planBtnCurrent,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={plan.isCurrent}
                >
                  <Text
                    style={[
                      styles.planBtnText,
                      plan.isPopular && styles.planBtnTextPopular,
                      plan.isCurrent && styles.planBtnTextCurrent,
                    ]}
                  >
                    {plan.isCurrent ? 'Current Active Plan' : `UPGRADE TO ${plan.title.toUpperCase()}`}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* WHY UPGRADE YOUR PLAN? (Bento Grid Highlights) */}
        <View style={styles.bentoSection}>
          <Text style={styles.bentoSectionTitle}>WHY UPGRADE YOUR PLAN?</Text>

          {/* Card 1 */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={YELLOW} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.bentoCardTitle}>5x Buyer Trust with Verified Badge</Text>
              <Text style={styles.bentoCardDesc}>
                Subscribers get an official gold verification checkmark on all listings and storefront profiles.
              </Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <Ionicons name="trending-up-outline" size={20} color={EMERALD} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.bentoCardTitle}>Zero-Commission Direct Inquiries</Text>
              <Text style={styles.bentoCardDesc}>
                Receive customer WhatsApp orders and direct telephone leads without any platform deduction.
              </Text>
            </View>
          </View>

          {/* Card 3 */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
              <Ionicons name="videocam-outline" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.bentoCardTitle}>High-Impact Reel Boost &amp; AI Ads</Text>
              <Text style={styles.bentoCardDesc}>
                Showcase your products to thousands of local customers through boosted reels and smart AI tags.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Checkout Selection Modal */}
      <Modal
        visible={Boolean(selectedPlanForModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlanForModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setSelectedPlanForModal(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedPlanForModal && (
              <View style={styles.modalPlanSummary}>
                <Text style={styles.modalPlanTitle}>{selectedPlanForModal.title}</Text>
                <Text style={styles.modalPlanPrice}>
                  {selectedPlanForModal.price} {selectedPlanForModal.period}
                </Text>
              </View>
            )}

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={styles.modalPaymentBtn}
                onPress={() => handleConfirmPurchase('wallet')}
              >
                <Ionicons name="wallet-outline" size={20} color={YELLOW} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalPaymentTitle}>Pay via Vendor Wallet</Text>
                  <Text style={styles.modalPaymentSub}>
                    Balance: ₹{(walletBalance || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPaymentBtn, styles.modalPaymentBtnRzp]}
                onPress={() => handleConfirmPurchase('razorpay')}
              >
                <Ionicons name="card-outline" size={20} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalPaymentTitle, { color: '#fff' }]}>Pay Online (Razorpay)</Text>
                  <Text style={styles.modalPaymentSub}>UPI, Credit/Debit Cards, NetBanking</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitleText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  walletHeaderBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },

  /* Scroll Content */
  scrollContent: {
    padding: Spacing.four,
    gap: 20,
  },

  /* Quick Nav Links */
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  quickNavCardDark: {
    backgroundColor: '#241B15',
    borderColor: '#3E3025',
  },
  quickNavText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Page Intro Box */
  pageIntroBox: {
    gap: 4,
  },
  pageIntroTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  pageIntroSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },

  /* Active Hero Card */
  activeHeroCard: {
    backgroundColor: '#1C1510',
    borderWidth: 1,
    borderColor: '#3E3025',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  activeHeroGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  activeHeroContent: {
    padding: 16,
    gap: 14,
  },
  activeHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  activeHeroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: EMERALD,
  },
  activeHeroPillText: {
    color: EMERALD,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeHeroPlanName: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  activeHeroSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    lineHeight: 16,
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  expiryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  walletHeroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  walletHeroLeft: {
    gap: 2,
  },
  walletHeroLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  walletHeroAmount: {
    color: EMERALD,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  rechargeHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rechargeHeroBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Cycle Toggle */
  cycleToggleRow: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  cycleBtnActive: {
    backgroundColor: YELLOW,
  },
  cycleBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '800',
  },
  cycleBtnTextActive: {
    color: BLACK,
    fontWeight: '900',
  },

  /* Empty State */
  emptyStateCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Loading State */
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },

  /* Plan Cards */
  planCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    borderRadius: 10,
    gap: 12,
  },
  planCardPopular: {
    borderColor: YELLOW,
    borderWidth: 2,
  },
  planCardCurrent: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  popularBadgeText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
  },
  planCardHeader: {
    gap: 4,
  },
  planName: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  planPrice: {
    color: YELLOW,
    fontSize: 22,
    fontWeight: '900',
  },
  planPeriod: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  planDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  planBtn: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginTop: 6,
  },
  planBtnPopular: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  planBtnCurrent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: BORDER,
  },
  planBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planBtnTextPopular: {
    color: BLACK,
  },
  planBtnTextCurrent: {
    color: 'rgba(255, 255, 255, 0.4)',
  },

  /* Bento Highlights Section */
  bentoSection: {
    gap: 10,
    marginTop: 6,
  },
  bentoSectionTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bentoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  bentoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  bentoCardDesc: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    lineHeight: 15,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalPlanSummary: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPlanTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  modalPlanPrice: {
    color: YELLOW,
    fontSize: 13,
    fontWeight: '900',
  },
  modalPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: 8,
    gap: 12,
  },
  modalPaymentBtnRzp: {
    backgroundColor: '#241B15',
    borderColor: '#3E3025',
  },
  modalPaymentTitle: {
    color: YELLOW,
    fontSize: 12,
    fontWeight: '900',
  },
  modalPaymentSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 2,
  },
});
