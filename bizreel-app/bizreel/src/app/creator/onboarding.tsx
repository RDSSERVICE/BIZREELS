import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

export default function CreatorOnboardingScreen() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user?.creatorProfile?.displayName || user?.name || '');
  const [category, setCategory] = useState(user?.creatorProfile?.category || 'Fashion & Lifestyle');
  const [city, setCity] = useState(user?.city || user?.creatorProfile?.city || '');
  const [bio, setBio] = useState(user?.creatorProfile?.bio || '');
  const [perReelRate, setPerReelRate] = useState(String(user?.creatorProfile?.pricing?.reel1 || '1500'));

  const handleCompleteSetup = async () => {
    if (!displayName.trim() || !city.trim()) {
      Alert.alert('Required', 'Please enter display name and city location');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/users/me', {
        name: displayName.trim(),
        city: city.trim(),
        creatorProfile: {
          displayName: displayName.trim(),
          category: category.trim(),
          city: city.trim(),
          bio: bio.trim(),
          pricing: {
            reel1: Number(perReelRate) || 1500,
          },
        },
      });

      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) setUser(updatedUser);

      Alert.alert('Studio Setup Complete! 🎉', 'Your Creator profile is now live for vendor collaboration deals.');
      router.replace('/creator/dashboard');
    } catch (err: any) {
      Alert.alert('Setup Failed', err.response?.data?.message || 'Could not complete creator setup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>BECOME A CREATOR</Text>
          <Text style={styles.headerSub}>Setup Creator Studio Profile</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Creator Identity</Text>

          <Text style={styles.label}>Display / Creator Handle Name *</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="e.g. Rahul Content Studio" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>Primary Category Specialty *</Text>
          <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Fashion, Tech, Food, Fitness..." placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>City Location *</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Mumbai, Delhi, Bengaluru" placeholderTextColor="rgba(255,255,255,0.4)" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Bio & Base Rate</Text>

          <Text style={styles.label}>Base Reel Rate (₹)</Text>
          <TextInput style={styles.input} value={perReelRate} onChangeText={setPerReelRate} keyboardType="number-pad" placeholder="1500" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>Creator Bio / Pitch</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Tell local brands why they should collaborate with you..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteSetup} disabled={saving}>
          {saving ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Complete Creator Studio Setup ✦</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.two },
  cardTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', marginBottom: 4 },
  label: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700', marginTop: 4 },
  input: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  submitBtn: { backgroundColor: YELLOW, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: BLACK, fontSize: FontSize.base, fontWeight: '900' },
});
