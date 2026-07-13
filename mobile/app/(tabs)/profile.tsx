import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '@/src/components/GradientButton';
import GlassCard from '@/src/components/GlassCard';
import { useAuth } from '@/src/context/AuthContext';
import { userApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

const GENDERS = ['female', 'male', 'other', 'prefer_not_to_say'];

export default function Profile() {
  const router = useRouter();
  const { user, updateLocalUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loginPrompt}>
          <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.2)" />
          <Text style={styles.loginTitle}>Sign in to your account</Text>
          <GradientButton testID="profile-login-btn" title="Sign In" onPress={() => router.push('/login')} />
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (form.name) payload.name = form.name;
      if (form.email) payload.email = form.email;
      if (form.gender) payload.gender = form.gender;
      if (form.city) payload.city = form.city;
      const { data } = await userApi.update(payload);
      updateLocalUser(data.user);
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.phone}>+91 {user.phone}</Text>
        </View>

        {/* Role chips */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionLabel}>ROLES</Text>
          <View style={styles.roleChips}>
            {(user.roles || []).map((r: string) => (
              <View
                key={r}
                testID={`profile-role-chip-${r}`}
                style={[styles.roleChip, r === user.current_role && styles.roleChipActive]}
              >
                {r === user.current_role ? (
                  <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.roleChipGrad}>
                    <Text style={styles.roleChipTextActive}>{r}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.roleChipText}>{r}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <ActionRow icon="wallet-outline" label="Wallet" onPress={() => router.push('/wallet')} testID="profile-wallet-btn" />
          <ActionRow icon="bookmark-outline" label="Saved" onPress={() => router.push('/saved')} testID="profile-saved-btn" />
          <ActionRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} testID="profile-notifs-btn" />
          <ActionRow icon="receipt-outline" label="My Deals" onPress={() => router.push('/deals')} testID="profile-deals-btn" />
          {user.roles?.includes('vendor') && (
            <ActionRow icon="storefront-outline" label="Vendor Dashboard" onPress={() => router.push('/dashboard')} testID="profile-vendor-btn" />
          )}
          {user.roles?.includes('admin') && (
            <ActionRow icon="shield-outline" label="Admin Panel" onPress={() => router.push('/dashboard')} testID="profile-admin-btn" color="#eab308" />
          )}
        </View>

        {/* Edit Profile Form */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Profile</Text>
          <View style={styles.formFields}>
            <FormField label="Name" testID="profile-name-input" value={form.name} onChangeText={(t: string) => setForm(f => ({ ...f, name: t }))} />
            <FormField label="Email" testID="profile-email-input" value={form.email} onChangeText={(t: string) => setForm(f => ({ ...f, email: t }))} keyboardType="email-address" />
            <FormField label="City" testID="profile-city-input" value={form.city} onChangeText={(t: string) => setForm(f => ({ ...f, city: t }))} />
          </View>
          <GradientButton
            testID="profile-save-btn"
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </GlassCard>

        <TouchableOpacity testID="profile-logout-btn" onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionRow({ icon, label, onPress, testID, color }: any) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.actionRow} activeOpacity={0.7}>
      <View style={[styles.actionIcon, color && { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color || '#fff'} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );
}

function FormField({ label, testID, value, onChangeText, keyboardType }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="rgba(255,255,255,0.3)"
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 40 },
  loginPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  loginTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  header: { paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  phone: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  rolesSection: { paddingHorizontal: 24, marginTop: 20 },
  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  roleChips: { flexDirection: 'row', gap: 8 },
  roleChip: {
    borderRadius: borderRadius.full, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  roleChipActive: { borderWidth: 0 },
  roleChipGrad: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full },
  roleChipText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', paddingHorizontal: 16, paddingVertical: 8 },
  roleChipTextActive: { fontSize: 12, fontWeight: '600', color: '#fff' },
  actions: { paddingHorizontal: 24, marginTop: 24, gap: 4 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionIcon: {
    height: 36, width: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#fff' },
  formCard: { marginHorizontal: 24, marginTop: 24 },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16 },
  formFields: { gap: 12, marginBottom: 16 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  fieldInput: {
    height: 48, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, color: '#fff', fontSize: 15,
  },
  logoutBtn: {
    marginHorizontal: 24, marginTop: 24, height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
