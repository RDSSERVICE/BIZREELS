import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { useAuth } from '@/features/auth/context';
import { performGoogleAuth } from '@/features/auth/google-auth';
import { useLogin, useSendOtp, useVerifyOtp } from '@/features/auth/mutations';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { setUser } = useAuth();
  const [isGooglePending, setIsGooglePending] = useState(false);

  // Auth Mode: 'email' or 'phone'
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');

  // Selected Role
  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'creator'>('customer');

  // Email form state
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleGoogleAuth() {
    setServerError(null);
    setIsGooglePending(true);
    const res = await performGoogleAuth(setUser);
    setIsGooglePending(false);
    if (res.success) {
      router.replace('/(tabs)/home');
    } else if (res.message && !res.message.includes('cancelled')) {
      setServerError(res.message);
    }
  }

  // Phone / Email OTP state
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 6-digit OTP Box state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpBoxChange = (text: string, index: number) => {
    setServerError(null);
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      setOtpCode(newDigits.join(''));
      const nextIdx = Math.min(pasted.length - 1, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

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
          setOtpDigits(['', '', '', '', '', '']);
          setOtpCode('');
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 300);
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

  function handleVerifyOtp(codeOverride?: string) {
    setServerError(null);
    const code = codeOverride || otpDigits.join('') || otpCode;
    if (!code || code.length < 6) {
      setServerError('Please enter the complete 6-digit OTP code.');
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
        otp: code.trim(),
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
          <View style={s.logoWrapper}>
            <Image
              source={require('@/assets/android/playstore-icon.png')}
              style={s.logo}
              contentFit="contain"
            />
          </View>
          <Text style={s.heading}>Welcome Back</Text>
          <Text style={s.subheading}>
            Sign in to your BizReels account to access local products, video reels & seller tools.
          </Text>
        </View>

        {/* Role Selection Selector */}
        <View style={s.roleSelectorBox}>
          <Text style={s.roleSelectorLabel}>SELECT YOUR ROLE</Text>
          <View style={s.rolePillsRow}>
            {[
              { id: 'customer', label: 'Customer', icon: 'person-outline', desc: 'Browse & Buy' },
              { id: 'vendor', label: 'Vendor', icon: 'storefront-outline', desc: 'Sell & Reel Ads' },
              { id: 'creator', label: 'Creator', icon: 'videocam-outline', desc: 'Promote & Earn' },
            ].map((r) => {
              const isSel = selectedRole === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={[s.roleCard, isSel && s.roleCardActive]}
                  onPress={() => setSelectedRole(r.id as any)}>
                  <Ionicons
                    name={r.icon as any}
                    size={18}
                    color={isSel ? '#F59E0B' : AMBER_GOLD}
                  />
                  <Text style={[s.roleCardTitle, isSel && s.roleCardTitleActive]}>
                    {r.label}
                  </Text>
                  <Text style={[s.roleCardSub, isSel && s.roleCardSubActive]}>
                    {r.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              size={15}
              color={authMode === 'email' ? '#F59E0B' : TEXT_MUTED}
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
              size={15}
              color={authMode === 'phone' ? '#F59E0B' : TEXT_MUTED}
            />
            <Text style={[s.modeTabText, authMode === 'phone' && s.modeTabTextActive]}>
              MOBILE OTP
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={s.card}>

          {/* Server error banner */}
          {serverError && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
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
                      <Ionicons name="mail-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#94A3B8"
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
                      <Ionicons name="lock-closed-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
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
                          color={AMBER_GOLD}
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
                  <ActivityIndicator color="#F59E0B" />
                ) : (
                  <>
                    <Text style={s.primaryButtonText}>SIGN IN NOW</Text>
                    <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── MODE 2: MOBILE PHONE OTP ── */}
          {authMode === 'phone' && (
            <>
              {otpSent ? (
                <View style={s.fieldGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={s.label}>ENTER 6-DIGIT VERIFICATION CODE</Text>
                    <TouchableOpacity onPress={() => { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); setOtpCode(''); }}>
                      <Text style={{ color: AMBER_GOLD, fontSize: 11, fontWeight: '800' }}>Edit Number ›</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ color: TEXT_MUTED, fontSize: 11, marginBottom: 12 }}>
                    Code sent to {identifier}
                  </Text>

                  {/* 6 Digit Boxes Row */}
                  <View style={s.otpBoxRow}>
                    {otpDigits.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          otpInputRefs.current[index] = ref;
                        }}
                        style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        textContentType="oneTimeCode"
                        autoComplete="sms-otp"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleOtpBoxChange(text, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[s.primaryButton, isVerifyOtpPending && s.primaryButtonDisabled, { marginTop: 16 }]}
                    onPress={() => handleVerifyOtp()}
                    disabled={isVerifyOtpPending}>
                    {isVerifyOtpPending ? (
                      <ActivityIndicator color="#F59E0B" />
                    ) : (
                      <>
                        <Text style={s.primaryButtonText}>VERIFY & SIGN IN</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={countdown > 0 || isSendOtpPending}
                    onPress={handleSendOtp}
                    style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={{ color: countdown > 0 ? TEXT_MUTED : AMBER_GOLD, fontSize: FontSize.xs, fontWeight: '700' }}>
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : "Didn't receive OTP? Resend Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Email or Phone Input */}
                  <View style={s.fieldGroup}>
                    <Text style={s.label}>Email Address or Mobile Number</Text>
                    <View style={s.inputRow}>
                      <Ionicons name="person-circle-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Enter email or 10-digit mobile number"
                        placeholderTextColor="#94A3B8"
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

                  <TouchableOpacity
                    style={[s.primaryButton, isSendOtpPending && s.primaryButtonDisabled]}
                    onPress={handleSendOtp}
                    disabled={isSendOtpPending}>
                    {isSendOtpPending ? (
                      <ActivityIndicator color="#F59E0B" />
                    ) : (
                      <>
                        <Text style={s.primaryButtonText}>SEND OTP CODE</Text>
                        <Ionicons name="send" size={16} color="#F59E0B" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* OR Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR CONTINUE WITH</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Google Auth Button */}
          <TouchableOpacity
            style={[s.googleButton, isGooglePending && s.googleButtonDisabled]}
            onPress={handleGoogleAuth}
            disabled={isGooglePending}
            accessibilityLabel="Continue with Google"
            accessibilityRole="button">
            {isGooglePending ? (
              <ActivityIndicator color={AMBER_GOLD} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={s.googleButtonText}>CONTINUE WITH GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>
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

        {/* Security note & Privacy Policy */}
        <View style={s.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color={AMBER_GOLD} />
          <View style={{ flex: 1 }}>
            <Text style={s.securityTitle}>Your information is secure with us.</Text>
            <Text style={s.securitySub}>We use encrypted token authentication.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{ alignItems: 'center', paddingVertical: 12 }}
          onPress={() => Linking.openURL('https://bizreels.in/privacy-policy')}
        >
          <Text style={{ color: TEXT_MUTED, fontSize: 11, textDecorationLine: 'underline' }}>
            Terms of Service &amp; Privacy Policy (https://bizreels.in/privacy-policy)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BG_LIGHT = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const AMBER_GOLD = '#D97706';
const PRIMARY_BTN_BG = '#241B15';

function makeStyles(_theme: any) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: BG_LIGHT },
    scroll: { flex: 1, backgroundColor: BG_LIGHT },
    scrollContent: {
      paddingHorizontal: Spacing.four,
      paddingTop: Platform.OS === 'ios' ? 60 : 48,
      paddingBottom: Spacing.seven,
      gap: Spacing.four,
    },
    pressed: { opacity: 0.6 },
    headerSection: { gap: Spacing.two, alignItems: 'center', textAlign: 'center' },
    logoWrapper: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    logo: { width: 44, height: 44 },
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    heading: {
      fontSize: FontSize['2xl'],
      fontWeight: '900',
      color: TEXT_DARK,
      letterSpacing: 0.5,
    },
    sparkle: { fontSize: FontSize.lg, color: AMBER_GOLD },
    subheading: {
      fontSize: FontSize.xs,
      color: TEXT_MUTED,
      lineHeight: 18,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    modeTabContainer: {
      flexDirection: 'row',
      backgroundColor: '#F1F5F9',
      borderRadius: 14,
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
      borderRadius: 10,
      backgroundColor: 'transparent',
    },
    modeTabBtnActive: {
      backgroundColor: PRIMARY_BTN_BG,
    },
    modeTabText: {
      color: TEXT_MUTED,
      fontSize: FontSize.xs,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    modeTabTextActive: {
      color: '#F59E0B',
    },
    roleSelectorBox: {
      backgroundColor: CARD_BG,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: BORDER,
      padding: Spacing.three,
      gap: 8,
    },
    roleSelectorLabel: {
      color: AMBER_GOLD,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },
    rolePillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    roleCard: {
      flex: 1,
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: BORDER,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    roleCardActive: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    roleCardTitle: {
      color: TEXT_DARK,
      fontSize: 11,
      fontWeight: '900',
    },
    roleCardTitleActive: {
      color: '#FFFFFF',
    },
    roleCardSub: {
      color: TEXT_MUTED,
      fontSize: 8.5,
      fontWeight: '600',
    },
    roleCardSubActive: {
      color: '#F59E0B',
      fontWeight: '700',
    },
    rolePill: {
      flex: 1,
      height: 36,
      backgroundColor: CARD_BG,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: BORDER,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rolePillActive: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    rolePillText: {
      color: TEXT_MUTED,
      fontSize: 10,
      fontWeight: '900',
    },
    rolePillTextActive: {
      color: '#F59E0B',
    },
    channelBtn: {
      flex: 1,
      height: 40,
      backgroundColor: CARD_BG,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: BORDER,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    channelBtnActive: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    channelBtnText: {
      color: TEXT_DARK,
      fontSize: FontSize.xs,
      fontWeight: '900',
    },
    channelBtnTextActive: {
      color: '#F59E0B',
    },
    card: {
      backgroundColor: CARD_BG,
      borderRadius: 20,
      padding: Spacing.five,
      gap: Spacing.four,
      borderWidth: 1,
      borderColor: BORDER,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    // Inline server error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
      borderRadius: 12,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    errorBannerText: {
      flex: 1,
      fontSize: FontSize.xs,
      color: '#DC2626',
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
      color: TEXT_DARK,
      letterSpacing: 0.5,
    },
    forgotLink: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: AMBER_GOLD,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      paddingHorizontal: Spacing.three,
      height: 50,
    },
    inputError: { borderColor: '#EF4444' },
    inputIcon: { marginRight: Spacing.two },
    input: {
      flex: 1,
      fontSize: FontSize.sm,
      color: TEXT_DARK,
      height: '100%',
      fontWeight: '600',
    },
    eyeButton: { padding: Spacing.one },
    otpBoxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
      marginVertical: 4,
    },
    otpBox: {
      flex: 1,
      height: 48,
      borderWidth: 1.5,
      borderColor: BORDER,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      color: TEXT_DARK,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    otpBoxFilled: {
      borderColor: AMBER_GOLD,
      backgroundColor: '#FEF3C7',
    },
    fieldError: {
      fontSize: 11,
      color: '#DC2626',
      marginTop: 2,
      fontWeight: '600',
    },
    primaryButton: {
      height: 50,
      backgroundColor: PRIMARY_BTN_BG,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    primaryButtonPressed: { opacity: 0.8 },
    primaryButtonDisabled: { opacity: 0.6 },
    primaryButtonText: {
      color: '#F59E0B',
      fontSize: FontSize.sm,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerText: {
      fontSize: FontSize.sm,
      color: TEXT_MUTED,
    },
    registerLink: {
      fontSize: FontSize.sm,
      fontWeight: '900',
      color: AMBER_GOLD,
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
      backgroundColor: '#F8F4EC',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E3DCCB',
      padding: Spacing.three,
    },
    securityTitle: {
      fontSize: FontSize.xs,
      fontWeight: '800',
      color: TEXT_DARK,
    },
    securitySub: {
      fontSize: 11,
      color: TEXT_MUTED,
      marginTop: 1,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.three,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: BORDER,
    },
    dividerText: {
      color: TEXT_MUTED,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },
    googleButton: {
      backgroundColor: CARD_BG,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: BORDER,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    googleButtonDisabled: { opacity: 0.6 },
    googleButtonText: {
      color: TEXT_DARK,
      fontSize: FontSize.sm,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
}
