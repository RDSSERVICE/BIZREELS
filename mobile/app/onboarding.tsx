import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '@/src/components/GradientButton';
import { userApi } from '@/src/lib/api';
import { useAuth } from '@/src/context/AuthContext';
import { colors, borderRadius } from '@/src/lib/theme';

const ROLE_META = [
  { key: 'customer', icon: 'bag-handle-outline' as const, label: 'Customer', desc: 'Browse, buy, and discover local vendors' },
  { key: 'vendor', icon: 'storefront-outline' as const, label: 'Vendor', desc: 'List and sell your products or services' },
  { key: 'creator', icon: 'camera-outline' as const, label: 'Creator', desc: 'Create content for brands and vendors' },
];

export default function Onboarding() {
  const router = useRouter();
  const { user, updateLocalUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [roles, setRoles] = useState<string[]>(
    user?.roles?.length ? user.roles.filter((r: string) => r !== 'admin') : ['customer']
  );
  const [loading, setLoading] = useState(false);

  const toggleRole = (r: string) => {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const submit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (roles.length === 0) {
      Alert.alert('Error', 'Pick at least one role');
      return;
    }
    setLoading(true);
    try {
      const { data: updated } = await userApi.update({ name: name.trim() });
      let currentUser = updated.user;
      for (const r of roles) {
        if (!currentUser.roles.includes(r)) {
          const { data: addRes } = await userApi.addRole(r);
          currentUser = addRes.user;
        }
      }
      if (!roles.includes(currentUser.current_role) && roles[0]) {
        const { data: sw } = await userApi.switchRole(roles[0]);
        currentUser = sw.user;
      }
      updateLocalUser(currentUser);
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Tell us about yourself to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              testID="onboarding-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={60}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>I WANT TO</Text>
            <View style={styles.roles}>
              {ROLE_META.map(({ key, icon, label, desc }) => {
                const checked = roles.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    testID={`role-option-${key}`}
                    onPress={() => toggleRole(key)}
                    style={[styles.roleCard, checked && styles.roleCardActive]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.roleIcon, checked && styles.roleIconActive]}>
                      {checked ? (
                        <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.roleIconGrad}>
                          <Ionicons name={icon} size={20} color="#fff" />
                        </LinearGradient>
                      ) : (
                        <Ionicons name={icon} size={20} color="rgba(255,255,255,0.7)" />
                      )}
                    </View>
                    <View style={styles.roleText}>
                      <Text style={styles.roleName}>{label}</Text>
                      <Text style={styles.roleDesc}>{desc}</Text>
                    </View>
                    <View style={[styles.check, checked && styles.checkActive]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#000" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <GradientButton
            testID="onboarding-continue-btn"
            title={loading ? 'Setting up...' : 'Continue'}
            onPress={submit}
            disabled={loading}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  form: { paddingHorizontal: 24, paddingTop: 24, gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  input: {
    height: 56, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.borders.subtle,
    paddingHorizontal: 16, color: '#fff', fontSize: 16,
  },
  roles: { gap: 8 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.borders.subtle,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  roleCardActive: {
    borderColor: 'rgba(236,72,153,0.6)', backgroundColor: 'rgba(236,72,153,0.1)',
  },
  roleIcon: {
    height: 44, width: 44, borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: 'transparent' },
  roleIconGrad: {
    height: 44, width: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  roleText: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  roleDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  check: {
    height: 24, width: 24, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkActive: { backgroundColor: '#fff', borderColor: '#fff' },
});
