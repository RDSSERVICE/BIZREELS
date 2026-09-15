import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
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

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { performGoogleAuth } from '@/features/auth/google-auth';
import { useRegister, useSendOtp } from '@/features/auth/mutations';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schema';
import { OtpVerificationModal } from '@/components/auth/otp-verification-modal';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

type PasswordRule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Includes uppercase and lowercase letters', test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: 'Includes a number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Includes a special character', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

interface DBSubCategory {
  id: string;
  name: string;
}

interface DBCategory {
  id: string;
  name: string;
  icon_url?: string;
  children?: DBSubCategory[];
}

export default function RegisterScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const { setUser } = useAuth();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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

  // Interest categories from DB
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Array<{ category: string; subcategory?: string | null }>>([]);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  const { mutate: register, isPending } = useRegister();
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp();

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const phoneValue = watch('phone');
  const emailValue = watch('email');
  const nameValue = watch('name');

  // Fetch live categories taxonomy from DB API when entering Step 2 or searching
  useEffect(() => {
    if (step === 2) {
      const handler = setTimeout(() => {
        setLoadingCategories(true);
        const searchParam = categorySearchQuery.trim()
          ? `&q=${encodeURIComponent(categorySearchQuery.trim())}`
          : '';

        api.get(`/categories?tree=true${searchParam}`)
          .then((res: any) => {
            const items = res.data?.items || res.data || [];
            const formatted = items
              .filter((c: any) => !c.parent_id && c.is_active !== false)
              .map((c: any) => ({
                id: c._id || c.id,
                name: c.name,
                icon_url: c.icon_url,
                children: (c.children || []).map((sub: any) => ({
                  id: sub._id || sub.id,
                  name: sub.name,
                })),
              }));
            setDbCategories(formatted);
          })
          .catch((err) => {
            console.warn('Failed to load DB categories during signup:', err);
          })
          .finally(() => setLoadingCategories(false));
      }, 300);

      return () => clearTimeout(handler);
    }
  }, [step, categorySearchQuery]);

  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'creator'>('customer');

  const handleNextStep = async () => {
    setServerError(null);
    if (!isVerified) {
      setServerError('Please verify your mobile number via OTP first.');
      return;
    }
    const valid = await trigger(['name', 'phone', 'email', 'password', 'confirmPassword']);
    if (valid) {
      setStep(2);
    }
  };

  const handleTriggerOtpModal = async () => {
    setServerError(null);
    const valid = await trigger(['name', 'phone', 'email', 'password', 'confirmPassword']);
    if (valid) {
      sendOtp(
        { phone: phoneValue, purpose: 'register' },
        {
          onSuccess: () => {
            setOtpModalVisible(true);
          },
          onError: (err) => {
            setServerError(err.message || 'Account with this phone number already exists. Please Sign In.');
          },
        }
      );
    }
  };

  const toggleInterest = (category: string, subcategory: string | null = null) => {
    setSelectedInterests((prev) => {
      const exists = prev.some((item) => item.category === category && item.subcategory === subcategory);
      if (exists) {
        return prev.filter((item) => !(item.category === category && item.subcategory === subcategory));
      } else {
        return [...prev, { category, subcategory }];
      }
    });
  };

  const isInterestSelected = (category: string, subcategory: string | null = null) => {
    return selectedInterests.some((item) => item.category === category && item.subcategory === subcategory);
  };

  function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    register(
      {
        ...values,
        role: selectedRole,
        interests: selectedInterests,
      },
      {
        onSuccess: () => {
          if (selectedRole === 'vendor') {
            router.replace('/vendor/onboarding');
          } else if (selectedRole === 'creator') {
            router.replace('/creator/onboarding' as any);
          } else {
            router.replace('/(tabs)');
          }
        },
        onError: (error) => {
          setServerError(error.message);
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
          <Text style={s.heading}>{step === 1 ? 'Create Account' : 'Choose Interests'}</Text>
          <Text style={s.subheading}>
            {step === 1
              ? 'Join BizReels and discover local products, verified vendors & personalized video reels.'
              : 'Select categories & subcategories to personalize your local feed. (Step 2 of 2)'}
          </Text>
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

          {step === 1 ? (
            /* STEP 1: Account Credentials */
            <>
              {/* Join As Role Selection */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>JOIN AS</Text>
                <View style={s.roleSelectorRow}>
                  {[
                    { id: 'customer', label: 'Customer', icon: 'bag-handle-outline' },
                    { id: 'vendor', label: 'Vendor', icon: 'storefront-outline' },
                    { id: 'creator', label: 'Creator', icon: 'videocam-outline' },
                  ].map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[s.roleCard, isSelected && s.roleCardSelected]}
                        onPress={() => setSelectedRole(r.id as any)}>
                        <Ionicons
                          name={r.icon as any}
                          size={18}
                          color={isSelected ? '#F59E0B' : AMBER_GOLD}
                        />
                        <Text style={[s.roleCardTitle, isSelected && s.roleCardTitleSelected]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Full Name */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Full Name</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.name && s.inputError]}>
                      <Ionicons name="person-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        accessibilityLabel="Full Name"
                      />
                    </View>
                  )}
                />
                {errors.name && <Text style={s.fieldError}>{errors.name.message}</Text>}
              </View>

              {/* Mobile Number */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Mobile Number</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.phone && s.inputError]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 }}>
                        <Text style={{ color: AMBER_GOLD, fontWeight: '900', fontSize: 13 }}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={s.input}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="next"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        accessibilityLabel="Mobile Number"
                      />
                    </View>
                  )}
                />
                {errors.phone && <Text style={s.fieldError}>{errors.phone.message}</Text>}
              </View>

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
                        placeholder="Enter your email address"
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
                <Text style={s.label}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.password && s.inputError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Create a password"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        onSubmitEditing={handleNextStep}
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

                {/* Password strength checklist */}
                <View style={s.rulesList}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(passwordValue ?? '');
                    return (
                      <View key={rule.label} style={s.ruleRow}>
                        <Ionicons
                          name={passed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={14}
                          color={passed ? AMBER_GOLD : TEXT_MUTED}
                        />
                        <Text style={[s.ruleText, passed && s.ruleTextPassed]}>{rule.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Confirm Password */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Confirm Password</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.confirmPassword && s.inputError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showConfirmPassword}
                        returnKeyType="done"
                        value={value}
                        onChangeText={(v) => { onChange(v); setServerError(null); }}
                        onBlur={onBlur}
                        onSubmitEditing={handleNextStep}
                        accessibilityLabel="Confirm Password"
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword((v) => !v)}
                        style={s.eyeButton}
                        accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        accessibilityRole="button">
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={AMBER_GOLD}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.confirmPassword?.message && (
                  <Text style={s.fieldError}>{errors.confirmPassword.message}</Text>
                )}
              </View>

              {/* Referral Code (Optional) */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Referral Code (Optional)</Text>
                <Controller
                  control={control}
                  name="referralCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={s.inputRow}>
                      <Ionicons name="gift-outline" size={18} color={AMBER_GOLD} style={s.inputIcon} />
                      <TextInput
                        style={s.input}
                        placeholder="Enter referral / promo code (e.g. BIZ100)"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        value={value}
                        onChangeText={(v) => onChange(v.toUpperCase())}
                        onBlur={onBlur}
                        accessibilityLabel="Referral Code"
                      />
                    </View>
                  )}
                />
              </View>

              {/* Primary Action Button: Send OTP & Verify */}
              <View style={{ gap: Spacing.three, marginTop: Spacing.two }}>
                {!isVerified ? (
                  <Pressable
                    style={({ pressed }) => [
                      s.primaryButton,
                      pressed && s.primaryButtonPressed,
                      isSendingOtp && s.primaryButtonDisabled,
                    ]}
                    onPress={handleTriggerOtpModal}
                    disabled={isSendingOtp}
                    accessibilityLabel="Verify OTP & Continue to Interests">
                    {isSendingOtp ? (
                      <ActivityIndicator color="#F59E0B" />
                    ) : (
                      <>
                        <Text style={s.primaryButtonText}>VERIFY OTP & CONTINUE</Text>
                        <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
                      </>
                    )}
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={s.primaryButton}
                    onPress={() => setStep(2)}>
                    <Text style={s.primaryButtonText}>✓ MOBILE VERIFIED — SELECT INTERESTS →</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* OR Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>OR SIGN UP WITH</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Google Auth Button */}
              <TouchableOpacity
                style={[s.googleButton, isGooglePending && s.googleButtonDisabled]}
                onPress={handleGoogleAuth}
                disabled={isGooglePending}
                accessibilityLabel="Sign up with Google"
                accessibilityRole="button">
                {isGooglePending ? (
                  <ActivityIndicator color={AMBER_GOLD} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#EA4335" />
                    <Text style={s.googleButtonText}>SIGN UP WITH GOOGLE</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* STEP 2: Category & Subcategory Interest Selection (Unlocked ONLY after OTP Verification) */
            <>
              <View style={s.interestHeaderRow}>
                <Text style={s.interestTitle}>CATEGORIES & SUBCATEGORIES</Text>
                <View style={s.selectedBadge}>
                  <Text style={s.selectedBadgeText}>
                    {selectedInterests.length} Selected
                  </Text>
                </View>
              </View>

              <Text style={s.interestSub}>
                Select at least 5 categories or subcategories from DB taxonomy below:
              </Text>

              {/* Category & Subcategory Live Keyword Search Bar */}
              <View style={s.searchBarRow}>
                <Ionicons name="search-outline" size={18} color={AMBER_GOLD} style={s.searchIcon} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search categories or subcategories..."
                  placeholderTextColor="#94A3B8"
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!!categorySearchQuery && (
                  <TouchableOpacity onPress={() => setCategorySearchQuery('')} style={s.clearSearchBtn}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {loadingCategories ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={AMBER_GOLD} />
                  <Text style={{ color: TEXT_MUTED, fontSize: FontSize.xs, marginTop: 8 }}>
                    Fetching categories from database...
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {(() => {
                    const q = categorySearchQuery.trim().toLowerCase();
                    const filtered = dbCategories.filter((cat) => {
                      if (!q) return true;
                      const catMatch = cat.name.toLowerCase().includes(q);
                      const subMatch = (cat.children || []).some((sub) => sub.name.toLowerCase().includes(q));
                      return catMatch || subMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <View style={{ paddingVertical: 24, alignItems: 'center', gap: 6 }}>
                          <Ionicons name="search-outline" size={28} color={AMBER_GOLD} />
                          <Text style={{ color: TEXT_MUTED, fontSize: FontSize.xs, fontWeight: '700' }}>
                            No categories matching "{categorySearchQuery}"
                          </Text>
                        </View>
                      );
                    }

                    return filtered.map((cat) => {
                      const isCatSelected = isInterestSelected(cat.name, null);
                      const subCount = selectedInterests.filter((i) => i.category === cat.name && i.subcategory).length;
                      const matchingSubs = (cat.children || []).filter((sub) => {
                        if (!q) return true;
                        return cat.name.toLowerCase().includes(q) || sub.name.toLowerCase().includes(q);
                      });
                      const isExpanded = expandedCatId === cat.id || (!!q && matchingSubs.length > 0);

                      return (
                        <View key={cat.id} style={s.catCard}>
                          {/* Parent Category Header */}
                          <TouchableOpacity
                            style={s.catCardHeader}
                            onPress={() => setExpandedCatId(isExpanded && !q ? null : cat.id)}>
                            <TouchableOpacity
                              style={[s.catCheckBtn, isCatSelected && s.catCheckBtnActive]}
                              onPress={() => toggleInterest(cat.name, null)}>
                              <Ionicons
                                name={isCatSelected ? 'checkmark' : 'add'}
                                size={14}
                                color={isCatSelected ? '#FFFFFF' : TEXT_DARK}
                              />
                            </TouchableOpacity>

                            <View style={{ flex: 1 }}>
                              <Text style={s.catName}>{cat.name}</Text>
                              {subCount > 0 && (
                                <Text style={s.subCountBadge}>{subCount} subcategory selected</Text>
                              )}
                            </View>

                            {cat.children && cat.children.length > 0 && (
                              <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={AMBER_GOLD}
                              />
                            )}
                          </TouchableOpacity>

                          {/* Subcategories Accordion */}
                          {isExpanded && matchingSubs.length > 0 && (
                            <View style={s.subsContainer}>
                              {matchingSubs.map((sub) => {
                                const isSubSelected = isInterestSelected(cat.name, sub.name);
                                return (
                                  <TouchableOpacity
                                    key={sub.id}
                                    style={[s.subChip, isSubSelected && s.subChipActive]}
                                    onPress={() => toggleInterest(cat.name, sub.name)}>
                                    <Ionicons
                                      name={isSubSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                      size={12}
                                      color={isSubSelected ? '#F59E0B' : TEXT_MUTED}
                                    />
                                    <Text style={[s.subText, isSubSelected && s.subTextActive]}>
                                      {sub.name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    });
                  })()}
                </View>
              )}

              {/* Complete Registration Button */}
              <Pressable
                style={({ pressed }) => [
                  s.primaryButton,
                  pressed && s.primaryButtonPressed,
                  isPending && s.primaryButtonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}>
                {isPending ? (
                  <ActivityIndicator color="#F59E0B" />
                ) : (
                  <>
                    <Text style={s.primaryButtonText}>
                      Create Account ({selectedInterests.length} Selected)
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
                  </>
                )}
              </Pressable>

              <TouchableOpacity style={s.backToStep1Btn} onPress={() => setStep(1)}>
                <Text style={s.backToStep1Text}>← Edit Name & Password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign in link */}
        <View style={s.signinRow}>
          <Text style={s.signinText}>Already have an account? </Text>
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
        phone={phoneValue}
        email={emailValue}
        name={nameValue}
        role={selectedRole}
        autoLogin={false}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={() => {
          setIsVerified(true);
          setOtpModalVisible(false);
          setStep(2);
        }}
      />
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
    label: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: TEXT_DARK,
      letterSpacing: 0.5,
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
    inputError: { borderColor: '#DC2626' },
    inputIcon: { marginRight: Spacing.two },
    input: {
      flex: 1,
      fontSize: FontSize.sm,
      color: TEXT_DARK,
      height: '100%',
      fontWeight: FontWeight.semibold,
    },
    eyeButton: { padding: Spacing.one },
    fieldError: {
      fontSize: FontSize.xs,
      color: '#DC2626',
      marginTop: 2,
      fontWeight: '700',
    },
    rulesList: { gap: Spacing.one, marginTop: Spacing.one },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    ruleText: { fontSize: FontSize.xs, color: TEXT_MUTED, fontWeight: '700' },
    ruleTextPassed: { color: AMBER_GOLD },
    primaryButton: {
      backgroundColor: PRIMARY_BTN_BG,
      borderRadius: 14,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      marginTop: 8,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonPressed: { opacity: 0.8 },
    primaryButtonDisabled: { opacity: 0.6 },
    primaryButtonText: {
      color: '#F59E0B',
      fontSize: FontSize.sm,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    interestHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    interestTitle: {
      color: AMBER_GOLD,
      fontSize: FontSize.sm,
      fontWeight: '900',
      letterSpacing: 1,
    },
    selectedBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    selectedBadgeText: {
      color: AMBER_GOLD,
      fontSize: 10,
      fontWeight: '900',
    },
    interestSub: {
      color: TEXT_MUTED,
      fontSize: FontSize.xs,
    },
    catCard: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 12,
      padding: Spacing.two,
    },
    catCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    catCheckBtn: {
      width: 22,
      height: 22,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CARD_BG,
    },
    catCheckBtnActive: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    catName: {
      color: TEXT_DARK,
      fontSize: FontSize.sm,
      fontWeight: '900',
    },
    subCountBadge: {
      color: AMBER_GOLD,
      fontSize: 9,
      fontWeight: '700',
    },
    subsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingTop: 8,
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: BORDER,
    },
    subChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: CARD_BG,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 8,
    },
    subChipActive: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    subText: {
      color: TEXT_MUTED,
      fontSize: 10,
      fontWeight: '700',
    },
    subTextActive: {
      color: '#F59E0B',
      fontWeight: '900',
    },
    backToStep1Btn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    backToStep1Text: {
      color: TEXT_MUTED,
      fontSize: FontSize.xs,
      fontWeight: '700',
    },
    signinRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signinText: { fontSize: FontSize.sm, color: TEXT_MUTED },
    signinLink: {
      fontSize: FontSize.sm,
      fontWeight: '900',
      color: AMBER_GOLD,
    },
    // Join As Role Selector Styles
    roleSelectorRow: {
      flexDirection: 'row',
      gap: Spacing.two,
      marginTop: 4,
    },
    roleCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: BORDER,
      paddingVertical: 10,
      borderRadius: 12,
    },
    roleCardSelected: {
      backgroundColor: PRIMARY_BTN_BG,
      borderColor: PRIMARY_BTN_BG,
    },
    roleCardTitle: {
      color: TEXT_DARK,
      fontSize: FontSize.xs,
      fontWeight: '900',
    },
    roleCardTitleSelected: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    secondaryStepBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: CARD_BG,
    },
    secondaryStepBtnText: {
      color: TEXT_MUTED,
      fontSize: FontSize.xs,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    searchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: BORDER,
      paddingHorizontal: Spacing.three,
      height: 46,
      borderRadius: 12,
      marginVertical: Spacing.two,
    },
    searchIcon: {
      marginRight: Spacing.two,
    },
    searchInput: {
      flex: 1,
      color: TEXT_DARK,
      fontSize: FontSize.xs,
      fontWeight: '700',
      height: '100%',
    },
    clearSearchBtn: {
      padding: Spacing.one,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 4,
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
      fontSize: FontSize.xs,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
}

