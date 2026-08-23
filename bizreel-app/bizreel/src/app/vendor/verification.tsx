/**
 * Vendor KYC & Verification Screen — 5-Step Verification Progress & Modals.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
  useVerificationStatus,
  useVerifyBank,
  useVerifyGstin,
  useVerifyPan,
  useVerifyUpi,
} from '@/features/vendor/queries';

export default function VendorVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: status, isLoading, refetch } = useVerificationStatus();

  // Modals state
  const [activeModal, setActiveModal] = useState<'pan' | 'gstin' | 'bank' | 'upi' | null>(null);

  // Form states
  const [panInput, setPanInput] = useState('');
  const [gstinInput, setGstinInput] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiInput, setUpiInput] = useState('');

  const verifyPanMutation = useVerifyPan();
  const verifyGstinMutation = useVerifyGstin();
  const verifyBankMutation = useVerifyBank();
  const verifyUpiMutation = useVerifyUpi();

  function handleVerifyPan() {
    if (!panInput.trim() || panInput.length < 10) {
      Alert.alert('Invalid PAN', 'Please enter a valid 10-digit PAN number.');
      return;
    }
    verifyPanMutation.mutate(panInput.trim().toUpperCase(), {
      onSuccess: () => {
        Alert.alert('PAN Verification Submitted', 'Your PAN details have been verified.');
        setActiveModal(null);
        setPanInput('');
      },
      onError: (err: any) => Alert.alert('Verification Failed', err.message),
    });
  }

  function handleVerifyGstin() {
    if (!gstinInput.trim() || gstinInput.length < 15) {
      Alert.alert('Invalid GSTIN', 'Please enter a valid 15-digit GSTIN number.');
      return;
    }
    verifyGstinMutation.mutate(gstinInput.trim().toUpperCase(), {
      onSuccess: () => {
        Alert.alert('GSTIN Verification Submitted', 'Your GSTIN has been verified.');
        setActiveModal(null);
        setGstinInput('');
      },
      onError: (err: any) => Alert.alert('Verification Failed', err.message),
    });
  }

  function handleVerifyBank() {
    if (!bankHolder.trim() || !bankAccount.trim() || !bankIfsc.trim()) {
      Alert.alert('Incomplete Details', 'Please fill in all bank details.');
      return;
    }
    verifyBankMutation.mutate(
      {
        accountHolder: bankHolder.trim(),
        accountNumber: bankAccount.trim(),
        ifscCode: bankIfsc.trim().toUpperCase(),
      },
      {
        onSuccess: () => {
          Alert.alert('Bank Verified', 'Bank account details verified successfully.');
          setActiveModal(null);
          setBankHolder('');
          setBankAccount('');
          setBankIfsc('');
        },
        onError: (err: any) => Alert.alert('Verification Failed', err.message),
      }
    );
  }

  function handleVerifyUpi() {
    if (!upiInput.trim() || !upiInput.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. name@upi).');
      return;
    }
    verifyUpiMutation.mutate(upiInput.trim(), {
      onSuccess: () => {
        Alert.alert('UPI Verified', 'Your UPI ID has been verified.');
        setActiveModal(null);
        setUpiInput('');
      },
      onError: (err: any) => Alert.alert('Verification Failed', err.message),
    });
  }

  const steps = [
    {
      id: 'pan',
      title: 'PAN Card Verification',
      desc: 'Verify business PAN card number for tax compliance.',
      isDone: status?.panVerified || false,
      onPress: () => setActiveModal('pan'),
    },
    {
      id: 'gstin',
      title: 'GSTIN Verification',
      desc: '15-digit GSTIN number for tax invoice issuance.',
      isDone: status?.gstinVerified || false,
      onPress: () => setActiveModal('gstin'),
    },
    {
      id: 'bank',
      title: 'Bank Account Payout',
      desc: 'Link bank account for receiving sales payouts.',
      isDone: status?.bankVerified || false,
      onPress: () => setActiveModal('bank'),
    },
    {
      id: 'upi',
      title: 'UPI Payout Method',
      desc: 'Link UPI VPA ID for instant wallet withdrawals.',
      isDone: status?.paymentVerified || false,
      onPress: () => setActiveModal('upi'),
    },
  ];

  const completedCount = steps.filter((s) => s.isDone).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Business Verification</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Verification Progress</Text>
              <Text style={styles.progressSub}>{completedCount} of 4 steps completed</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {completedCount === 4 ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedCount / 4) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Steps List */}
        <Text style={styles.sectionTitle}>Verification Steps</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginVertical: 30 }} />
        ) : (
          steps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={[styles.stepCard, step.isDone && styles.stepCardDone]}
              onPress={step.onPress}>
              <View style={[styles.stepIconCircle, step.isDone && styles.stepIconCircleDone]}>
                <Ionicons
                  name={step.isDone ? 'checkmark' : 'shield-checkmark-outline'}
                  size={20}
                  color={step.isDone ? '#22C55E' : BrandColors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>

              <Ionicons
                name={step.isDone ? 'checkmark-circle' : 'chevron-forward'}
                size={20}
                color={step.isDone ? '#22C55E' : 'rgba(255,255,255,0.4)'}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* PAN Modal */}
      <Modal visible={activeModal === 'pan'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PAN Card Verification</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={panInput}
              onChangeText={setPanInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyPan}
              disabled={verifyPanMutation.isPending}>
              {verifyPanMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Verify PAN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GSTIN Modal */}
      <Modal visible={activeModal === 'gstin'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>GSTIN Verification</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 15-digit GSTIN number"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={gstinInput}
              onChangeText={setGstinInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyGstin}
              disabled={verifyGstinMutation.isPending}>
              {verifyGstinMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Verify GSTIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank Modal */}
      <Modal visible={activeModal === 'bank'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bank Payout Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Account Holder Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={bankHolder}
              onChangeText={setBankHolder}
            />
            <TextInput
              style={styles.input}
              placeholder="Bank Account Number"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={bankAccount}
              onChangeText={setBankAccount}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="IFSC Code"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={bankIfsc}
              onChangeText={setBankIfsc}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyBank}
              disabled={verifyBankMutation.isPending}>
              {verifyBankMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Verify Bank Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPI Modal */}
      <Modal visible={activeModal === 'upi'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveModal(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>UPI ID Verification</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter UPI VPA ID (e.g. name@upi)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={upiInput}
              onChangeText={setUpiInput}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleVerifyUpi}
              disabled={verifyUpiMutation.isPending}>
              {verifyUpiMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Verify UPI ID</Text>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  progressCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BrandColors.primary + '50',
    gap: Spacing.three,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  progressSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  badgeContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#22C55E',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#2c2c2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.three,
  },
  stepCardDone: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  stepIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCircleDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  stepTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  stepDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    marginTop: 2,
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
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  input: {
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.sm,
  },
  submitBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
