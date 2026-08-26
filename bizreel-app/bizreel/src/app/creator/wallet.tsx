import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function CreatorWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Withdraw Modal
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/wallet?role=creator').catch(() => ({ data: { balance: 0 } })),
        api.get('/transactions?role=creator').catch(() => ({ data: { items: [] } })),
      ]);

      const wData = walletRes.data?.data || walletRes.data || {};
      setBalance(wData.balance || 0);

      const tData = txRes.data?.data?.items || txRes.data?.items || txRes.data || [];
      setTransactions(Array.isArray(tData) ? tData : []);
    } catch (err) {
      console.warn('Failed to load creator wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Required', 'Please enter a valid amount to withdraw');
      return;
    }
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'Requested withdrawal amount exceeds your available balance.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wallet/withdraw', { amount: amt, role: 'creator' });
      Alert.alert('Withdrawal Requested', `₹${amt} payout request submitted successfully!`);
      setWithdrawModal(false);
      setWithdrawAmount('');
      fetchWallet();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to process payout request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>WALLET & EARNINGS</Text>
          <Text style={styles.headerSub}>Manage Shoot Campaign Payouts</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Available Earnings Balance</Text>
          <Text style={styles.balanceVal}>₹{balance.toLocaleString('en-IN')}</Text>
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawModal(true)}>
            <Ionicons name="cash-outline" size={18} color={BLACK} />
            <Text style={styles.withdrawBtnText}>Withdraw Earnings to Bank</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No earnings transactions yet</Text>
          </View>
        ) : (
          transactions.map((tx, idx) => (
            <View key={tx._id || idx} style={styles.txCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{tx.description || tx.type?.toUpperCase()}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at || Date.now()).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === 'credit' ? styles.credit : styles.debit]}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={withdrawModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout Withdrawal</Text>
              <TouchableOpacity onPress={() => setWithdrawModal(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Available Balance: ₹{balance.toLocaleString('en-IN')}</Text>

            <Text style={styles.modalLabel}>Enter Amount to Withdraw (₹) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2500"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleWithdraw} disabled={submitting}>
              {submitting ? <ActivityIndicator color={BLACK} /> : <Text style={styles.modalSubmitText}>Submit Bank Payout</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  loadingContainer: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  balanceCard: { backgroundColor: DARK_CARD, borderWidth: 2, borderColor: YELLOW, padding: Spacing.five, gap: 8 },
  balanceTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  balanceVal: { color: '#10B981', fontSize: FontSize['2xl'], fontWeight: '900' },
  withdrawBtn: { backgroundColor: YELLOW, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  withdrawBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  sectionTitle: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  txCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.three, flexDirection: 'row', alignItems: 'center' },
  txTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  txDate: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },
  txAmount: { fontSize: FontSize.sm, fontWeight: '900' },
  credit: { color: '#10B981' },
  debit: { color: '#EF4444' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.four },
  modalContent: { backgroundColor: DARK_CARD, borderWidth: 2, borderColor: YELLOW, padding: Spacing.five, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  modalLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  modalInput: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  modalSubmitBtn: { backgroundColor: YELLOW, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  modalSubmitText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
});
