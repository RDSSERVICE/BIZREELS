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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useRechargeWallet, useWalletInfo, useWalletTransactions } from '@/features/wallet/queries';

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet, isRefetching } = useWalletInfo();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();
  const rechargeMutation = useRechargeWallet();

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
              {TOPUP_PRESETS.map((amt) => (
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  balanceCard: {
    margin: Spacing.four,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.primary + '50',
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
    fontWeight: FontWeight.bold,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  balanceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  spentText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addFundsBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  txHeaderRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  txHeaderTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  emptyTxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.two,
  },
  emptyTxText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.sm,
  },
  txList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  txDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    paddingVertical: Spacing.two,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetChipText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  customAmountInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: Spacing.three,
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  confirmTopupBtn: {
    backgroundColor: BrandColors.primary,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  confirmTopupBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
