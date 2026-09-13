/**
 * Customer Wallet Screen — Balance, Top-up, and Transaction history.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useRechargeWallet, useTopupPacks, useWalletInfo, useWalletTransactions } from '@/features/wallet/queries';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet, isRefetching } = useWalletInfo();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const { data: topupPacks } = useTopupPacks();
  const rechargeMutation = useRechargeWallet();

  const topupPresets = (topupPacks && topupPacks.length > 0)
    ? topupPacks.map(p => typeof p === 'number' ? p : p.amount)
    : [];

  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('1000');

  const handleTopup = (amt: number) => {
    if (amt <= 0) return;
    rechargeMutation.mutate(
      { amount: amt },
      {
        onSuccess: () => {
          Alert.alert('Wallet Recharged', `Successfully added ₹${amt} to your wallet!`);
          setTopupModalVisible(false);
        },
        onError: (err: any) => {
          Alert.alert('Recharge Failed', err.message || 'Could not complete recharge.');
        },
      }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 36 }} />
      </View>

      {walletLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Wallet Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeaderRow}>
              <Text style={styles.balanceLabel}>Available Customer Wallet</Text>
              <Ionicons name="wallet-outline" size={24} color={BrandColors.primaryLight} />
            </View>

            <Text style={styles.balanceAmount}>₹{wallet?.balance || 0}</Text>

            <View style={styles.balanceFooterRow}>
              <Text style={styles.spentText}>Total Spent: ₹{wallet?.total_spent || 0}</Text>
              <TouchableOpacity
                style={styles.addFundsBtn}
                onPress={() => setTopupModalVisible(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addFundsBtnText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transactions Header */}
          <View style={styles.txHeaderRow}>
            <Text style={styles.txHeaderTitle}>Recent Transactions</Text>
          </View>

          {txLoading ? (
            <ActivityIndicator size="small" color={BrandColors.primary} style={{ marginTop: 20 }} />
          ) : !transactions || transactions.length === 0 ? (
            <View style={styles.emptyTxContainer}>
              <Ionicons name="receipt-outline" size={44} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.txList}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetchWallet}
                  tintColor={BrandColors.primary}
                  colors={[BrandColors.primary]}
                />
              }
              renderItem={({ item }) => {
                const isCredit = item.type === 'credit';
                return (
                  <View style={styles.txCard}>
                    <View
                      style={[
                        styles.txIconBox,
                        { backgroundColor: isCredit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                      ]}>
                      <Ionicons
                        name={isCredit ? 'arrow-down' : 'arrow-up'}
                        size={20}
                        color={isCredit ? '#22C55E' : '#EF4444'}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {item.description || (isCredit ? 'Wallet Top-up' : 'Order Payment')}
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    <Text style={[styles.txAmount, { color: isCredit ? '#22C55E' : '#EF4444' }]}>
                      {isCredit ? '+' : '-'}₹{item.amount}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
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
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select or Enter Amount (₹)</Text>
            <View style={styles.presetRow}>
              {topupPresets.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.presetChip}
                  onPress={() => setCustomAmount(amt.toString())}>
                  <Text style={styles.presetChipText}>+₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.customAmountInput}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="Enter custom amount"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <TouchableOpacity
              style={styles.confirmTopupBtn}
              onPress={() => handleTopup(Number(customAmount))}
              disabled={rechargeMutation.isPending}>
              {rechargeMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmTopupBtnText}>Add ₹{customAmount || 0} to Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const YELLOW = '#F59E0B';
const PRIMARY = '#2563EB';
const LIGHT_BG = '#F8FAFC';
const WHITE_CARD = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BLACK = '#0F172A';
const DARK_CARD = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE_CARD,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    margin: Spacing.four,
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  balanceAmount: {
    color: '#D97706',
    fontSize: 32,
    fontWeight: '900',
  },
  balanceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  spentText: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
  },
  addFundsBtnText: {
    color: TEXT_DARK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  txHeaderRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  txHeaderTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  emptyTxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.two,
  },
  emptyTxText: {
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
  },
  txList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.three,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  txDate: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContent: {
    backgroundColor: WHITE_CARD,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
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
    color: TEXT_DARK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  inputLabel: {
    color: PRIMARY,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  presetChipText: {
    color: TEXT_DARK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  customAmountInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    color: TEXT_DARK,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  confirmTopupBtn: {
    backgroundColor: YELLOW,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  confirmTopupBtnText: {
    color: TEXT_DARK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
});

