import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
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

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { useLogin, useSendOtp, useVerifyOtp } from '@/features/auth/mutations';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);

  // Auth Mode: 'email' or 'phone'
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');

  // Selected Role
  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'creator'>('customer');

  // Email form state
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Phone / Email OTP state
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { mutate: login, isPending: isEmailLoginPending } = useLogin();
  const { mutate: triggerSendOtp, isPending: isSendOtpPending } = useSendOtp();
  const { mutate: triggerVerifyOtp, isPending: isVerifyOtpPending } = useVerifyOtp(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  function onSubmitEmail(values: LoginFormValues) {
    setServerError(null);
    login(
      { ...values, role: selectedRole } as any,
      {
        onError: (error) => {
          setServerError(error.message || 'Invalid email or password.');
        },
      }
    );
  }

  function handleSendOtp() {
    setServerError(null);
    const cleaned = identifier.trim();
    if (!cleaned) {
      setServerError('Please enter a valid email address or 10-digit mobile number.');
      return;
    }

    const isEmail = cleaned.includes('@');
    let phoneVal = '';
    let emailVal = '';

    if (isEmail) {
      emailVal = cleaned.toLowerCase();
    } else {
      const barePhone = cleaned.replace(/\D/g, '');
      if (barePhone.length < 10) {
        setServerError('Please enter a valid 10-digit mobile number or email address.');
        return;
      }
      phoneVal = cleaned.startsWith('+') ? cleaned : `+91${barePhone}`;
    }

    const targetVal = isEmail ? emailVal : phoneVal;

    triggerSendOtp(
      {
        phone: phoneVal,
        email: emailVal,
        identifier: targetVal,
        purpose: 'login',
      } as any,
      {
        onSuccess: (data) => {
          setOtpSent(true);
          setCountdown(60);
          Alert.alert(
            'OTP Dispatched',
            data.message || `A 6-digit verification code has been sent to ${targetVal}.`
          );
        },
        onError: (err: any) => {
          setServerError(err?.response?.data?.message || err.message || 'Failed to send OTP. Please check your credentials.');
        },
      }
    );
  }

  function handleVerifyOtp() {
    setServerError(null);
    if (!otpCode || otpCode.length < 6) {
      setServerError('Please enter the 6-digit OTP code.');
      return;
    }

    const cleaned = identifier.trim();
    const isEmail = cleaned.includes('@');
    const phoneVal = isEmail ? '' : (cleaned.startsWith('+') ? cleaned : `+91${cleaned.replace(/\D/g, '')}`);
    const emailVal = isEmail ? cleaned.toLowerCase() : '';
    const targetVal = isEmail ? emailVal : phoneVal;

    triggerVerifyOtp(
      {
        phone: phoneVal,
        email: emailVal,
        identifier: targetVal,
        otp: otpCode.trim(),
        purpose: 'login',
      } as any,
      {
        onError: (err: any) => {
          setServerError(err?.response?.data?.message || err.message || 'Invalid or expired OTP code.');
        },
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Logo + heading */}
        <View style={s.headerSection}>
          <Image
            source={require('@/assets/android/playstore-icon.png')}
            style={s.logo}
            contentFit="contain"
          />
          <View style={s.headingRow}>
            <Text style={s.heading}>Welcome Back</Text>
          </View>
          <Text style={s.subheading}>
            Sign in to your BizReels account to access local products, video reels & seller tools.
          </Text>
        </View>

        {/* Auth Mode Switcher Tabs */}
        <View style={s.modeTabContainer}>
          <TouchableOpacity
            style={[s.modeTabBtn, authMode === 'email' && s.modeTabBtnActive]}
            onPress={() => {
              setAuthMode('email');
              setServerError(null);
            }}>
            <Ionicons
              name="mail-outline"
              size={16}
              color={authMode === 'email' ? BLACK : YELLOW}
            />
            <Text style={[s.modeTabText, authMode === 'email' && s.modeTabTextActive]}>
              EMAIL SIGN IN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modeTabBtn, authMode === 'phone' && s.modeTabBtnActive]}
            onPress={() => {
              setAuthMode('phone');
              setServerError(null);
            }}>
            <Ionicons
              name="call-outline"
              size={16}
              color={authMode === 'phone' ? BLACK : YELLOW}
            />
            <Text style={[s.modeTabText, authMode === 'phone' && s.modeTabTextActive]}>
              MOBILE OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Role Selection Selector */}
        <View style={s.roleSelectorBox}>
          <Text style={s.roleSelectorLabel}>SELECT TARGET ROLE</Text>
          <View style={s.rolePillsRow}>
            {(['customer', 'vendor', 'creator'] as const).map((role) => {
              const isSel = selectedRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  style={[s.rolePill, isSel && s.rolePillActive]}
                  onPress={() => setSelectedRole(role)}>
                  <Text style={[s.rolePillText, isSel && s.rolePillTextActive]}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form card */}
        <View style={s.card}>

          {/* Server error banner */}
          {serverError && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={s.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* ── MODE 1: EMAIL & PASSWORD ── */}
          {authMode === 'email' && (
            <>
              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, (errors.email || !!serverError) && s.inputError]}>
                      <Ionicons name="mail-outline" size={18} color={YELLOW} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your email address"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="next"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        accessibilityLabel="Email Address"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={s.fieldError}>{errors.email.message}</Text>}
              </View>

              {/* Password */}
              <View style={s.fieldGroup}>
                <View style={s.labelRow}>
                  <Text style={s.label}>Password</Text>
                  <Pressable
                    onPress={() => router.push('/(auth)/forgot-password')}
                    accessibilityRole="link"
                    accessibilityLabel="Forgot password">
                    <Text style={s.forgotLink}>Forgot Password?</Text>
                  </Pressable>
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, (errors.password || !!serverError) && s.inputError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={YELLOW} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        onSubmitEditing={handleSubmit(onSubmitEmail)}
                        accessibilityLabel="Password"
                      />
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        style={s.eyeButton}
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        accessibilityRole="button">
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={YELLOW}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password && <Text style={s.fieldError}>{errors.password.message}</Text>}
              </View>

              {/* Sign In button */}
              <TouchableOpacity
                style={[s.primaryButton, isEmailLoginPending && s.primaryButtonDisabled]}
                onPress={handleSubmit(onSubmitEmail)}
                disabled={isEmailLoginPending}
                accessibilityLabel="Sign In"
                accessibilityRole="button">
                {isEmailLoginPending ? (
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <>
                    <Text style={s.primaryButtonText}>SIGN IN NOW</Text>
                    <Ionicons name="arrow-forward" size={18} color={BLACK} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── MODE 2: MOBILE PHONE OTP ── */}
          {authMode === 'phone' && (
            <>
              {/* Email or Phone Input */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Email Address or Mobile Number</Text>
                <View style={s.inputRow}>
                  <Ionicons name="person-circle-outline" size={18} color={YELLOW} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Enter email or 10-digit mobile number"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={identifier}
                    onChangeText={(v) => {
                      setIdentifier(v);
                      setServerError(null);
                    }}
                  />
                </View>
              </View>



              {/* OTP Sent Section */}
              {otpSent ? (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Enter 6-Digit OTP Code</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="key-outline" size={18} color={YELLOW} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="e.g. 123456"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={(v) => {
                        setOtpCode(v);
                        setServerError(null);
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={[s.primaryButton, isVerifyOtpPending && s.primaryButtonDisabled, { marginTop: 12 }]}
                    onPress={handleVerifyOtp}
                    disabled={isVerifyOtpPending}>
                    {isVerifyOtpPending ? (
                      <ActivityIndicator color={BLACK} />
                    ) : (
                      <>
                        <Text style={s.primaryButtonText}>VERIFY & SIGN IN</Text>
                        <Ionicons name="checkmark-circle" size={18} color={BLACK} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={countdown > 0 || isSendOtpPending}
                    onPress={handleSendOtp}
                    style={{ marginTop: 10, alignItems: 'center' }}>
                    <Text style={{ color: countdown > 0 ? 'rgba(255,255,255,0.4)' : YELLOW, fontSize: FontSize.xs, fontWeight: '700' }}>
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Didn\'t receive OTP? Resend Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.primaryButton, isSendOtpPending && s.primaryButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isSendOtpPending}>
                  {isSendOtpPending ? (
                    <ActivityIndicator color={BLACK} />
                  ) : (
                    <>
                      <Text style={s.primaryButtonText}>SEND OTP CODE</Text>
                      <Ionicons name="send" size={16} color={BLACK} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Register link */}
        <View style={s.registerRow}>
          <Text style={s.registerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable accessibilityRole="link">
              <Text style={s.registerLink}>Create Account</Text>
            </Pressable>
          </Link>
        </View>

        {/* Security note */}
        <View style={s.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={YELLOW} />
          <View>
            <Text style={s.securityTitle}>Your information is secure with us.</Text>
            <Text style={s.securitySub}>We use encrypted token authentication.</Text>
          </View>
        </View>
      </ScrollView>
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
      gap: Spacing.four,
    },
    pressed: { opacity: 0.6 },
    headerSection: { gap: Spacing.two },
    logo: { width: 52, height: 52, marginBottom: Spacing.one },
    headingRow: { flexDirection: 'row', alignItems: 'center' },
    heading: {
      fontSize: FontSize['2xl'],
      fontWeight: '900',
      color: '#fff',
      letterSpacing: 1,
    },
    sparkle: { fontSize: FontSize.lg, color: YELLOW },
    subheading: {
      fontSize: FontSize.sm,
      color: 'rgba(255,255,255,0.6)',
      lineHeight: 20,
    },
    modeTabContainer: {
      flexDirection: 'row',
      backgroundColor: DARK_CARD,
      borderWidth: 1,
      borderColor: BORDER,
      padding: 4,
    },
    modeTabBtn: {
      flex: 1,
      flexDirection: 'row',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'transparent',
    },
    modeTabBtnActive: {
      backgroundColor: YELLOW,
    },
    modeTabText: {
      color: YELLOW,
      fontSize: FontSize.xs,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    modeTabTextActive: {
      color: BLACK,
    },
    roleSelectorBox: {
      backgroundColor: DARK_CARD,
      borderWidth: 1,
      borderColor: BORDER,
      padding: Spacing.three,
      gap: 8,
    },
    roleSelectorLabel: {
      color: YELLOW,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },
    rolePillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    rolePill: {
      flex: 1,
      height: 36,
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rolePillActive: {
      backgroundColor: YELLOW,
      borderColor: YELLOW,
    },
    rolePillText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 10,
      fontWeight: '900',
    },
    rolePillTextActive: {
      color: BLACK,
    },
    channelBtn: {
      flex: 1,
      height: 40,
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    channelBtnActive: {
      backgroundColor: YELLOW,
      borderColor: YELLOW,
    },
    channelBtnText: {
      color: '#fff',
      fontSize: FontSize.xs,
      fontWeight: '900',
    },
    channelBtnTextActive: {
      color: BLACK,
    },
    card: {
      backgroundColor: DARK_CARD,
      borderRadius: 0,
      padding: Spacing.five,
      gap: Spacing.four,
      borderWidth: 2,
      borderColor: YELLOW,
    },
    // Inline server error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderWidth: 1,
      borderColor: '#EF4444',
      borderRadius: 0,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    errorBannerText: {
      flex: 1,
      fontSize: FontSize.xs,
      color: '#EF4444',
      lineHeight: 18,
      fontWeight: '700',
    },
    fieldGroup: { gap: Spacing.one },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: 0.5,
    },
    forgotLink: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: YELLOW,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 0,
      backgroundColor: BLACK,
      paddingHorizontal: Spacing.three,
      height: 48,
    },
    inputError: { borderColor: '#EF4444' },
    inputIcon: { marginRight: Spacing.two },
    input: {
      flex: 1,
      fontSize: FontSize.sm,
      color: '#fff',
      height: '100%',
      fontWeight: '600',
    },
    eyeButton: { padding: Spacing.one },
    fieldError: {
      fontSize: FontSize.xs,
      color: '#EF4444',
      marginTop: 2,
      fontWeight: '700',
    },
    primaryButton: {
      backgroundColor: YELLOW,
      borderRadius: 0,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
    },
    primaryButtonPressed: { opacity: 0.8 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonText: {
      color: BLACK,
      fontSize: FontSize.base,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },
    registerLink: {
      fontSize: FontSize.sm,
      fontWeight: '900',
      color: YELLOW,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      paddingHorizontal: Spacing.four,
    },
    securityTitle: {
      fontSize: FontSize.xs,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.5)',
    },
    securitySub: {
      fontSize: FontSize.xs,
      color: 'rgba(255,255,255,0.4)',
    },
  });
}
