import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/src/components/GlassCard';
import GradientButton from '@/src/components/GradientButton';
import { useAuth } from '@/src/context/AuthContext';
import { userApi } from '@/src/lib/api';
import { colors, borderRadius } from '@/src/lib/theme';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, updateLocalUser } = useAuth();
  const [showBVModal, setShowBVModal] = useState(false);

  const isVendor = user?.roles?.includes('vendor');
  const isAdmin = user?.roles?.includes('admin');

  const handleBecomeVendor = async () => {
    try {
      const { data } = await userApi.addRole('vendor');
      updateLocalUser(data.user);
      Alert.alert('Success', 'You are now a vendor!');
      setShowBVModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed');
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {user?.name || 'there'} 👋</Text>
            <Text style={styles.roleText}>Current role: {user?.current_role || 'customer'}</Text>
          </View>
          <TouchableOpacity testID="profile-link" onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
            <Ionicons name="person" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Role chips */}
        <View style={styles.roleChips}>
          {(user?.roles || []).map((r: string) => (
            <View key={r} testID={`role-chip-${r}`} style={[styles.chip, r === user?.current_role && styles.chipActive]}>
              {r === user?.current_role ? (
                <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.chipGrad}>
                  <Text style={styles.chipTextActive}>{r}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.chipText}>{r}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.ctas}>
          {/* New Listing — vendors only */}
          {isVendor && (
            <TouchableOpacity testID="dashboard-new-listing-cta" onPress={() => router.push('/create-listing')} activeOpacity={0.8}>
              <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradCtaCard}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <View style={styles.ctaInfo}>
                  <Text style={styles.ctaTitle}>New Listing</Text>
                  <Text style={[styles.ctaDesc, { color: 'rgba(255,255,255,0.8)' }]}>Post a product or service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Browse */}
          <TouchableOpacity testID="dashboard-browse-cta" onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.8}>
            <GlassCard style={styles.ctaCard}>
              <View style={styles.ctaRow}>
                <LinearGradient colors={['#a855f7', '#ec4899', '#f97316']} style={styles.ctaIcon}>
                  <Ionicons name="search" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.ctaInfo}>
                  <Text style={styles.ctaTitle}>Browse listings</Text>
                  <Text style={styles.ctaDesc}>Products & services near you</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Vendor CTA */}
          {isVendor ? (
            <TouchableOpacity testID="dashboard-vendor-cta" onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.8}>
              <GlassCard style={styles.ctaCard}>
                <View style={styles.ctaRow}>
                  <View style={styles.ctaIconPlain}><Ionicons name="storefront-outline" size={20} color="#fff" /></View>
                  <View style={styles.ctaInfo}>
                    <Text style={styles.ctaTitle}>Vendor Dashboard</Text>
                    <Text style={styles.ctaDesc}>Manage your listings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="dashboard-become-vendor-cta" onPress={handleBecomeVendor} activeOpacity={0.8}>
              <GlassCard style={styles.ctaCard}>
                <View style={styles.ctaRow}>
                  <View style={styles.ctaIconPlain}><Ionicons name="storefront-outline" size={20} color="#fff" /></View>
                  <View style={styles.ctaInfo}>
                    <Text style={styles.ctaTitle}>Become a Vendor</Text>
                    <Text style={styles.ctaDesc}>Start selling your products</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity testID="dashboard-admin-cta" onPress={() => {}} activeOpacity={0.8}>
              <GlassCard style={[styles.ctaCard, { borderColor: 'rgba(234,179,8,0.3)' }]}>
                <View style={styles.ctaRow}>
                  <View style={[styles.ctaIconPlain, { backgroundColor: 'rgba(234,179,8,0.2)' }]}>
                    <Ionicons name="shield-outline" size={20} color="#eab308" />
                  </View>
                  <View style={styles.ctaInfo}>
                    <Text style={styles.ctaTitle}>Admin Panel</Text>
                    <Text style={styles.ctaDesc}>Users · Listings · Reports</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity testID="logout-btn" onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 12 },
  backBtn: { height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  roleText: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  avatarBtn: {
    height: 44, width: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  roleChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, marginTop: 16 },
  chip: { borderRadius: borderRadius.full, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  chipActive: { borderWidth: 0 },
  chipGrad: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full },
  chipText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', paddingHorizontal: 14, paddingVertical: 6 },
  chipTextActive: { fontSize: 12, fontWeight: '600', color: '#fff' },
  ctas: { paddingHorizontal: 24, marginTop: 24, gap: 12 },
  gradCtaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
    borderRadius: borderRadius.xl,
  },
  ctaCard: { padding: 20 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctaIcon: { height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaIconPlain: { height: 48, width: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  ctaInfo: { flex: 1 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  ctaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  logoutBtn: {
    marginHorizontal: 24, marginTop: 24, height: 48, borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
