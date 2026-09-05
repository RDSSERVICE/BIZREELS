/**
 * Perfected Vendor Wallet & Credit Rates Screen (Neo-Brutalist Design)
 * Features: Dynamic Topup Packs (API), Live Balance, Credit Rate Schedule,
 * Custom Amount Recharge & Full Transaction Audit History.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { 
  useCreditRates,
  useRechargeWallet, 
  useTopupPacks, 
  useWalletInfo, 
  useWalletTransactions 
} from '@/features/wallet/queries';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const DEFAULT_CREDIT_RATES = [
  { action: 'Lead Contact Unlock', rate: '5 Credits', desc: 'Direct phone & WhatsApp contact', icon: 'call-outline' },
  { action: 'Reel Upload', rate: 'Free', desc: 'Standard local feed upload', icon: 'film-outline' },
  { action: '24h Reel Boost', rate: '25 Credits', desc: 'Top pin with priority ranking', icon: 'flash-outline' },
  { action: 'AI SEO Captions', rate: '2 Credits', desc: 'Generate hashtags & script', icon: 'sparkles-outline' },
  { action: 'Catalog Highlight', rate: '10 Credits', desc: '7-day search priority badge', icon: 'pricetag-outline' },
];

export default function VendorWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet, isRefetching } = useWalletInfo();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useWalletTransactions();
  const { data: topupPacks, isLoading: packsLoading } = useTopupPacks();
  const { data: creditRatesData } = useCreditRates();
  const rechargeMutation = useRechargeWallet();

  const [activeTab, setActiveTab] = useState<'wallet' | 'rates'>('wallet');
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [selectedPackAmount, setSelectedPackAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');

  // Dynamic Rates from API
  const dynamicRates = Array.isArray(creditRatesData) && creditRatesData.length > 0
    ? creditRatesData
    : DEFAULT_CREDIT_RATES;

  // Dynamic packs array from API with safe fallback
  const dynamicPacks = Array.isArray(topupPacks) ? topupPacks : [];

  const handleRecharge = (amountToPay: number) => {
    if (amountToPay < 10) {
      Alert.alert('Invalid Amount', 'Minimum recharge amount is ₹10');
      return;
    }

    rechargeMutation.mutate(
      { amount: amountToPay },
      {
        onSuccess: () => {
          Alert.alert('Recharge Successful! 🎉', `₹${amountToPay} has been deposited to your wallet balance.`);
          setTopupModalVisible(false);
          refetchWallet();
          refetchTx();
        },
        onError: (err: any) => {
          Alert.alert('Recharge Failed', err?.message || 'Could not process recharge. Please try again.');
        },
      }
    );
  };

  const balance = wallet?.balance ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Wallet & Credits</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { refetchWallet(); refetchTx(); }}>
          <Ionicons name="refresh" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Pills */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'wallet' && styles.tabItemActive]}
          onPress={() => setActiveTab('wallet')}>
          <Ionicons name="wallet-outline" size={16} color={activeTab === 'wallet' ? BLACK : '#fff'} />
          <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>Wallet & Top-up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rates' && styles.tabItemActive]}
          onPress={() => setActiveTab('rates')}>
          <Ionicons name="flash-outline" size={16} color={activeTab === 'rates' ? BLACK : '#fff'} />
          <Text style={[styles.tabText, activeTab === 'rates' && styles.tabTextActive]}>Credit Rates</Text>
        </TouchableOpacity>
      </View>

      {walletLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetchWallet(); refetchTx(); }}
              tintColor={YELLOW}
              colors={[YELLOW]}
            />
          }>

          {/* Neo-Brutalist Balance Hero Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>AVAILABLE VENDOR BALANCE</Text>
              <View style={styles.badgePill}>
                <Ionicons name="shield-checkmark" size={14} color={YELLOW} />
                <Text style={styles.badgeText}>Verified Account</Text>
              </View>
            </View>

            <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>

            <Text style={styles.subBalanceText}>
              Preloaded balance available for 24h reel boosts, lead contact unlocks & AI features
            </Text>

            <TouchableOpacity
              style={styles.addFundsBtn}
              onPress={() => setTopupModalVisible(true)}
              activeOpacity={0.85}>
              <Ionicons name="add-circle" size={18} color={BLACK} />
              <Text style={styles.addFundsBtnText}>RECHARGE WALLET</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'wallet' && (
            <>
              {/* Dynamic Top-up Packs (Fetched live from Backend API) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Credit Top-Up Pack</Text>
                <Text style={styles.sectionSub}>Dynamic balance packages via Razorpay UPI & Cards</Text>

                {packsLoading ? (
                  <ActivityIndicator size="small" color={YELLOW} style={{ marginVertical: 12 }} />
                ) : dynamicPacks.length > 0 ? (
                  <View style={styles.packsGrid}>
                    {dynamicPacks.map((pack: any, idx: number) => {
                      const amtVal = typeof pack === 'number' ? pack : pack.amount || pack.price || 1000;
                      const titleStr = pack.title || pack.label || `₹${amtVal} Pack`;
                      const isSelected = selectedPackAmount === amtVal;

                      return (
                        <TouchableOpacity
                          key={pack.id || idx}
                          style={[styles.packCard, isSelected && styles.packCardSelected]}
                          onPress={() => {
                            setSelectedPackAmount(amtVal);
                            setCustomAmount(String(amtVal));
                          }}>
                          <View style={styles.packHeaderRow}>
                            <Text style={styles.packTitle}>{titleStr}</Text>
                            {isSelected && (
                              <View style={styles.selectedCheck}>
                                <Ionicons name="checkmark" size={12} color={BLACK} />
                              </View>
                            )}
                          </View>

                          <Text style={styles.packPrice}>₹{Number(amtVal).toLocaleString('en-IN')}</Text>

                          <TouchableOpacity
                            style={[styles.packBuyBtn, isSelected && styles.packBuyBtnSelected]}
                            onPress={() => {
                              setSelectedPackAmount(amtVal);
                              setCustomAmount(String(amtVal));
                              handleRecharge(amtVal);
                            }}>
                            <Text style={[styles.packBuyBtnText, isSelected && { color: BLACK }]}>
                              {isSelected ? 'Pay Now' : 'Select'}
                            </Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.customAmountBox}>
                    <Text style={styles.inputLabel}>Enter Custom Recharge Amount (₹)</Text>
                    <TextInput
                      style={styles.customAmountInput}
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      placeholder="e.g. 1000"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                    <TouchableOpacity
                      style={styles.customPayBtn}
                      onPress={() => handleRecharge(Number(customAmount))}>
                      <Text style={styles.customPayBtnText}>Pay ₹{customAmount || 0} via Razorpay</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Transactions History Audit */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transaction History Ledger</Text>

                {txLoading ? (
                  <ActivityIndicator size="small" color={YELLOW} style={{ marginVertical: 12 }} />
                ) : !transactions || transactions.length === 0 ? (
                  <View style={styles.emptyTxContainer}>
                    <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyTxText}>No transactions recorded yet.</Text>
                  </View>
                ) : (
                  transactions.map((tx: any, idx: number) => {
                    const isCredit = tx.type === 'credit' || tx.type === 'deposit' || tx.type === 'recharge';
                    return (
                      <View key={tx._id || idx} style={styles.txCard}>
                        <View
                          style={[
                            styles.txIconBox,
                            { backgroundColor: isCredit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                          ]}>
                          <Ionicons
                            name={isCredit ? 'arrow-down' : 'arrow-up'}
                            size={18}
                            color={isCredit ? '#22C55E' : '#EF4444'}
                          />
                        </View>

                        <View style={styles.txInfo}>
                          <Text style={styles.txTitle} numberOfLines={1}>
                            {tx.description || tx.title || (isCredit ? 'Wallet Top-up' : 'Reel Boost / Lead Unlock')}
                          </Text>
                          <Text style={styles.txDate}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent'}
                          </Text>
                        </View>

                        <Text style={[styles.txAmount, { color: isCredit ? '#22C55E' : '#EF4444' }]}>
                          {isCredit ? '+' : '-'}₹{Math.abs(tx.amount || 0)}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {activeTab === 'rates' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credit Consumption Rates</Text>
              <Text style={styles.sectionSub}>Transparent rates for leads, boosts and AI tools</Text>

              <View style={styles.ratesContainer}>
                {dynamicRates.map((item: any, idx: number) => (
                  <View key={idx} style={styles.rateCard}>
                    <View style={styles.rateHeader}>
                      <View style={styles.rateIconBox}>
                        <Ionicons name={item.icon as any} size={18} color={YELLOW} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rateTitle}>{item.action}</Text>
                        <Text style={styles.rateDesc}>{item.desc}</Text>
                      </View>
                      <Text style={styles.ratePill}>{item.rate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* Wallet Top-up Modal */}
      <Modal
        visible={topupModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTopupModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTopupModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recharge Vendor Wallet</Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Enter Recharge Amount (₹)</Text>

            <TextInput
              style={styles.customAmountInput}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Enter amount"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <TouchableOpacity
              style={styles.confirmTopupBtn}
              onPress={() => handleRecharge(Number(customAmount))}
              disabled={rechargeMutation.isPending}>
              {rechargeMutation.isPending ? (
                <ActivityIndicator color={BLACK} />
              ) : (
                <Text style={styles.confirmTopupBtnText}>
                  PAY ₹{customAmount || 0} VIA RAZORPAY
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  tabTextActive: {
    color: BLACK,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  balanceCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.four,
    borderWidth: 2,
    borderColor: YELLOW,
    gap: Spacing.two,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  balanceAmount: {
    color: YELLOW,
    fontSize: 36,
    fontWeight: '900',
  },
  subBalanceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 12,
    gap: 6,
    marginTop: Spacing.two,
  },
  addFundsBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  sectionSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  packCard: {
    width: '48%',
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  packCardSelected: {
    borderColor: YELLOW,
    borderWidth: 2,
  },
  packHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  selectedCheck: {
    width: 18,
    height: 18,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packPrice: {
    color: YELLOW,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  packBuyBtn: {
    backgroundColor: BLACK,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  packBuyBtnSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  packBuyBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  customAmountBox: {
    gap: Spacing.two,
  },
  inputLabel: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  customAmountInput: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  customPayBtn: {
    backgroundColor: YELLOW,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customPayBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyTxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: Spacing.two,
  },
  emptyTxText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  txIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLACK,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  txDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  ratesContainer: {
    gap: Spacing.two,
  },
  rateCard: {
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rateIconBox: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  rateDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  ratePill: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  confirmTopupBtn: {
    backgroundColor: YELLOW,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  confirmTopupBtnText: {
    color: BLACK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
});
