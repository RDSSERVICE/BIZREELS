import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/src/components/GradientButton';
import GlassCard from '@/src/components/GlassCard';
import { authApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

export default function VerifyOtp() {
  const router = useRouter();
  const { phone, dev_otp: initialDevOtp } = useLocalSearchParams<{ phone: string; dev_otp: string }>();
  const { applyAuthResponse } = useAuth();

  const [otp, setOtp] = useState(initialDevOtp || '');
  const [devOtp, setDevOtp] = useState(initialDevOtp || '');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (!phone) router.replace('/login');
  }, [phone]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ phone, otp });
      await applyAuthResponse(data);
      if (!data.user?.name) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/feed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Invalid or expired OTP';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      const { data } = await authApi.sendOtp(phone!);
      setResendIn(30);
      setDevOtp(data.dev_otp || '');
      if (data.dev_otp) setOtp(data.dev_otp);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to resend');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="verify-back-link" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.backText}>Change number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the code sent to +91 {phone}</Text>

          {devOtp ? (
            <GlassCard style={styles.devBanner}>
              <View style={styles.devRow}>
                <Ionicons name="code-slash" size={16} color="#60a5fa" />
                <Text style={styles.devText}>Dev OTP: <Text style={styles.devCode}>{devOtp}</Text></Text>
              </View>
            </GlassCard>
          ) : null}

          <TextInput
            testID="otp-input"
            style={styles.otpInput}
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          <GradientButton
            testID="verify-otp-btn"
            title={loading ? 'Verifying...' : 'Verify & Continue'}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
            loading={loading}
          />

          <View style={styles.resendWrap}>
            {resendIn > 0 ? (
              <Text testID="resend-timer" style={styles.resendTimer}>Resend in {resendIn}s</Text>
            ) : (
              <TouchableOpacity testID="resend-otp-btn" onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  content: { paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: -8 },
  devBanner: {
    backgroundColor: 'rgba(37,99,235,0.15)', borderColor: 'rgba(96,165,250,0.3)',
  },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devText: { fontSize: 13, color: '#93c5fd' },
  devCode: { fontWeight: '700', color: '#60a5fa', letterSpacing: 2 },
  otpInput: {
    height: 64, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.borders.subtle,
    paddingHorizontal: 24, color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: 12,
  },
  resendWrap: { alignItems: 'center' },
  resendTimer: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  resendLink: { fontSize: 14, fontWeight: '600', color: '#ec4899' },
});
