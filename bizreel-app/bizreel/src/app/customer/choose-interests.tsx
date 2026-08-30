/**
 * Customer Interest Onboarding Screen
 * Full Feature Parity with Web InterestSelectionPage.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const CATEGORIES = [
  { id: '1', name: 'Electronics & Gadgets', icon: 'laptop-outline' },
  { id: '2', name: 'Fashion & Clothing', icon: 'shirt-outline' },
  { id: '3', name: 'Home & Living', icon: 'home-outline' },
  { id: '4', name: 'Vehicles & Automotive', icon: 'car-outline' },
  { id: '5', name: 'Real Estate & Property', icon: 'business-outline' },
  { id: '6', name: 'Beauty & Salon', icon: 'sparkles-outline' },
  { id: '7', name: 'Digital Services', icon: 'flash-outline' },
  { id: '8', name: 'Corporate Gifts', icon: 'gift-outline' },
  { id: '9', name: 'Food & Restaurants', icon: 'restaurant-outline' },
  { id: '10', name: 'Jewelry & Watches', icon: 'diamond-outline' },
  { id: '11', name: 'Fitness & Sports', icon: 'fitness-outline' },
  { id: '12', name: 'Events & Wedding', icon: 'calendar-outline' },
];

export default function CustomerChooseInterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Electronics & Gadgets', 'Fashion & Clothing']);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (name: string) => {
    if (selectedInterests.includes(name)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== name));
    } else {
      setSelectedInterests([...selectedInterests, name]);
    }
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length < 3) {
      Alert.alert('Select Interests', 'Please select at least 3 categories to personalize your feed.');
      return;
    }

    setSaving(true);
    try {
      const interestsArray = selectedInterests.map((cat) => ({ category: cat }));
      const res = await api.patch('/v1/users/me/interests', { interests: interestsArray }).catch(() =>
        api.patch('/users/me', { customerProfile: { interests: interestsArray, interestsSelectedAt: new Date().toISOString() } })
      );

      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) {
        setUser({
          ...user,
          ...updatedUser,
        });
      }

      Alert.alert('🎯 Personalized Feed Ready!', 'Your feed preferences have been updated successfully.');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not save interest preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CUSTOMER ONBOARDING</Text>
          <Text style={styles.headerSub}>Personalize Your Product & Reel Feed</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose Your Top Interests ✦</Text>
          <Text style={styles.cardSub}>Select at least 3 categories to get tailored product deals, reels, and local seller recommendations.</Text>

          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const active = selectedInterests.includes(cat.name);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catCard, active && styles.catCardActive]}
                  onPress={() => toggleInterest(cat.name)}>
                  <Ionicons name={cat.icon as any} size={24} color={active ? BLACK : YELLOW} />
                  <Text style={[styles.catName, active && styles.catNameActive]}>{cat.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={BLACK} style={styles.checkIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveInterests} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={BLACK} />
            ) : (
              <Text style={styles.submitBtnText}>Save Preferences & View Feed →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#888', fontSize: FontSize.xs, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four },
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, borderRadius: 12, gap: Spacing.two },
  cardTitle: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  cardSub: { color: '#aaa', fontSize: FontSize.xs, lineHeight: 18, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '48%',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    borderRadius: 10,
    gap: 6,
    position: 'relative',
  },
  catCardActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  catName: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  catNameActive: { color: BLACK, fontWeight: '900' },
  checkIcon: { position: 'absolute', top: 8, right: 8 },
  submitBtn: { backgroundColor: YELLOW, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitBtnText: { color: BLACK, fontSize: FontSize.base, fontWeight: '900' },
});
