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

import { BrandColors, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
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
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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
    getValues,
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
          <Image
            source={require('@/assets/android/playstore-icon.png')}
            style={s.logo}
            contentFit="contain"
          />
          <View style={s.headingRow}>
            <Text style={s.heading}>{step === 1 ? 'Create Account' : 'Choose Interests'}</Text>
          </View>
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
              <SymbolView
                name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
                size={16}
                tintColor={BrandColors.error}
              />
              <Text style={s.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {step === 1 ? (
            /* STEP 1: Account Credentials */
            <>
              {/* Join As Role Selection */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>JOIN AS *</Text>
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
                          color={isSelected ? BLACK : YELLOW}
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
                      <SymbolView
                        name={{ ios: 'person', android: 'person', web: 'person' }}
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your full name"
                        placeholderTextColor={theme.placeholder}
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
                <Text style={s.label}>Mobile Number *</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[s.inputRow, errors.phone && s.inputError]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 6 }}>
                        <Text style={{ color: YELLOW, fontWeight: '900', fontSize: 13 }}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={s.input}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor={theme.placeholder}
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
                      <SymbolView
                        name={{ ios: 'envelope', android: 'email', web: 'email' }}
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Enter your email address"
                        placeholderTextColor={theme.placeholder}
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
                      <SymbolView
                        name={{ ios: 'lock', android: 'lock', web: 'lock' }}
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Create a password"
                        placeholderTextColor={theme.placeholder}
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
                        <SymbolView
                          name={
                            showPassword
                              ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                              : { ios: 'eye', android: 'visibility', web: 'visibility' }
                          }
                          size={18}
                          tintColor={theme.textSecondary}
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
                        <SymbolView
                          name={
                            passed
                              ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                              : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
                          }
                          size={14}
                          tintColor={passed ? BrandColors.success : theme.textSecondary}
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
                      <SymbolView
                        name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                        size={18}
                        tintColor={BrandColors.primary}
                        style={s.inputIcon}
                      />
                      <TextInput
                        style={s.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor={theme.placeholder}
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
                        <SymbolView
                          name={
                            showConfirmPassword
                              ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                              : { ios: 'eye', android: 'visibility', web: 'visibility' }
                          }
                          size={18}
                          tintColor={theme.textSecondary}
                        />
                      </Pressable>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={s.fieldError}>{errors.confirmPassword.message}</Text>
                )}
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
                      <ActivityIndicator color={BLACK} />
                    ) : (
                      <>
                        <Text style={s.primaryButtonText}>VERIFY OTP & CONTINUE</Text>
                        <SymbolView
                          name={{ ios: 'shield.checkmark', android: 'security', web: 'security' }}
                          size={18}
                          tintColor={BLACK}
                        />
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
                <Ionicons name="search-outline" size={18} color={YELLOW} style={s.searchIcon} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search categories or subcategories..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!!categorySearchQuery && (
                  <TouchableOpacity onPress={() => setCategorySearchQuery('')} style={s.clearSearchBtn}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>

              {loadingCategories ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={YELLOW} />
                  <Text style={{ color: '#fff', fontSize: FontSize.xs, marginTop: 8 }}>
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
                          <Ionicons name="search-outline" size={28} color={YELLOW} />
                          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, fontWeight: '700' }}>
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
                                color={isCatSelected ? BLACK : '#fff'}
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
                                color="#F59E0B"
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
                                      color={isSubSelected ? BLACK : 'rgba(255,255,255,0.6)'}
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
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <>
                    <Text style={s.primaryButtonText}>
                      Create Account ({selectedInterests.length} Selected)
                    </Text>
                    <SymbolView
                      name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                      size={16}
                      tintColor={BLACK}
                    />
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
    card: {
      backgroundColor: DARK_CARD,
      borderRadius: 0,
      padding: Spacing.five,
      gap: Spacing.four,
      borderWidth: 2,
      borderColor: YELLOW,
    },
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
    label: {
      fontSize: FontSize.xs,
      fontWeight: '900',
      color: '#fff',
      letterSpacing: 0.5,
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
      fontWeight: FontWeight.semibold,
    },
    eyeButton: { padding: Spacing.one },
    fieldError: {
      fontSize: FontSize.xs,
      color: '#EF4444',
      marginTop: 2,
      fontWeight: '700',
    },
    rulesList: { gap: Spacing.one, marginTop: Spacing.one },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    ruleText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
    ruleTextPassed: { color: YELLOW },
    primaryButton: {
      backgroundColor: YELLOW,
      borderRadius: 0,
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
      marginTop: 8,
    },
    primaryButtonPressed: { opacity: 0.8 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonText: {
      color: BLACK,
      fontSize: FontSize.base,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    interestHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    interestTitle: {
      color: YELLOW,
      fontSize: FontSize.sm,
      fontWeight: '900',
      letterSpacing: 1,
    },
    selectedBadge: {
      backgroundColor: BLACK,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: YELLOW,
    },
    selectedBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '900',
    },
    interestSub: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: FontSize.xs,
    },
    catCard: {
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: BLACK,
    },
    catCheckBtnActive: {
      backgroundColor: YELLOW,
      borderColor: YELLOW,
    },
    catName: {
      color: '#fff',
      fontSize: FontSize.sm,
      fontWeight: '900',
    },
    subCountBadge: {
      color: YELLOW,
      fontSize: 9,
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
      backgroundColor: DARK_CARD,
      borderWidth: 1,
      borderColor: BORDER,
    },
    subChipActive: {
      backgroundColor: YELLOW,
      borderColor: YELLOW,
    },
    subText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 10,
      fontWeight: '700',
    },
    subTextActive: {
      color: BLACK,
      fontWeight: '900',
    },
    backToStep1Btn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    backToStep1Text: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: FontSize.xs,
      fontWeight: '700',
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
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
      paddingVertical: 10,
      borderRadius: 0,
    },
    roleCardSelected: {
      backgroundColor: YELLOW,
      borderColor: YELLOW,
    },
    roleCardTitle: {
      color: '#fff',
      fontSize: FontSize.xs,
      fontWeight: '900',
    },
    roleCardTitleSelected: {
      color: BLACK,
      fontWeight: '900',
    },
    secondaryStepBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: BORDER,
      backgroundColor: BLACK,
    },
    secondaryStepBtnText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: FontSize.xs,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    searchBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: BLACK,
      borderWidth: 1,
      borderColor: BORDER,
      paddingHorizontal: Spacing.three,
      height: 44,
      borderRadius: 0,
      marginVertical: Spacing.two,
    },
    searchIcon: {
      marginRight: Spacing.two,
    },
    searchInput: {
      flex: 1,
      color: '#fff',
      fontSize: FontSize.xs,
      fontWeight: '700',
      height: '100%',
    },
    clearSearchBtn: {
      padding: Spacing.one,
    },
  });
}
