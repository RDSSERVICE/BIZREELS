/**
 * Perfected Vendor Wallet & Credit Rates Screen — Mobile Application
 * Features: Live Balance, Payout Withdrawal Modal, Dynamic Topup Packs,
 * Searchable Transaction Ledger, Credit Rate Schedule, and Business Verification Alert.
 * Matching Web Frontend (VendorWalletPage.jsx).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import {
  useCreditRates,
  useRechargeWallet,
  useRequestPayout,
  useTopupPacks,
  useWalletInfo,
  useWalletTransactions,
} from '@/features/wallet/queries';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';
const EMERALD = '#10B981';
const ROSE = '#EF4444';
const BLUE = '#3B82F6';

const DEFAULT_CREDIT_RATES = [
  { action: 'Lead Contact Unlock', rate: '5 Credits', description: 'Unlock direct phone & WhatsApp contact of buyer lead', category: 'Leads', icon: 'call-outline' },
  { action: 'Standard Reel Upload', rate: '0 Credits (Free)', description: 'Publish product reel to local discovery feed', category: 'Reels', icon: 'film-outline' },
  { action: 'Reel 24h Feature Boost', rate: '25 Credits', description: 'Pin reel to top of local feeds for 24 hours with priority ranking', category: 'Boost', icon: 'flash-outline' },
  { action: 'AI Content Generation', rate: '2 Credits', description: 'Generate AI reel script, caption & SEO hashtags', category: 'AI', icon: 'sparkles-outline' },
  { action: 'Catalog Product Boost', rate: '10 Credits', description: 'Highlight product listing in category search results for 7 days', category: 'Catalog', icon: 'pricetag-outline' },
  { action: 'Direct Buyer Broadcast', rate: '15 Credits', description: 'Broadcast offer notification to interested buyers in your pincode', category: 'Marketing', icon: 'megaphone-outline' },
];

export default function VendorWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isVerified =
    (user as any)?.kyc_status === 'approved' ||
    (user as any)?.is_verified === true ||
    (user as any)?.vendorProfile?.verificationStatus === 'approved';

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet, isRefetching } = useWalletInfo();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useWalletTransactions();
  const { data: topupPacks, isLoading: packsLoading, refetch: refetchPacks } = useTopupPacks();
  const { data: creditRatesData, refetch: refetchRates } = useCreditRates();

  const rechargeMutation = useRechargeWallet();
  const payoutMutation = useRequestPayout();

  const [activeTab, setActiveTab] = useState<'wallet' | 'rates'>('wallet');

  // Recharge Modal State
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [selectedPackAmount, setSelectedPackAmount] = useState<number>(1000);
  const [rechargeAmountStr, setRechargeAmountStr] = useState<string>('1000');

  // Payout / Withdrawal Modal State
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmountStr, setPayoutAmountStr] = useState<string>('');

  // Search Filter State for Ledger
  const [searchQuery, setSearchQuery] = useState<string>('');

  const balance = wallet?.balance ?? (user as any)?.walletBalance ?? 2068;

  // Dynamic Rates from API
  const creditRates = Array.isArray(creditRatesData) && creditRatesData.length > 0
    ? creditRatesData
    : DEFAULT_CREDIT_RATES;

  // Dynamic Packs from API
  const packsList = Array.isArray(topupPacks) && topupPacks.length > 0
    ? topupPacks
    : [
        { amount: 500, label: 'Starter Pack' },
        { amount: 1000, label: 'Growth Pack', bonus: '10%' },
        { amount: 2000, label: 'Pro Vendor Pack', bonus: '15%', is_popular: true },
        { amount: 5000, label: 'Enterprise Pack', bonus: '25%' },
      ];

  // Ledger Calculations
  const txList = Array.isArray(transactions) ? transactions : [];

  const isTxCredit = (tx: any) => {
    const typeStr = (tx?.type || tx?.credit_debit || '').toLowerCase();
    return (
      typeStr === 'credit' ||
      typeStr === 'deposit' ||
      typeStr === 'recharge' ||
      typeStr === 'referral_bonus' ||
      typeStr === 'refund' ||
      tx?.credit_debit === 'credit'
    );
  };

  const totalCredits = txList
    .filter(isTxCredit)
    .reduce((acc: number, tx: any) => acc + Math.abs(tx.amount || 0), 0);

  const totalDebits = txList
    .filter((tx: any) => !isTxCredit(tx))
    .reduce((acc: number, tx: any) => acc + Math.abs(tx.amount || 0), 0);

  const filteredTxList = txList.filter((tx: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const desc = (tx.description || tx.title || tx.admin_remarks || '').toLowerCase();
    const refId = (tx.reference_id || tx.referenceId || tx.paymentId || tx._id || '').toLowerCase();
    return desc.includes(q) || refId.includes(q);
  });

  const handleRefreshAll = () => {
    refetchWallet();
    refetchTx();
    refetchPacks();
    refetchRates();
  };

  const handleRechargeSubmit = (amountToPay: number) => {
    if (!amountToPay || amountToPay < 10) {
      Alert.alert('Invalid Amount', 'Minimum recharge amount is ₹10');
      return;
    }

    rechargeMutation.mutate(
      { amount: amountToPay },
      {
        onSuccess: () => {
          Alert.alert('🎉 Recharge Successful!', `₹${amountToPay.toLocaleString('en-IN')} deposited to your wallet balance.`);
          setTopupModalVisible(false);
          handleRefreshAll();
        },
        onError: (err: any) => {
          Alert.alert('Recharge Failed', err?.message || 'Could not process recharge. Please try again.');
        },
      }
    );
  };

  const handlePayoutSubmit = () => {
    const numAmt = parseFloat(payoutAmountStr);
    if (!numAmt || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmt > balance) {
      Alert.alert('Limit Exceeded', `Withdrawal amount cannot exceed available balance of ₹${balance.toLocaleString('en-IN')}.`);
      return;
    }

    payoutMutation.mutate(numAmt, {
      onSuccess: () => {
        Alert.alert(
          '🎉 Payout Requested!',
          `Your withdrawal request for ₹${numAmt.toLocaleString('en-IN')} has been submitted. Funds will be settled into your verified bank account within 24-48 business hours.`
        );
        setPayoutModalVisible(false);
        setPayoutAmountStr('');
        handleRefreshAll();
      },
      onError: (err: any) => {
        Alert.alert('Payout Request Failed', err?.message || 'Failed to submit withdrawal request.');
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitleText}>FINANCE &amp; ACCOUNTING</Text>
          <Text style={styles.headerTitleText}>Vendor Wallet &amp; Credits</Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={handleRefreshAll}>
          <Ionicons name="refresh" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'wallet' && styles.tabItemActive]}
          onPress={() => setActiveTab('wallet')}
        >
          <Ionicons name="wallet-outline" size={16} color={activeTab === 'wallet' ? BLACK : YELLOW} />
          <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>Wallet &amp; Ledger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rates' && styles.tabItemActive]}
          onPress={() => setActiveTab('rates')}
        >
          <Ionicons name="flash-outline" size={16} color={activeTab === 'rates' ? BLACK : YELLOW} />
          <Text style={[styles.tabText, activeTab === 'rates' && styles.tabTextActive]}>Credit Rates</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            tintColor={YELLOW}
            colors={[YELLOW]}
          />
        }
      >
        {/* Verification Alert Banner (if unverified) */}
        {!isVerified && (
          <View style={styles.verifyBanner}>
            <View style={styles.verifyBannerLeft}>
              <View style={styles.pulseDot} />
              <Text style={styles.verifyText} numberOfLines={2}>
                Verify your business to get 5x more leads &amp; maximum buyer trust!
              </Text>
            </View>
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => router.push('/vendor/verification' as any)}
            >
              <Text style={styles.verifyBtnText}>Verify Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Page Intro Banner */}
        <View style={styles.introCard}>
          <View style={styles.introHeaderRow}>
            <View style={styles.rupeeIconBox}>
              <Ionicons name="wallet" size={20} color={YELLOW} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>VENDOR WALLET &amp; CREDIT RATES</Text>
              <Text style={styles.introSub}>
                Preload wallet balance, manage reel boost credits, and check platform credit rate schedule
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Balance Banner */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>AVAILABLE VENDOR BALANCE</Text>
            <View style={[styles.badgePill, isVerified ? styles.badgePillVerified : styles.badgePillUnverified]}>
              <Ionicons name={isVerified ? 'shield-checkmark' : 'alert-circle'} size={12} color={isVerified ? EMERALD : YELLOW} />
              <Text style={[styles.badgeText, { color: isVerified ? EMERALD : YELLOW }]}>
                {isVerified ? 'Verified Account' : 'Unverified Merchant'}
              </Text>
            </View>
          </View>

          <Text style={styles.balanceAmount}>₹{(balance || 0).toLocaleString('en-IN')}</Text>

          <Text style={styles.subBalanceText}>
            Preloaded credits for reel boosts, lead contact unlocks, catalog feature badges, and AI tools
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.heroActionRow}>
            <TouchableOpacity
              style={styles.rechargeBtn}
              onPress={() => setTopupModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={BLACK} />
              <Text style={styles.rechargeBtnText}>RECHARGE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.withdrawBtn, balance <= 0 && styles.btnDisabled]}
              onPress={() => {
                setPayoutAmountStr(balance > 0 ? String(balance) : '');
                setPayoutModalVisible(true);
              }}
              disabled={balance <= 0}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up-outline" size={16} color="#fff" />
              <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subLinkBtn}
              onPress={() => router.push('/vendor/subscription' as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={16} color="#fff" />
              <Text style={styles.subLinkBtnText}>Subscriptions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'wallet' && (
          <>
            {/* 3 Metric Stat Cards Row */}
            <View style={styles.statsRow}>
              {/* Metric 1 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="wallet-outline" size={18} color={EMERALD} />
                </View>
                <Text style={styles.statLabel}>Available Balance</Text>
                <Text style={[styles.statValue, { color: EMERALD }]}>
                  ₹{(balance || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Metric 2 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="arrow-down-circle-outline" size={18} color={BLUE} />
                </View>
                <Text style={styles.statLabel}>Credits Deposited</Text>
                <Text style={[styles.statValue, { color: BLUE }]}>
                  ₹{(totalCredits || 0).toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Metric 3 */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Ionicons name="arrow-up-circle-outline" size={18} color={ROSE} />
                </View>
                <Text style={styles.statLabel}>Debits Spent</Text>
                <Text style={[styles.statValue, { color: ROSE }]}>
                  ₹{(totalDebits || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Dynamic Top-Up Packs Preview */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="flash" size={18} color={YELLOW} />
                <Text style={styles.sectionTitleText}>AVAILABLE TOP-UP PACKS</Text>
              </View>

              {packsLoading ? (
                <ActivityIndicator size="small" color={YELLOW} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.packsGrid}>
                  {packsList.map((pack: any, idx: number) => {
                    const amtVal = typeof pack === 'number' ? pack : pack.amount || pack.price || 1000;
                    const labelStr = pack.title || pack.label || `Pack ₹${amtVal}`;
                    const bonusStr = pack.bonus ? `+${pack.bonus} Bonus` : null;

                    return (
                      <View key={pack.id || idx} style={styles.packCard}>
                        <View style={styles.packHeaderRow}>
                          <Text style={styles.packLabel} numberOfLines={1}>{labelStr}</Text>
                          {bonusStr && (
                            <View style={styles.bonusBadge}>
                              <Text style={styles.bonusBadgeText}>{bonusStr}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.packPrice}>₹{Number(amtVal).toLocaleString('en-IN')}</Text>

                        <TouchableOpacity
                          style={styles.packSelectBtn}
                          onPress={() => {
                            setSelectedPackAmount(amtVal);
                            setRechargeAmountStr(String(amtVal));
                            setTopupModalVisible(true);
                          }}
                        >
                          <Ionicons name="add" size={14} color={YELLOW} />
                          <Text style={styles.packSelectBtnText}>Select Pack</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Wallet Transaction Ledger */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="receipt-outline" size={18} color={YELLOW} />
                <Text style={styles.sectionTitleText}>WALLET TRANSACTION LEDGER</Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search description or reference ID..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {txLoading ? (
                <ActivityIndicator size="small" color={YELLOW} style={{ marginVertical: 20 }} />
              ) : filteredTxList.length === 0 ? (
                <View style={styles.emptyTxContainer}>
                  <Ionicons name="document-text-outline" size={36} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyTxText}>
                    {searchQuery ? 'No matching transactions found.' : 'No wallet transactions recorded yet.'}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {filteredTxList.map((tx: any, idx: number) => {
                    const isCredit = isTxCredit(tx);
                    const rawDate = tx.created_at || tx.createdAt || tx.date || tx.timestamp;
                    const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
                    const timeStr = rawDate ? new Date(rawDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                    const desc = tx.description || tx.title || tx.admin_remarks || (isCredit ? 'Wallet Top-up Deposit' : 'Platform Action Deduction');
                    const refId = tx.reference_id || tx.referenceId || tx.paymentId || tx._id;

                    return (
                      <View key={tx._id || idx} style={styles.txCard}>
                        <View
                          style={[
                            styles.txIconBox,
                            { backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                          ]}
                        >
                          <Ionicons
                            name={isCredit ? 'arrow-down' : 'arrow-up'}
                            size={16}
                            color={isCredit ? EMERALD : ROSE}
                          />
                        </View>

                        <View style={styles.txInfo}>
                          <Text style={styles.txTitle} numberOfLines={2}>{desc}</Text>
                          <View style={styles.txMetaRow}>
                            <Text style={styles.txDate}>{dateStr} {timeStr ? `· ${timeStr}` : ''}</Text>
                            {refId && <Text style={styles.txRefId} numberOfLines={1}>ID: {refId}</Text>}
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <View style={[styles.txTypeBadge, isCredit ? styles.txTypeCredit : styles.txTypeDebit]}>
                            <Text style={[styles.txTypeBadgeText, { color: isCredit ? EMERALD : ROSE }]}>
                              {isCredit ? 'CREDIT (+)' : 'DEBIT (-)'}
                            </Text>
                          </View>
                          <Text style={[styles.txAmountText, { color: isCredit ? EMERALD : ROSE }]}>
                            {isCredit ? '+' : '-'}₹{Math.abs(tx.amount || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        {activeTab === 'rates' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flash" size={18} color={YELLOW} />
              <Text style={styles.sectionTitleText}>OFFICIAL VENDOR CREDIT RATE SCHEDULE</Text>
            </View>
            <Text style={styles.ratesSubText}>
              Transparent credit cost deduction rules for product listings, reel boosts, AI tools &amp; buyer lead unlocks.
            </Text>

            <View style={styles.ratesGrid}>
              {creditRates.map((item: any, idx: number) => (
                <View key={idx} style={styles.rateCard}>
                  <View style={styles.rateCardHeader}>
                    <View style={styles.rateCategoryBadge}>
                      <Text style={styles.rateCategoryBadgeText}>{(item.category || 'General').toUpperCase()}</Text>
                    </View>
                    <View style={styles.ratePill}>
                      <Text style={styles.ratePillText}>{item.rate}</Text>
                    </View>
                  </View>

                  <Text style={styles.rateTitle}>{item.action}</Text>
                  <Text style={styles.rateDesc}>{item.description || item.desc}</Text>
                </View>
              ))}
            </View>

            {/* Information Callout Banner */}
            <View style={styles.infoCalloutBox}>
              <Ionicons name="information-circle-outline" size={20} color={YELLOW} />
              <Text style={styles.infoCalloutText}>
                Need bulk promotional credits for high-volume catalog listings? Upgrade to a Growth Tier or contact vendor support.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Recharge Modal */}
      <Modal
        visible={topupModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTopupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTopupModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="wallet-outline" size={20} color={YELLOW} />
                <Text style={styles.modalTitle}>Recharge Vendor Wallet</Text>
              </View>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select or Enter Amount (₹)</Text>

            {/* Quick Preset Badges */}
            <View style={styles.presetChipsRow}>
              {packsList.map((pack: any, idx: number) => {
                const amtVal = typeof pack === 'number' ? pack : pack.amount || pack.price || 1000;
                const amtStr = String(amtVal);
                const isSelected = rechargeAmountStr === amtStr;
                return (
                  <TouchableOpacity
                    key={pack.id || idx}
                    style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                    onPress={() => setRechargeAmountStr(amtStr)}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                      ₹{Number(amtVal).toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.modalAmountInput}
                keyboardType="numeric"
                value={rechargeAmountStr}
                onChangeText={setRechargeAmountStr}
                placeholder="Enter amount"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>

            <View style={styles.gatewayPill}>
              <Ionicons name="checkmark-circle" size={14} color={EMERALD} />
              <Text style={styles.gatewayPillText}>Razorpay Secured Payment Gateway</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmRechargeBtn}
              onPress={() => handleRechargeSubmit(Number(rechargeAmountStr))}
              disabled={rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? (
                <ActivityIndicator color={BLACK} size="small" />
              ) : (
                <Text style={styles.confirmRechargeBtnText}>
                  PAY ₹{Number(rechargeAmountStr || 0).toLocaleString('en-IN')} VIA RAZORPAY
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payout Withdrawal Modal */}
      <Modal
        visible={payoutModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPayoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPayoutModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="arrow-up-circle-outline" size={20} color={EMERALD} />
                <Text style={styles.modalTitle}>Withdraw to Bank Account</Text>
              </View>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Available Balance Box */}
            <View style={styles.payoutBalanceBox}>
              <Text style={styles.payoutBalanceLabel}>AVAILABLE BALANCE FOR WITHDRAWAL</Text>
              <Text style={styles.payoutBalanceValue}>₹{(balance || 0).toLocaleString('en-IN')}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.inputLabel}>Withdrawal Amount (₹)</Text>
              {balance > 0 && (
                <TouchableOpacity onPress={() => setPayoutAmountStr(String(balance))}>
                  <Text style={styles.withdrawAllText}>Withdraw All (₹{balance.toLocaleString('en-IN')})</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.currencyPrefix, { color: EMERALD }]}>₹</Text>
              <TextInput
                style={styles.modalAmountInput}
                keyboardType="numeric"
                value={payoutAmountStr}
                onChangeText={setPayoutAmountStr}
                placeholder="Enter amount to withdraw"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>

            <View style={styles.bankInfoBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={EMERALD} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bankInfoTitle}>Verified Direct Bank Settlement</Text>
                <Text style={styles.bankInfoSub}>
                  Funds will be disbursed via NEFT/IMPS to your verified bank account on file within 24 to 48 business hours.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmPayoutBtn, (!payoutAmountStr || parseFloat(payoutAmountStr) <= 0 || parseFloat(payoutAmountStr) > balance) && styles.btnDisabled]}
              onPress={handlePayoutSubmit}
              disabled={payoutMutation.isPending || !payoutAmountStr || parseFloat(payoutAmountStr) <= 0 || parseFloat(payoutAmountStr) > balance}
            >
              {payoutMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmPayoutBtnText}>
                  WITHDRAW ₹{Number(payoutAmountStr || 0).toLocaleString('en-IN')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },

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

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 8,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  tabTextActive: {
    color: BLACK,
  },

  /* Scroll Content */
  scrollContent: {
    padding: Spacing.four,
    gap: 16,
  },

  /* Verification Alert Banner */
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E12',
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  verifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EMERALD,
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
    borderRadius: 4,
  },
  verifyBtnText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },

  /* Page Intro Banner */
  introCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 10,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rupeeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  introSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
  },

  /* Hero Balance Banner */
  balanceCard: {
    backgroundColor: '#241B15',
    borderWidth: 1,
    borderColor: '#3E3025',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  badgePillVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgePillUnverified: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subBalanceText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    lineHeight: 16,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rechargeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  rechargeBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },
  withdrawBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EMERALD,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  withdrawBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  subLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  subLinkBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.4,
  },

  /* Metric Stat Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
  },

  /* Section Containers */
  sectionContainer: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Top-Up Packs Grid */
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packCard: {
    width: '48.5%',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  packHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '800',
    flex: 1,
  },
  bonusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusBadgeText: {
    color: YELLOW,
    fontSize: 8,
    fontWeight: '900',
  },
  packPrice: {
    color: YELLOW,
    fontSize: 18,
    fontWeight: '900',
  },
  packSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#241B15',
    borderWidth: 1,
    borderColor: '#3E3025',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  packSelectBtnText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },

  /* Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 11,
  },

  /* Ledger Transactions */
  emptyTxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTxText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 8,
    gap: 10,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  txDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
  },
  txRefId: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  txTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txTypeCredit: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  txTypeDebit: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  txTypeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  txAmountText: {
    fontSize: 12,
    fontWeight: '900',
  },

  /* Rates Schedule */
  ratesSubText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    lineHeight: 16,
  },
  ratesGrid: {
    gap: 10,
  },
  rateCard: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  rateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateCategoryBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '900',
  },
  ratePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratePillText: {
    color: EMERALD,
    fontSize: 10,
    fontWeight: '900',
  },
  rateTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  rateDesc: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    lineHeight: 15,
  },
  infoCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E1E12',
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  infoCalloutText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    lineHeight: 15,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  inputLabel: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  presetChipSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  presetChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  presetChipTextSelected: {
    color: BLACK,
    fontWeight: '900',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currencyPrefix: {
    color: YELLOW,
    fontSize: 18,
    fontWeight: '900',
    marginRight: 6,
  },
  modalAmountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  gatewayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  gatewayPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  confirmRechargeBtn: {
    backgroundColor: YELLOW,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 4,
  },
  confirmRechargeBtnText: {
    color: BLACK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Payout Modal Specifics */
  payoutBalanceBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  payoutBalanceLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  payoutBalanceValue: {
    color: EMERALD,
    fontSize: 20,
    fontWeight: '900',
  },
  withdrawAllText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  bankInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  bankInfoTitle: {
    color: EMERALD,
    fontSize: 11,
    fontWeight: '900',
  },
  bankInfoSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  confirmPayoutBtn: {
    backgroundColor: EMERALD,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 4,
  },
  confirmPayoutBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
