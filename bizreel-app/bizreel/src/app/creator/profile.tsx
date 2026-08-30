/**
 * Creator Profile Management Screen
 * Parity with Web CreatorProfilePage.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

export default function CreatorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const u = (user as any) || {};
  const cp = u.creatorProfile || {};

  const [displayName, setDisplayName] = useState(cp.displayName || u.name || '');
  const [category, setCategory] = useState(cp.category || cp.creatorCategories?.[0] || 'Product Reel Creator');
  const [bio, setBio] = useState(cp.bio || '');
  const [mobileNumber, setMobileNumber] = useState(cp.mobileNumber || u.phone || '');
  const [email, setEmail] = useState(cp.email || u.email || '');

  // Address
  const [city, setCity] = useState(cp.address?.city || u.city || '');
  const [stateName, setStateName] = useState(cp.address?.state || '');
  const [pincode, setPincode] = useState(cp.address?.pincode || '');

  // Social Links
  const [instagram, setInstagram] = useState(cp.portfolio?.instagramLink || cp.socialMedia?.instagram?.handleOrUrl || '');
  const [youtube, setYoutube] = useState(cp.portfolio?.youtubeLink || '');
  const [portfolioVideo, setPortfolioVideo] = useState(cp.portfolio?.portfolioVideoLink || '');

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim() || !city.trim()) {
      Alert.alert('Required Fields', 'Please enter your Display Name and City location.');
      return;
    }

    setSaving(true);
    try {
      const updatedCreatorProfile = {
        ...cp,
        displayName: displayName.trim(),
        category: category.trim(),
        bio: bio.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        address: {
          ...(cp.address || {}),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
        },
        portfolio: {
          ...(cp.portfolio || {}),
          instagramLink: instagram.trim(),
          youtubeLink: youtube.trim(),
          portfolioVideoLink: portfolioVideo.trim(),
        },
        updatedAt: new Date().toISOString(),
      };

      const res = await api.patch('/users/me', {
        name: displayName.trim(),
        city: city.trim(),
        creatorProfile: updatedCreatorProfile,
      });

      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) {
        setUser({
          ...user,
          ...updatedUser,
          activeRole: 'creator',
          current_role: 'creator',
        });
      }

      Alert.alert('Success 🎉', 'Creator Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR PROFILE</Text>
          <Text style={styles.headerSub}>Manage Profile & Bio Details</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/creator/onboarding')}>
          <Ionicons name="create-outline" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Basic Identity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity & Category</Text>

          <Text style={styles.label}>Creator Display Name *</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Rahul Content Studio" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>Primary Category Specialty</Text>
          <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Product Reel Creator" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>Creator Bio / Pitch</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell local brands why they should collaborate with you..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
          />
        </View>

        {/* Contact & Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact & Location</Text>

          <Text style={styles.label}>Mobile Phone Number</Text>
          <TextInput style={styles.input} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="creator@example.com" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>City *</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Raipur, Mumbai, Bengaluru" placeholderTextColor="rgba(255,255,255,0.4)" />

          <Text style={styles.label}>State</Text>
          <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="Chhattisgarh" placeholderTextColor="rgba(255,255,255,0.4)" />
        </View>

        {/* Social Links Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Social Handles & Links</Text>

          <Text style={styles.label}>Instagram Link</Text>
          <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} placeholder="https://instagram.com/handle" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />

          <Text style={styles.label}>YouTube Link</Text>
          <TextInput style={styles.input} value={youtube} onChangeText={setYoutube} placeholder="https://youtube.com/@channel" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />

          <Text style={styles.label}>Sample Reel / Portfolio Link</Text>
          <TextInput style={styles.input} value={portfolioVideo} onChangeText={setPortfolioVideo} placeholder="https://drive.google.com/..." placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color={BLACK} /> : <Text style={styles.submitBtnText}>Save Profile Changes ✦</Text>}
        </TouchableOpacity>
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
  actionBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, borderRadius: 12, gap: Spacing.two },
  cardTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', marginBottom: 4 },
  label: { color: '#ddd', fontSize: FontSize.xs, fontWeight: '700', marginTop: 4 },
  input: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    color: '#fff',
    paddingHorizontal: Spacing.three,
    height: 44,
    fontSize: FontSize.xs,
    borderRadius: 8,
  },
  submitBtn: { backgroundColor: YELLOW, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: BLACK, fontSize: FontSize.base, fontWeight: '900' },
});
