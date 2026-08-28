import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
    View,
} from 'react-native';

import { BrandColors, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useRegisterWithPhone } from '@/features/auth/mutations';
import { registerWithPhoneSchema, type RegisterWithPhoneFormValues } from '@/features/auth/schema';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Country code selector data
// ---------------------------------------------------------------------------
type Country = { code: string; dial: string; flag: string };

const POPULAR_COUNTRIES: Country[] = [
  { code: 'IN', dial: '+91', flag: '🇮🇳' },
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' },
  { code: 'AE', dial: '+971', flag: '🇦🇪' },
  { code: 'SG', dial: '+65', flag: '🇸🇬' },
  { code: 'AU', dial: '+61', flag: '🇦🇺' },
  { code: 'CA', dial: '+1', flag: '🇨🇦' },
];

// ---------------------------------------------------------------------------
// Password rules
// ---------------------------------------------------------------------------
type PasswordRule = { label: string; test: (pw: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  {
    label: 'Includes uppercase and lowercase letters',
    test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  {
    label: 'Includes a number or special character',
    test: (pw) => /[0-9!@#$%^&*]/.test(pw),
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function RegisterPhoneScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);

  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(POPULAR_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { mutate: register, isPending } = useRegisterWithPhone();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterWithPhoneFormValues>({
    resolver: zodResolver(registerWithPhoneSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
    mode: 'onChange',
  });

  const passwordValue = watch('password');

  const [selectedRole, setSelectedRole] = useState<'customer' | 'vendor' | 'creator'>('customer');

  function onSubmit(values: RegisterWithPhoneFormValues) {
    // Prepend country dial code if user typed bare number
    const phone = values.phone.startsWith('+')
      ? values.phone
      : `${selectedCountry.dial}${values.phone}`;

    register(
      { ...values, phone, role: selectedRole },
      {
        onError: (error) => {
          Alert.alert('Registration Failed', error.message);
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

        {/* Back button */}
        <Pressable
          style={({ pressed }) => [s.backButton, pressed && s.pressed]}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={theme.text}
          />
        </Pressable>

        {/* Logo + heading */}
        <View style={s.headerSection}>
          <Image
            source={require('@/assets/android/playstore-icon.png')}
            style={s.logo}
            contentFit="contain"
          />
          <View style={s.headingRow}>
            <Text style={s.heading}>Create Your Account</Text>
          </View>
          <Text style={s.subheading}>
            Join BizReels and start showcasing your products, generating leads and growing your
            business.
          </Text>
        </View>

        {/* Form card */}
        <View style={s.card}>

          {/* Join As Role Selection */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>JOIN AS *</Text>
            <View style={s.roleSelectorRow}>
              {[
                { id: 'customer', label: 'Customer' },
                { id: 'vendor', label: 'Vendor' },
                { id: 'creator', label: 'Creator' },
              ].map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <Pressable
                    key={r.id}
                    style={[s.roleCard, isSelected && s.roleCardSelected]}
                    onPress={() => setSelectedRole(r.id as any)}>
                    <Text style={[s.roleCardTitle, isSelected && s.roleCardTitleSelected]}>
                      {r.label}
                    </Text>
                  </Pressable>
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
                    onChangeText={onChange}
                    onBlur={onBlur}
                    accessibilityLabel="Full Name"
                  />
                </View>
              )}
            />
            {errors.name && <Text style={s.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Mobile Number */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mobile Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputRow, errors.phone && s.inputError]}>
                  {/* Country code picker trigger */}
                  <Pressable
                    style={s.countryPickerTrigger}
                    onPress={() => setShowCountryPicker((v) => !v)}
                    accessibilityLabel={`Country code ${selectedCountry.dial}`}
                    accessibilityRole="button">
                    <Text style={s.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={s.countryDial}>{selectedCountry.dial}</Text>
                    <SymbolView
                      name={{
                        ios: 'chevron.down',
                        android: 'keyboard_arrow_down',
                        web: 'keyboard_arrow_down',
                      }}
                      size={12}
                      tintColor={theme.textSecondary}
                    />
                  </Pressable>

                  {/* Vertical divider */}
                  <View style={s.countryDivider} />

                  <TextInput
                    style={s.input}
                    placeholder="Enter mobile number"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    value={value}
                    onChangeText={(text) => {
                      // Strip the dial code if user pastes full number
                      const stripped = text.startsWith(selectedCountry.dial)
                        ? text.slice(selectedCountry.dial.length)
                        : text;
                      onChange(stripped);
                    }}
                    onBlur={onBlur}
                    accessibilityLabel="Mobile Number"
                  />
                </View>
              )}
            />
            {errors.phone && <Text style={s.errorText}>{errors.phone.message}</Text>}

            {/* Country picker dropdown */}
            {showCountryPicker && (
              <View style={s.countryDropdown}>
                {POPULAR_COUNTRIES.map((country) => (
                  <Pressable
                    key={`${country.code}-${country.dial}`}
                    style={({ pressed }) => [
                      s.countryOption,
                      selectedCountry.code === country.code && s.countryOptionSelected,
                      pressed && s.pressed,
                    ]}
                    onPress={() => {
                      setSelectedCountry(country);
                      setShowCountryPicker(false);
                      // Re-validate phone with new dial code context
                      setValue('phone', watch('phone'), { shouldValidate: true });
                    }}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`${country.flag} ${country.dial}`}>
                    <Text style={s.countryOptionFlag}>{country.flag}</Text>
                    <Text style={s.countryOptionDial}>{country.dial}</Text>
                    <Text style={s.countryOptionCode}>{country.code}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Email Address */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputRow, errors.email && s.inputError]}>
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
                    onChangeText={onChange}
                    onBlur={onBlur}
                    accessibilityLabel="Email Address"
                  />
                </View>
              )}
            />
            {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
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
                    onChangeText={onChange}
                    onBlur={onBlur}
                    onSubmitEditing={handleSubmit(onSubmit)}
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
                          ? {
                              ios: 'checkmark.circle.fill',
                              android: 'check_circle',
                              web: 'check_circle',
                            }
                          : {
                              ios: 'circle',
                              android: 'radio_button_unchecked',
                              web: 'radio_button_unchecked',
                            }
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

          {/* Create Account button */}
          <Pressable
            style={({ pressed }) => [
              s.primaryButton,
              pressed && s.primaryButtonPressed,
              isPending && s.primaryButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            accessibilityLabel="Create Account"
            accessibilityRole="button">
            {isPending ? (
              <ActivityIndicator color={BrandColors.onPrimary} />
            ) : (
              <>
                <Text style={s.primaryButtonText}>Create Account</Text>
                <SymbolView
                  name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                  size={16}
                  tintColor={BrandColors.onPrimary}
                />
              </>
            )}
          </Pressable>

          {/* OR divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Register with Email */}
          <Pressable
            style={({ pressed }) => [s.secondaryButton, pressed && s.pressed]}
            onPress={() => router.back()}
            accessibilityLabel="Register with Email"
            accessibilityRole="button">
            <SymbolView
              name={{ ios: 'envelope', android: 'email', web: 'email' }}
              size={18}
              tintColor={BrandColors.primary}
            />
            <Text style={s.secondaryButtonText}>Register with Email</Text>
            <SymbolView
              name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
              size={16}
              tintColor={theme.textSecondary}
            />
          </Pressable>
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

        {/* Security note */}
        <View style={s.securityNote}>
          <SymbolView
            name={{ ios: 'shield', android: 'security', web: 'security' }}
            size={20}
            tintColor={theme.textSecondary}
          />
          <View>
            <Text style={s.securityTitle}>Your information is secure with us.</Text>
            <Text style={s.securitySub}>We never share your data.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
type Theme = typeof Colors.light;

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1, backgroundColor: theme.background },
    scrollContent: {
      paddingHorizontal: Spacing.five,
      paddingTop: Spacing.six,
      paddingBottom: Spacing.seven,
      gap: Spacing.four,
    },

    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.full,
    },
    pressed: { opacity: 0.6 },

    headerSection: { gap: Spacing.two },
    logo: { width: 56, height: 56, marginBottom: Spacing.one },
    headingRow: { flexDirection: 'row', alignItems: 'center' },
    heading: {
      fontSize: FontSize['2xl'],
      fontWeight: FontWeight.bold,
      color: theme.text,
    },
    sparkle: { fontSize: FontSize.lg, color: BrandColors.primary },
    subheading: {
      fontSize: FontSize.base,
      color: theme.textSecondary,
      lineHeight: 22,
    },

    card: {
      backgroundColor: theme.backgroundElement,
      borderRadius: Radius.xl,
      padding: Spacing.five,
      gap: Spacing.four,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },

    fieldGroup: { gap: Spacing.one },
    label: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: theme.text,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      backgroundColor: theme.inputBackground,
      paddingHorizontal: Spacing.three,
      height: 48,
      overflow: 'visible',
    },
    inputError: { borderColor: BrandColors.error },
    inputIcon: { marginRight: Spacing.two },
    input: {
      flex: 1,
      fontSize: FontSize.base,
      color: theme.text,
      height: '100%',
    },
    eyeButton: { padding: Spacing.one },
    errorText: {
      fontSize: FontSize.xs,
      color: BrandColors.error,
      marginTop: 2,
    },

    // Country code picker
    countryPickerTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingRight: Spacing.two,
    },
    countryFlag: { fontSize: 18 },
    countryDial: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: theme.text,
    },
    countryDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
      marginHorizontal: Spacing.two,
    },
    countryDropdown: {
      marginTop: Spacing.one,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      backgroundColor: theme.backgroundElement,
      overflow: 'hidden',
    },
    countryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    countryOptionSelected: {
      backgroundColor: theme.backgroundSelected,
    },
    countryOptionFlag: { fontSize: 18 },
    countryOptionDial: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: theme.text,
      width: 44,
    },
    countryOptionCode: {
      fontSize: FontSize.sm,
      color: theme.textSecondary,
    },

    // Password rules
    rulesList: { gap: Spacing.one, marginTop: Spacing.one },
    ruleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
    ruleText: { fontSize: FontSize.xs, color: theme.textSecondary },
    ruleTextPassed: { color: BrandColors.success },

    // Buttons
    primaryButton: {
      backgroundColor: BrandColors.primary,
      borderRadius: Radius.full,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
    },
    primaryButtonPressed: { backgroundColor: BrandColors.primaryDark },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonText: {
      color: BrandColors.onPrimary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
    },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: {
      fontSize: FontSize.xs,
      color: theme.textSecondary,
      fontWeight: FontWeight.medium,
    },

    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.five,
      height: 52,
    },
    secondaryButtonText: {
      flex: 1,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
      color: theme.text,
      textAlign: 'center',
    },

    signinRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signinText: { fontSize: FontSize.sm, color: theme.textSecondary },
    signinLink: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: BrandColors.primary,
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
      fontWeight: FontWeight.semibold,
      color: theme.textSecondary,
    },
    securitySub: {
      fontSize: FontSize.xs,
      color: theme.textSecondary,
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
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 10,
      borderRadius: Radius.md,
    },
    roleCardSelected: {
      backgroundColor: BrandColors.primary,
      borderColor: BrandColors.primary,
    },
    roleCardTitle: {
      color: theme.text,
      fontSize: FontSize.xs,
      fontWeight: '900',
    },
    roleCardTitleSelected: {
      color: BrandColors.onPrimary,
      fontWeight: '900',
    },
  });
}
