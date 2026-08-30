import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

export default function CreatorVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  // Verification Forms State
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [showAadhaarOtpInput, setShowAadhaarOtpInput] = useState(false);

  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [verifyingPan, setVerifyingPan] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/creator/me/verification-status');
      setStatus(res.data?.data || res.data || {});
    } catch (err) {
      console.warn('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleVerifyPan = async () => {
    if (!panNumber.trim() || panNumber.trim().length !== 10) {
      Alert.alert('Required', 'Please enter a valid 10-character PAN number');
      return;
    }
    setVerifyingPan(true);
    try {
      await api.post('/creator/me/verification/pan', { panNumber: panNumber.trim().toUpperCase() });
      Alert.alert('Success', 'PAN card verified successfully!');
      fetchStatus();
    } catch (err: any) {
      Alert.alert('PAN Verification Failed', err.response?.data?.message || 'Invalid PAN details');
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleInitiateAadhaar = async () => {
    if (!aadhaarNumber.trim() || aadhaarNumber.trim().length !== 12) {
      Alert.alert('Required', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setVerifyingAadhaar(true);
    try {
      const res = await api.post('/creator/me/verification/aadhaar/initiate', { aadhaarNumber: aadhaarNumber.trim() });
      const refId = res.data?.refId || res.data?.data?.refId || 'REF_MOCK_123';
      setAadhaarRefId(refId);
      setShowAadhaarOtpInput(true);
      Alert.alert('OTP Sent', 'An OTP has been sent to your Aadhaar-linked mobile number.');
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not initiate Aadhaar OTP');
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp.trim()) {
      Alert.alert('Required', 'Please enter the OTP');
      return;
    }
    setVerifyingAadhaar(true);
    try {
      await api.post('/creator/me/verification/aadhaar/verify-otp', {
        refId: aadhaarRefId,
        otp: aadhaarOtp.trim(),
      });
      Alert.alert('Verified!', 'Aadhaar identity verified successfully!');
      setShowAadhaarOtpInput(false);
      fetchStatus();
    } catch (err: any) {
      Alert.alert('OTP Error', err.response?.data?.message || 'Invalid Aadhaar OTP');
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const handleVerifyBank = async () => {
    if (!accountNumber.trim() || !ifscCode.trim()) {
      Alert.alert('Required', 'Please enter Account Number & IFSC code');
      return;
    }
    setVerifyingBank(true);
    try {
      await api.post('/creator/me/verification/bank', {
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      Alert.alert('Bank Account Verified', 'Penny drop verification successful!');
      fetchStatus();
    } catch (err: any) {
      Alert.alert('Bank Verification Failed', err.response?.data?.message || 'Invalid bank account details');
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleVerifyUpi = async () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      Alert.alert('Required', 'Please enter a valid UPI ID (e.g. user@upi)');
      return;
    }
    setVerifyingUpi(true);
    try {
      await api.post('/creator/me/verification/upi', { upiId: upiId.trim().toLowerCase() });
      Alert.alert('UPI Verified', 'UPI handle verified for instant payouts!');
      fetchStatus();
    } catch (err: any) {
      Alert.alert('UPI Check Failed', err.response?.data?.message || 'Could not verify UPI handle');
    } finally {
      setVerifyingUpi(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>VERIFICATION CENTER</Text>
          <Text style={styles.headerSub}>KYC Identity & Payout Verification</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* PAN Verification */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card-outline" size={20} color={YELLOW} />
            <Text style={styles.cardTitle}>1. PAN Card Verification</Text>
            {status?.panVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>VERIFIED</Text></View>
            )}
          </View>
          {!status?.panVerified ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-character PAN (e.g. ABCDE1234F)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={panNumber}
                onChangeText={setPanNumber}
                autoCapitalize="characters"
                maxLength={10}
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyPan} disabled={verifyingPan}>
                {verifyingPan ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Verify PAN Card</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.successNote}>✓ PAN verification completed successfully.</Text>
          )}
        </View>

        {/* Aadhaar Verification */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="finger-print-outline" size={20} color={YELLOW} />
            <Text style={styles.cardTitle}>2. Aadhaar Identity (OTP)</Text>
            {status?.aadhaarVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>VERIFIED</Text></View>
            )}
          </View>
          {!status?.aadhaarVerified ? (
            !showAadhaarOtpInput ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 12-digit Aadhaar Number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={aadhaarNumber}
                  onChangeText={setAadhaarNumber}
                  keyboardType="number-pad"
                  maxLength={12}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleInitiateAadhaar} disabled={verifyingAadhaar}>
                  {verifyingAadhaar ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Get Aadhaar OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP sent to mobile"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={aadhaarOtp}
                  onChangeText={setAadhaarOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyAadhaarOtp} disabled={verifyingAadhaar}>
                  {verifyingAadhaar ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Verify Aadhaar OTP</Text>}
                </TouchableOpacity>
              </>
            )
          ) : (
            <Text style={styles.successNote}>✓ Aadhaar identity verified via DigiLocker OTP.</Text>
          )}
        </View>

        {/* Bank Account Verification */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="business-outline" size={20} color={YELLOW} />
            <Text style={styles.cardTitle}>3. Bank Account Penny Drop</Text>
            {status?.bankVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>VERIFIED</Text></View>
            )}
          </View>
          {!status?.bankVerified ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Bank Account Number"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="IFSC Code (e.g. SBIN0001234)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={ifscCode}
                onChangeText={setIfscCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyBank} disabled={verifyingBank}>
                {verifyingBank ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Verify Bank Account</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.successNote}>✓ Bank account penny drop verified for instant payouts.</Text>
          )}
        </View>

        {/* UPI Verification */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flash-outline" size={20} color={YELLOW} />
            <Text style={styles.cardTitle}>4. Instant UPI Payout Handle</Text>
            {status?.upiVerified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>VERIFIED</Text></View>
            )}
          </View>
          {!status?.upiVerified ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter UPI ID (e.g. mobile@upi)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyUpi} disabled={verifyingUpi}>
                {verifyingUpi ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Verify UPI ID</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.successNote}>✓ UPI ID verified for instant campaign payouts.</Text>
          )}
        </View>
      </ScrollView>
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
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.three },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900', flex: 1 },
  verifiedBadge: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2 },
  verifiedBadgeText: { color: BLACK, fontSize: 9, fontWeight: '900' },
  input: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  submitBtn: { backgroundColor: YELLOW, height: 44, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  successNote: { color: '#10B981', fontSize: FontSize.xs, fontWeight: '700' },
});
