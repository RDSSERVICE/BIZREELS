import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/src/components/GradientButton';
import { authApi } from '@/src/lib/api';
import { colors, borderRadius, spacing } from '@/src/lib/theme';

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const handleSend = async () => {
    if (!isValid) {
      Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      router.push({ pathname: '/verify-otp', params: { phone, dev_otp: data.dev_otp || '' } });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to send OTP';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="login-back-link" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>

          <View style={styles.inputSection}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text style={styles.codeText}>+91</Text>
              </View>
              <TextInput
                testID="phone-input"
                style={styles.input}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile number"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
            </View>
            {phone.length > 0 && !isValid && (
              <Text style={styles.error}>Must start with 6-9 and be 10 digits</Text>
            )}
          </View>

          <GradientButton
            testID="send-otp-btn"
            title={loading ? 'Sending...' : 'Send OTP'}
            onPress={handleSend}
            disabled={!isValid || loading}
            loading={loading}
          />

          <Text style={styles.disclaimer}>
            By continuing you agree to Emergent's Terms & Privacy. We'll only use your number to secure your account.
          </Text>
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
  inputSection: { gap: 8 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCode: {
    height: 56, minWidth: 72, paddingHorizontal: 12,
    borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: colors.borders.subtle,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  codeText: { color: 'rgba(255,255,255,0.8)', fontWeight: '500', fontSize: 15 },
  input: {
    flex: 1, height: 56, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.borders.subtle,
    paddingHorizontal: 16, color: '#fff', fontSize: 16, letterSpacing: 1,
  },
  error: { fontSize: 11, color: colors.status.error },
  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },
});
