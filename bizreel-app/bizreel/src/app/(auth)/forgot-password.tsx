import { zodResolver } from '@hookform/resolvers/zod';
import { SymbolView } from 'expo-symbols';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

import { OtpVerificationModal } from '@/components/auth/otp-verification-modal';
import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

const forgotPasswordSchema = z
  .object({
    identifier: z
      .string()
      .min(3, 'Please enter a valid mobile number or email address.'),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords must match.',
      path: ['confirmPassword'],
    }
  );

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1); // Step 1: Identifier & OTP, Step 2: New Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState<string>('');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const identifierValue = watch('identifier');

  // Trigger OTP sending for forgot password
  const handleSendOtp = async () => {
    setServerError(null);
    setSuccessMsg(null);

    if (!identifierValue || identifierValue.trim().length < 3) {
      setServerError('Please enter your mobile number or email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { identifier: identifierValue.trim() });
      setOtpModalVisible(true);
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || err.message || 'No account found with this identifier.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit password reset after OTP verification
  const handleResetPassword = async (data: ForgotPasswordValues) => {
    setServerError(null);
    setSuccessMsg(null);

    if (!data.newPassword || data.newPassword.length < 6) {
      setServerError('New password must be at least 6 characters.');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setServerError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        identifier: identifierValue.trim(),
        otp: verifiedOtpCode,
        newPassword: data.newPassword,
      });

      setSuccessMsg('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || err.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={s.brandHeader}>
          <Image
            source={require('@/assets/android/playstore-icon.png')}
            style={s.logoImage}
            resizeMode="contain"
          />
          <Text style={s.brandTitle}>FORGOT PASSWORD</Text>
          <Text style={s.brandTagline}>
            {step === 1
              ? 'Enter your registered mobile number or email address to verify & reset password.'
              : 'Enter your new password below to secure your account.'}
          </Text>
        </View>

        {/* Global Error Banner */}
        {!!serverError && (
          <View style={s.errorBanner}>
            <SymbolView
              name="exclamationmark.octagon.fill"
              size={18}
              tintColor="#EF4444"
            />
            <Text style={s.errorBannerText}>{serverError}</Text>
          </View>
        )}

        {/* Global Success Banner */}
        {!!successMsg && (
          <View style={s.successBanner}>
            <SymbolView
              name="checkmark.seal.fill"
              size={18}
              tintColor="#10B981"
            />
            <Text style={s.successBannerText}>{successMsg}</Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={s.formCard}>
          {step === 1 ? (
            /* STEP 1: Enter Mobile / Email & Trigger OTP */
            <>
              <View style={s.fieldGroup}>
                <Text style={s.label}>Mobile Number or Email *</Text>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.identifier && s.inputError]}>
                      <SymbolView
                        name="phone.fill"
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="+91 9876543210 or user@example.com"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onChangeText={(v) => {
                          onChange(v);
                          setServerError(null);
                        }}
                        onBlur={onBlur}
                      />
                    </View>
                  )}
                />
                {errors.identifier && (
                  <Text style={s.fieldError}>{errors.identifier.message}</Text>
                )}
              </View>

              <View style={{ marginTop: Spacing.three }}>
                <Pressable
                  style={({ pressed }) => [
                    s.primaryButton,
                    pressed && s.primaryButtonPressed,
                    loading && s.primaryButtonDisabled,
                  ]}
                  onPress={handleSendOtp}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={BLACK} />
                  ) : (
                    <>
                      <Text style={s.primaryButtonText}>SEND VERIFICATION OTP</Text>
                      <SymbolView
                        name="key.fill"
                        size={18}
                        tintColor={BLACK}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            /* STEP 2: Enter New Password & Confirm Password */
            <>
              {/* Verified Indicator */}
              <View style={s.verifiedChip}>
                <SymbolView
                  name="checkmark.circle.fill"
                  size={16}
                  tintColor="#10B981"
                />
                <Text style={s.verifiedChipText}>OTP VERIFIED FOR {identifierValue}</Text>
              </View>

              {/* New Password */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>New Password *</Text>
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.newPassword && s.inputError]}>
                      <SymbolView
                        name="lock.fill"
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="At least 6 characters"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={value}
                        onChangeText={(v) => {
                          onChange(v);
                          setServerError(null);
                        }}
                        onBlur={onBlur}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={s.eyeBtn}>
                        <SymbolView
                          name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                          size={18}
                          tintColor="rgba(255,255,255,0.6)"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.newPassword && (
                  <Text style={s.fieldError}>{errors.newPassword.message}</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Confirm New Password *</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.confirmPassword && s.inputError]}>
                      <SymbolView
                        name="lock.shield.fill"
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Re-enter your new password"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        value={value}
                        onChangeText={(v) => {
                          onChange(v);
                          setServerError(null);
                        }}
                        onBlur={onBlur}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={s.eyeBtn}>
                        <SymbolView
                          name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
                          size={18}
                          tintColor="rgba(255,255,255,0.6)"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={s.fieldError}>{errors.confirmPassword.message}</Text>
                )}
              </View>

              <View style={{ marginTop: Spacing.three }}>
                <Pressable
                  style={({ pressed }) => [
                    s.primaryButton,
                    pressed && s.primaryButtonPressed,
                    loading && s.primaryButtonDisabled,
                  ]}
                  onPress={handleSubmit(handleResetPassword)}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={BLACK} />
                  ) : (
                    <>
                      <Text style={s.primaryButtonText}>UPDATE PASSWORD & LOGIN</Text>
                      <SymbolView
                        name="arrow.right"
                        size={18}
                        tintColor={BLACK}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Back to Sign In link */}
        <View style={s.signinRow}>
          <Text style={s.signinText}>Remembered your password? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link">
              <Text style={s.signinLink}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      {/* OTP Verification Sheet Modal */}
      <OtpVerificationModal
        visible={otpModalVisible}
        phone={identifierValue}
        email={identifierValue}
        autoLogin={false}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={(data) => {
          setOtpModalVisible(false);
          const code = data?.otp || '123456';
          setVerifiedOtpCode(code);
          setStep(2);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

function makeStyles(_theme: any) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: BLACK },
    scroll: { flex: 1, backgroundColor: BLACK },
    scrollContent: {
      paddingHorizontal: Spacing.four,
      paddingTop: Platform.OS === 'ios' ? 60 : 48,
      paddingBottom: Spacing.seven,
    },
    brandHeader: {
      alignItems: 'center',
      marginBottom: Spacing.five,
    },
    logoImage: {
      width: 72,
      height: 72,
      marginBottom: Spacing.two,
    },
    brandTitle: {
      fontSize: FontSize.lg,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: 2,
    },
    brandTagline: {
      fontSize: FontSize.xs,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: 16,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      marginBottom: Spacing.four,
    },
    errorBannerText: {
      flex: 1,
      color: '#EF4444',
      fontSize: FontSize.xs,
      fontWeight: '700',
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
      marginBottom: Spacing.four,
    },
    successBannerText: {
      flex: 1,
      color: '#10B981',
      fontSize: FontSize.xs,
      fontWeight: '700',
    },
    formCard: {
      backgroundColor: DARK_CARD,
      borderWidth: 1,
      borderColor: BORDER,
      padding: Spacing.four,
      gap: Spacing.four,
      marginBottom: Spacing.five,
    },
    fieldGroup: { gap: Spacing.one },
    label: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: YELLOW,
      letterSpacing: 1,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
      paddingHorizontal: Spacing.three,
      height: 48,
    },
    inputError: { borderColor: '#EF4444' },
    inputIcon: { marginRight: Spacing.two },
    input: {
      flex: 1,
      color: '#fff',
      fontSize: FontSize.sm,
      fontWeight: '600',
      height: '100%',
    },
    eyeBtn: { padding: Spacing.one },
    fieldError: {
      fontSize: 10,
      color: '#EF4444',
      fontWeight: '700',
      marginTop: 2,
    },
    verifiedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 8,
    },
    verifiedChipText: {
      color: '#10B981',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      backgroundColor: YELLOW,
      height: 48,
    },
    primaryButtonPressed: { opacity: 0.8 },
    primaryButtonDisabled: { opacity: 0.5 },
    primaryButtonText: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: BLACK,
      letterSpacing: 1,
    },
    signinRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signinText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },
    signinLink: {
      fontSize: FontSize.sm,
      fontWeight: '900',
      color: YELLOW,
    },
  });
}
