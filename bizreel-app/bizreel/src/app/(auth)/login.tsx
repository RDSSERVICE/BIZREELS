import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
    View,
} from 'react-native';

import { BrandColors, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useLogin } from '@/features/auth/mutations';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const s = makeStyles(theme);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { mutate: login, isPending } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  function onSubmit(values: LoginFormValues) {
    setServerError(null);
    login(values, {
      onError: (error) => {
        setServerError(error.message);
      },
    });
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
            <Text style={s.heading}>Welcome Back </Text>
            <Text style={s.sparkle}>✦</Text>
          </View>
          <Text style={s.subheading}>
            Sign in to your BizReels account to continue showcasing your products and growing your
            business.
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
                  <SymbolView
                    name={{ ios: 'lock', android: 'lock', web: 'lock' }}
                    size={18}
                    tintColor={BrandColors.primary}
                    style={s.inputIcon}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    value={value}
                    onChangeText={(v) => { onChange(v); setServerError(null); }}
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
            {errors.password && <Text style={s.fieldError}>{errors.password.message}</Text>}
          </View>

          {/* Sign In button */}
          <Pressable
            style={({ pressed }) => [
              s.primaryButton,
              pressed && s.primaryButtonPressed,
              isPending && s.primaryButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            accessibilityLabel="Sign In"
            accessibilityRole="button">
            {isPending ? (
              <ActivityIndicator color={BrandColors.onPrimary} />
            ) : (
              <>
                <Text style={s.primaryButtonText}>Sign In</Text>
                <SymbolView
                  name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                  size={16}
                  tintColor={BrandColors.onPrimary}
                />
              </>
            )}
          </Pressable>
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
    // Inline server error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FECACA',
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.two,
    },
    errorBannerText: {
      flex: 1,
      fontSize: FontSize.sm,
      color: BrandColors.error,
      lineHeight: 18,
    },
    fieldGroup: { gap: Spacing.one },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: theme.text,
    },
    forgotLink: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      color: BrandColors.primary,
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
    fieldError: {
      fontSize: FontSize.xs,
      color: BrandColors.error,
      marginTop: 2,
    },
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
    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    registerText: { fontSize: FontSize.sm, color: theme.textSecondary },
    registerLink: {
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
  });
}
