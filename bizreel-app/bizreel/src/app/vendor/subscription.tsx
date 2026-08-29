/**
 * Vendor Subscription Plans Screen — Mobile Application
 * High-contrast Brutalist theme matching Web Frontend SubscriptionModal.jsx & Vendor Subscription Portal.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function VendorSubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isVerified =
    (user as any)?.kyc_status === 'approved' ||
    (user as any)?.is_verified === true ||
    (user as any)?.vendorProfile?.verificationStatus === 'approved';

  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'FREE PLAN',
      badge: 'CURRENT ACTIVE PLAN',
      price: '₹0',
      period: 'Forever Free',
      description: 'Standard product & service listings for local business setup.',
      isCurrent: true,
      features: [
        'List up to 5 Products & Services',
        'Standard Search Visibility',
        'Direct WhatsApp Inquiry Link',
        'Basic Store Analytics',
      ],
      buttonText: 'Current Active Plan',
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'PRO VENDOR PLAN',
      badge: 'RECOMMENDED',
      price: selectedCycle === 'monthly' ? '₹999' : '₹8,999',
      period: selectedCycle === 'monthly' ? '/ month' : '/ year (Save 25%)',
      description: 'Maximum sales velocity, unlimited store listings & 5x buyer leads.',
      isCurrent: false,
      features: [
        'Unlimited Product & Service Listings',
        '5x Higher Search Placement',
        '50 Monthly Reel Boost Credits',
        'Verified Gold Business Badge',
        'Real-Time Customer Chat Inbox',
        'Priority Phone Support',
      ],
      buttonText: 'UPGRADE TO PRO VENDOR',
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE GROWTH',
      badge: 'VIP SCALE',
      price: selectedCycle === 'monthly' ? '₹2,499' : '₹22,499',
      period: selectedCycle === 'monthly' ? '/ month' : '/ year',
      description: 'Dedicated account manager, custom AI ad copy, & featured homepage banners.',
      isCurrent: false,
      features: [
        'Everything in Pro Plan',
        'Featured Store Badge on Homepage',
        'Dedicated Growth Manager',
        'Unlimited AI Copy & Reel Creator',
        '0% Commission on Direct Orders',
      ],
      buttonText: 'UPGRADE TO ENTERPRISE',
      isPopular: false,
    },
  ];

  const handleSubscribe = (plan: typeof plans[0]) => {
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

    Alert.alert(
      `Subscribe to ${plan.name}`,
      `Proceed to activate ${plan.name} (${plan.price} ${plan.period})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Pay',
          onPress: () => {
            Alert.alert('Payment Initiated', `Razorpay Gateway opened for ${plan.name}.`);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans & Tier Boost</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verification Alert Banner (if unverified) */}
        {!isVerified && (
          <View style={styles.verifyBanner}>
            <View style={styles.verifyBannerLeft}>
              <Text style={styles.verifyDot}>●</Text>
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

        {/* Current Plan Overview Header */}
        <View style={styles.currentOverviewCard}>
          <View style={styles.overviewTopRow}>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>FREE PLAN ACTIVE</Text>
            </View>
            <Text style={styles.syncText}>Real-Time DB Sync</Text>
          </View>

          <Text style={styles.overviewDesc}>
            List your products so customers can easily search, discover, and connect with you. The Free Plan allows you to list a limited number of products.
          </Text>

          <View style={styles.checkGrid}>
            <Text style={styles.checkItem}>✓ List products</Text>
            <Text style={styles.checkItem}>✓ Increase search limit</Text>
            <Text style={styles.checkItem}>✓ Product boost</Text>
            <Text style={styles.checkItem}>✓ Reach more customers</Text>
          </View>
        </View>

        {/* Billing Cycle Toggle */}
        <View style={styles.cycleToggleRow}>
          <TouchableOpacity
            style={[styles.cycleBtn, selectedCycle === 'monthly' && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle('monthly')}>
            <Text style={[styles.cycleBtnText, selectedCycle === 'monthly' && styles.cycleBtnTextActive]}>
              Monthly Billing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cycleBtn, selectedCycle === 'yearly' && styles.cycleBtnActive]}
            onPress={() => setSelectedCycle('yearly')}>
            <Text style={[styles.cycleBtnText, selectedCycle === 'yearly' && styles.cycleBtnTextActive]}>
              Yearly (Save 25% 🔥)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.isPopular && styles.planCardPopular,
              plan.isCurrent && styles.planCardCurrent,
            ]}>
            {plan.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={styles.planCardHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              <Text style={styles.planDesc}>{plan.description}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.featureList}>
              {plan.features.map((feat, idx) => (
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
              onPress={() => handleSubscribe(plan)}
              disabled={plan.isCurrent}>
              <Text
                style={[
                  styles.planBtnText,
                  plan.isPopular && styles.planBtnTextPopular,
                  plan.isCurrent && styles.planBtnTextCurrent,
                ]}>
                {plan.buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: 16,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E12',
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 10,
    borderRadius: 6,
    gap: 8,
  },
  verifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifyDot: {
    color: '#10B981',
    fontSize: 12,
  },
  verifyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verifyBtnText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  currentOverviewCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: 6,
    gap: 10,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activePill: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
  },
  syncText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  overviewDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkItem: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '800',
  },
  cycleToggleRow: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cycleBtnActive: {
    backgroundColor: YELLOW,
  },
  cycleBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
  },
  cycleBtnTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  planCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    borderRadius: 6,
    gap: 12,
  },
  planCardPopular: {
    borderColor: YELLOW,
    borderWidth: 2,
  },
  planCardCurrent: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  planDesc: {
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  planBtn: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  planBtnPopular: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  planBtnCurrent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: 'rgba(255,255,255,0.4)',
  },
});
