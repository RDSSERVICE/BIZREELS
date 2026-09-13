/**
 * Customer Account Settings & Profile Edit Screen
 * Full 100% Feature Parity with Web CustomerSettingsPage.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

const CUSTOMER_PROFESSIONS = [
  'Business Owner / Entrepreneur',
  'Software Engineer / IT Professional',
  'Retailer / Shopkeeper',
  'Doctor / Healthcare Professional',
  'Teacher / Educator / Professor',
  'Student',
  'Chartered Accountant / Financial Advisor',
  'Lawyer / Legal Consultant',
  'Real Estate Agent / Broker',
  'Architect / Interior Designer',
  'Government / Civil Services Employee',
  'Private Sector Employee',
  'Marketing / Sales Executive',
  'Photographer / Videographer',
  'Designer / Creative Artist',
  'Homemaker',
  'Freelancer / Consultant',
  'Farmer / Agriculture',
  'Technician / Electrician / Mechanic',
  'Other / Custom Profession',
];

const LANGUAGES = ['English', 'Hindi (हिंदी)', 'Hinglish'];

export default function CustomerSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, signOut } = useAuth();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Personal Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [dob, setDob] = useState('');
  const [language, setLanguage] = useState('English');

  // Location & Address
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const [pincodeMsg, setPincodeMsg] = useState<string | null>(null);

  // Security Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Dropdown Modals
  const [professionModalOpen, setProfessionModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || (user as any).mobileNumber || '');
      const custProf = (user as any).customerProfile || {};
      setGender(custProf.gender || (user as any).gender || 'male');
      
      const userProf = custProf.profession || (user as any).profession || '';
      if (CUSTOMER_PROFESSIONS.includes(userProf)) {
        setProfession(userProf);
      } else if (userProf) {
        setProfession('Other / Custom Profession');
        setCustomProfession(userProf);
      } else {
        setProfession(CUSTOMER_PROFESSIONS[0]);
      }

      setDob(custProf.dob || (user as any).dob || '');
      setLanguage(custProf.language || (user as any).language || 'English');

      const loc = custProf.location || (user as any).location || {};
      setPincode(loc.pincode || (user as any).pincode || '');
      setCity(loc.city || (user as any).city || '');
      setDistrict(loc.district || (user as any).district || '');
      setState(loc.state || (user as any).state || '');
      setAddress(loc.address || custProf.address || (user as any).address || '');
    }
  }, [user]);

  // Pincode auto-lookup
  const handlePincodeLookup = async (val: string) => {
    setPincode(val);
    setPincodeMsg(null);
    if (val.length === 6) {
      setFetchingPincode(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setDistrict(po.District || '');
          setState(po.State || '');
          if (!city) setCity(po.Block !== 'NA' ? po.Block : po.District);
          setPincodeMsg(`✓ Auto-filled: ${po.District}, ${po.State}`);
        } else {
          setPincodeMsg('⚠️ Invalid Pincode or location data not found');
        }
      } catch (err) {
        console.warn('Pincode fetch error:', err);
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    setSaving(true);
    try {
      const finalProf = profession === 'Other / Custom Profession' ? customProfession : profession;
      const payload = {
        name,
        profession: finalProf,
        gender,
        dob,
        language,
        location: {
          pincode,
          city,
          district,
          state,
          address,
        },
      };

      const res = await api
        .put('/v1/users/me/profile', payload)
        .catch(() => api.put('/users/me', payload))
        .catch(() => api.post('/v1/customer/profile', payload));

      const updatedUser = res.data?.data || res.data?.user || res.data;
      if (updatedUser) {
        setUser({ ...user, ...updatedUser });
      }

      Alert.alert('Success 🎉', 'Profile settings updated successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api
        .post('/v1/auth/change-password', {
          currentPassword,
          newPassword,
        })
        .catch(() =>
          api.put('/v1/users/me/password', {
            oldPassword: currentPassword,
            newPassword,
          })
        );

      Alert.alert('Success 🎉', 'Password changed successfully! Please log back in.', [
        {
          text: 'OK',
          onPress: () => signOut(),
        },
      ]);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Change Failed', err.response?.data?.message || 'Failed to update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently ⚠️',
      'Are you sure you want to permanently delete your BizReels account? This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/v1/auth/profile').catch(() => api.delete('/v1/users/me')).catch(() => api.delete('/users/me'));
              Alert.alert('Account Deleted', 'Your account has been deleted.');
              signOut();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT_MAIN} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ACCOUNT &amp; PROFILE SETTINGS</Text>
          <Text style={styles.headerSub}>Edit Details, Address &amp; Security</Text>
        </View>
      </View>

      {/* Settings Sub-Tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'profile' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('profile')}>
          <Ionicons
            name="person-outline"
            size={16}
            color={activeTab === 'profile' ? GOLD : TEXT_MUTED}
          />
          <Text style={[styles.subTabBtnText, activeTab === 'profile' && styles.subTabBtnTextActive]}>
            Profile Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'security' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('security')}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={activeTab === 'security' ? GOLD : TEXT_MUTED}
          />
          <Text style={[styles.subTabBtnText, activeTab === 'security' && styles.subTabBtnTextActive]}>
            Security &amp; Auth
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'profile' ? (
          <View style={{ gap: Spacing.four }}>
            {/* SECTION 1: PERSONAL INFORMATION */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>1. PERSONAL INFORMATION</Text>

              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name..."
                    placeholderTextColor={TEXT_MUTED}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email & Phone (Disabled) */}
              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Email Address (Verified)</Text>
                  <View style={[styles.inputRow, styles.inputDisabled]}>
                    <Ionicons name="mail-outline" size={16} color={TEXT_MUTED} style={styles.icon} />
                    <TextInput style={[styles.input, { color: TEXT_MUTED }]} value={email} editable={false} />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={[styles.inputRow, styles.inputDisabled]}>
                    <Ionicons name="call-outline" size={16} color={TEXT_MUTED} style={styles.icon} />
                    <TextInput style={[styles.input, { color: TEXT_MUTED }]} value={phone} editable={false} />
                  </View>
                </View>
              </View>

              {/* Gender */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['male', 'female', 'other'] as const).map((g) => {
                    const active = gender === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderBtn, active && styles.genderBtnActive]}
                        onPress={() => setGender(g)}>
                        <Ionicons
                          name={g === 'male' ? 'male' : g === 'female' ? 'female' : 'person'}
                          size={14}
                          color={active ? GOLD : TEXT_MUTED}
                        />
                        <Text style={[styles.genderText, active && styles.genderTextActive]}>
                          {g.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Profession Dropdown */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Profession / Occupation</Text>
                <TouchableOpacity style={styles.dropdownBtn} onPress={() => setProfessionModalOpen(true)}>
                  <Ionicons name="briefcase-outline" size={16} color={GOLD} style={styles.icon} />
                  <Text style={styles.dropdownText}>{profession || 'Select Profession...'}</Text>
                  <Ionicons name="chevron-down" size={16} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>

              {profession === 'Other / Custom Profession' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Specify Custom Profession</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter custom profession..."
                      placeholderTextColor={TEXT_MUTED}
                      value={customProfession}
                      onChangeText={setCustomProfession}
                    />
                  </View>
                </View>
              )}

              {/* Date of Birth & Preferred Language */}
              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="calendar-outline" size={16} color={GOLD} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={TEXT_MUTED}
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Language</Text>
                  <View style={styles.optionsRow}>
                    {LANGUAGES.map((lang) => {
                      const active = language === lang;
                      return (
                        <TouchableOpacity
                          key={lang}
                          style={[styles.langChip, active && styles.langChipActive]}
                          onPress={() => setLanguage(lang)}>
                          <Text style={[styles.langText, active && styles.langTextActive]}>{lang}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* SECTION 2: LOCATION & ADDRESS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>2. LOCATION &amp; DELIVERY ADDRESS</Text>

              {/* Pincode Lookup */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Enter 6-Digit Pincode (Auto-Fills Location)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="keypad-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 110001 or 400001"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    maxLength={6}
                    value={pincode}
                    onChangeText={handlePincodeLookup}
                  />
                  {fetchingPincode && <ActivityIndicator size="small" color={GOLD} />}
                </View>
                {!!pincodeMsg && <Text style={{ color: GOLD, fontSize: 10, marginTop: 4 }}>{pincodeMsg}</Text>}
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>City / District</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="location-outline" size={16} color={GOLD} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Delhi"
                      placeholderTextColor={TEXT_MUTED}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>State</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Delhi"
                      placeholderTextColor={TEXT_MUTED}
                      value={state}
                      onChangeText={setState}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full House / Street Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="home-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Flat 302, B-Block, Connaught Place"
                    placeholderTextColor={TEXT_MUTED}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>
            </View>

            {/* SECTION 3: MANAGE INTERESTS SHORTCUT */}
            <TouchableOpacity
              style={styles.interestsShortcutCard}
              onPress={() => router.push('/customer/choose-interests')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons name="options-outline" size={24} color={GOLD} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.interestsShortcutTitle}>Personalize Feed &amp; Interests ›</Text>
                  <Text style={styles.interestsShortcutSub}>Select your favorite categories &amp; subcategories to tailor video reels.</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={GOLD} />
            </TouchableOpacity>

            {/* Save Profile Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={GOLD} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                  <Text style={styles.saveBtnText}>Save Account Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: Spacing.four }}>
            {/* SECURITY & PASSWORD */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>CHANGE PASSWORD</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="key-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password..."
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry={!showCurrentPw}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={{ padding: 4 }}>
                    <Ionicons name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password (min 6 chars)..."
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry={!showNewPw}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={{ padding: 4 }}>
                    <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={GOLD} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password..."
                    placeholderTextColor={TEXT_MUTED}
                    secureTextEntry={!showConfirmPw}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)} style={{ padding: 4 }}>
                    <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={GOLD} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={changingPassword}>
                {changingPassword ? (
                  <ActivityIndicator color={GOLD} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={GOLD} />
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* PRIVACY & TERMS */}
            <TouchableOpacity
              style={styles.sectionCard}
              onPress={() => Linking.openURL('https://bizreels.in/privacy-policy')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="document-text-outline" size={20} color={GOLD} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeader}>PRIVACY POLICY &amp; TERMS</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: FontSize.xs }}>https://bizreels.in/privacy-policy</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={GOLD} />
              </View>
            </TouchableOpacity>

            {/* DANGER ZONE */}
            <View style={[styles.sectionCard, { borderColor: '#FCA5A5' }]}>
              <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>ACCOUNT DANGER ZONE</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: FontSize.xs, lineHeight: 18 }}>
                Deleting your account will permanently wipe your profile, saved reels, cart items, and order history.
              </Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Permanently Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Profession Modal */}
      <Modal visible={professionModalOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Profession</Text>
              <TouchableOpacity onPress={() => setProfessionModalOpen(false)}>
                <Ionicons name="close" size={20} color={TEXT_MAIN} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CUSTOMER_PROFESSIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, profession === item && styles.modalItemActive]}
                  onPress={() => {
                    setProfession(item);
                    setProfessionModalOpen(false);
                  }}>
                  <Text style={[styles.modalItemText, profession === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {profession === item && <Ionicons name="checkmark" size={16} color={GOLD} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BG_COLOR,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: GOLD, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: TEXT_MAIN, fontSize: FontSize.xs, fontWeight: '600' },

  subTabBar: { flexDirection: 'row', backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  subTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabBtnActive: { borderBottomColor: GOLD, backgroundColor: ESPRESSO },
  subTabBtnText: { color: TEXT_MUTED, fontSize: FontSize.xs, fontWeight: '700' },
  subTabBtnTextActive: { color: GOLD, fontWeight: '900' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: 40 },

  sectionCard: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: Spacing.four, gap: Spacing.three, ...Shadows.sm },
  sectionHeader: { color: GOLD, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 0.5 },
  fieldGroup: { gap: 4 },
  label: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG_COLOR, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, height: 42 },
  inputDisabled: { opacity: 0.6 },
  icon: { marginRight: 8 },
  input: { flex: 1, color: TEXT_MAIN, fontSize: FontSize.xs },

  rowTwo: { flexDirection: 'row', gap: 8 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BG_COLOR, borderWidth: 1, borderColor: BORDER, borderRadius: 8, height: 40 },
  genderBtnActive: { backgroundColor: ESPRESSO, borderColor: ESPRESSO },
  genderText: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  genderTextActive: { color: GOLD, fontWeight: '900' },

  dropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG_COLOR, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, height: 42 },
  dropdownText: { flex: 1, color: TEXT_MAIN, fontSize: FontSize.xs },

  optionsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  langChip: { backgroundColor: BG_COLOR, borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  langChipActive: { backgroundColor: ESPRESSO, borderColor: ESPRESSO },
  langText: { color: TEXT_MUTED, fontSize: 10, fontWeight: '700' },
  langTextActive: { color: GOLD, fontWeight: '900' },

  interestsShortcutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: Spacing.four, gap: Spacing.three, ...Shadows.sm },
  interestsShortcutTitle: { color: TEXT_MAIN, fontSize: FontSize.xs, fontWeight: '900' },
  interestsShortcutSub: { color: TEXT_MUTED, fontSize: 10, marginTop: 2 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ESPRESSO, borderRadius: 8, height: 46, marginTop: 6 },
  saveBtnText: { color: GOLD, fontSize: FontSize.xs, fontWeight: '900' },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, height: 42, marginTop: 8 },
  deleteBtnText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: '900' },

  modalBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: Spacing.four },
  modalBox: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 14, maxHeight: 400, ...Shadows.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { color: GOLD, fontSize: FontSize.xs, fontWeight: '900' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalItemActive: { backgroundColor: BG_COLOR },
  modalItemText: { color: TEXT_MAIN, fontSize: FontSize.xs },
  modalItemTextActive: { color: GOLD, fontWeight: '900' },
});
