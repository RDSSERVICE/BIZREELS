import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '@/src/components/GlassCard';
import GradientButton from '@/src/components/GradientButton';
import { walletApi, paymentApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Wallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('500');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await walletApi.me();
      setWallet(data.wallet);
      setTxns(data.transactions || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const topup = async () => {
    const paise = Number(amount) * 100;
    if (!paise || paise < 100) return Alert.alert('Error', 'Min ₹1');
    try {
      const { data } = await walletApi.topup(paise);
      if (data.dev_mode) {
        await paymentApi.simulate(data.payment_id);
        Alert.alert('Success', `₹${amount} added (dev mode)`);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color="#ec4899" style={{ marginTop: 40 }} testID="wallet-loading" />
        ) : (
          <>
            <GlassCard style={styles.balanceCard} testID="wallet-summary">
              <View style={styles.balRow}>
                <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.balLabel}>Balance</Text>
              </View>
              <Text style={styles.balAmount} testID="wallet-inr">₹{((wallet?.balance_inr_paise || 0) / 100).toLocaleString('en-IN')}</Text>
              <Text style={styles.creditsText} testID="wallet-credits">{wallet?.credits || 0} credits</Text>
              <GradientButton testID="topup-btn" title="Add Money" onPress={() => setModalOpen(true)} small style={{ marginTop: 16 }} />
            </GlassCard>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
              {txns.length === 0 ? (
                <View style={styles.emptyWrap} testID="txns-empty">
                  <Text style={styles.emptyText}>Nothing yet.</Text>
                </View>
              ) : (
                <View style={styles.txnList} testID="txns-list">
                  {txns.map(t => (
                    <GlassCard key={t.id} style={styles.txnCard}>
                      <View style={[styles.txnIcon, (t.type === 'deposit' || t.type?.includes('earn')) ? styles.txnIconGreen : styles.txnIconPink]}>
                        <Ionicons name={(t.type === 'deposit' || t.type?.includes('earn')) ? 'arrow-down' : 'arrow-up'} size={16} color={(t.type === 'deposit' || t.type?.includes('earn')) ? '#4ade80' : '#f472b6'} />
                      </View>
                      <View style={styles.txnInfo}>
                        <Text style={styles.txnReason} numberOfLines={1}>{t.reason || t.type}</Text>
                        <Text style={styles.txnAmount}>{t.bucket === 'credits' ? `${t.amount} credits` : `₹${(t.amount / 100).toFixed(2)}`}</Text>
                      </View>
                    </GlassCard>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Top-up modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add money</Text>
            <TextInput
              testID="topup-amount-input"
              style={styles.modalInput}
              value={amount}
              onChangeText={t => setAmount(t.replace(/\D/g, ''))}
              placeholder="Amount in ₹"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
            />
            <GradientButton testID="topup-submit" title={`Add ₹${amount}`} onPress={topup} />
            <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalNote}>Dev mode: payment auto-simulated</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  balanceCard: { marginTop: 8, padding: 24 },
  balRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  balAmount: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 4 },
  creditsText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  txnList: { gap: 8 },
  txnCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  txnIcon: { height: 36, width: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnIconGreen: { backgroundColor: 'rgba(74,222,128,0.15)' },
  txnIconPink: { backgroundColor: 'rgba(244,114,182,0.15)' },
  txnInfo: { flex: 1 },
  txnReason: { fontSize: 13, color: '#fff' },
  txnAmount: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: borderRadius.xl, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalInput: {
    height: 48, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 16,
  },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  modalNote: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
