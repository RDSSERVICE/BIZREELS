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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const YELLOW = '#C8860A';
const BLACK = '#FAF6F1';
const DARK_CARD = '#FFFFFF';
const BORDER = '#E3DCCB';

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
  const [changingPassword, setChangingPassword] = useState(false);

  // Dropdown Modals
  const [professionModalOpen, setProfessionModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || (user as any).mobile || '');
      setGender((user as any).gender || 'male');
      setDob((user as any).dob || '');
      setLanguage((user as any).language || 'English');

      const uProf = (user as any).profession || (user as any).occupation || '';
      if (uProf) {
        if (CUSTOMER_PROFESSIONS.includes(uProf)) {
          setProfession(uProf);
        } else {
          setProfession('Other / Custom Profession');
          setCustomProfession(uProf);
        }
      }

      const loc = (user as any).location || {};
      setPincode(loc.pincode || (user as any).pincode || '');
      setCity(loc.city || (user as any).city || '');
      setDistrict(loc.district || (user as any).district || '');
      setState(loc.state || (user as any).state || '');
      setAddress(loc.address || (user as any).address || '');
    }
  }, [user]);

  // Pincode auto-lookup
  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    setPincodeMsg(null);

    if (cleaned.length === 6) {
      setFetchingPincode(true);
      try {
        const res = await api.post('/v1/location/pincode-lookup', { pincode: cleaned }).catch(() => null);
        let locData = res?.data;

        if (!locData || !locData.state) {
          const postalRes = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
          const pData = await postalRes.json();
          const entry = Array.isArray(pData) ? pData[0] : pData;
          if (entry && entry.Status === 'Success' && entry.PostOffice?.[0]) {
            const po = entry.PostOffice[0];
            locData = {
              state: po.State,
              district: po.District,
              city: po.District,
              area: po.Name,
            };
          }
        }

        if (locData && locData.state) {
          setState(locData.state);
          setDistrict(locData.district || locData.city || '');
          setCity(locData.area || locData.city || locData.district || '');
          setPincodeMsg(`✓ Auto-filled: ${locData.city || locData.district}, ${locData.state}`);
        } else {
          setPincodeMsg('⚠ Pincode not found. Enter city & state manually.');
        }
      } catch (err) {
        setPincodeMsg('⚠ Lookup failed. Enter details manually.');
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
        name: name.trim(),
        gender,
        profession: finalProf,
        dob,
        language,
        location: {
          pincode,
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          address: address.trim(),
        },
      };

      const res = await api.patch('/v1/users/me', payload).catch(() =>
        api.put('/users/me', payload)
      );

      const updatedUser = res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) {
        setUser({ ...user, ...updatedUser });
      }

      Alert.alert('✅ Profile Saved!', 'Your account settings have been updated successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.message || 'Could not update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New Password and Confirm Password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New Password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/v1/auth/change-password', {
        currentPassword,
        newPassword,
      }).catch(() =>
        api.post('/auth/change-password', { currentPassword, newPassword })
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('🔑 Password Changed!', 'Your password has been changed successfully.');
    } catch (err: any) {
      Alert.alert('Password Error', err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you sure you want to permanently delete your BizReels account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/v1/users/me').catch(() => api.delete('/users/me'));
              signOut();
              Alert.alert('Account Deleted', 'Your account has been deleted.');
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
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>ACCOUNT & PROFILE SETTINGS</Text>
          <Text style={styles.headerSub}>Edit Details, Address & Security</Text>
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
            color={activeTab === 'profile' ? YELLOW : 'rgba(255,255,255,0.6)'}
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
            color={activeTab === 'security' ? YELLOW : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.subTabBtnText, activeTab === 'security' && styles.subTabBtnTextActive]}>
            Security & Auth
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
                  <Ionicons name="person-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                    <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.icon} />
                    <TextInput style={[styles.input, { color: 'rgba(255,255,255,0.5)' }]} value={email} editable={false} />
                  </View>
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={[styles.inputRow, styles.inputDisabled]}>
                    <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.icon} />
                    <TextInput style={[styles.input, { color: 'rgba(255,255,255,0.5)' }]} value={phone} editable={false} />
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
                          color={active ? BLACK : YELLOW}
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
                  <Ionicons name="briefcase-outline" size={16} color={YELLOW} style={styles.icon} />
                  <Text style={styles.dropdownText}>{profession || 'Select Profession...'}</Text>
                  <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              {profession === 'Other / Custom Profession' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Specify Custom Profession</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter custom profession..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
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
                    <Ionicons name="calendar-outline" size={16} color={YELLOW} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(255,255,255,0.4)"
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
              <Text style={styles.sectionHeader}>2. LOCATION & DELIVERY ADDRESS</Text>

              {/* Pincode Lookup */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Enter 6-Digit Pincode (Auto-Fills Location)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="keypad-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 110001 or 400001"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    maxLength={6}
                    value={pincode}
                    onChangeText={handlePincodeChange}
                  />
                  {fetchingPincode && <ActivityIndicator size="small" color={YELLOW} />}
                </View>
                {!!pincodeMsg && <Text style={{ color: YELLOW, fontSize: 10, marginTop: 4 }}>{pincodeMsg}</Text>}
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>City / District</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="location-outline" size={16} color={YELLOW} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Delhi"
                      placeholderTextColor="rgba(255,255,255,0.4)"
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
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={state}
                      onChangeText={setState}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full House / Street Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="home-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Flat 302, B-Block, Connaught Place"
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                <Ionicons name="sparkles" size={24} color={YELLOW} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.interestsShortcutTitle}>Personalize Feed & Interests ›</Text>
                  <Text style={styles.interestsShortcutSub}>Select your favorite categories & subcategories to tailor video reels.</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={YELLOW} />
            </TouchableOpacity>

            {/* Save Profile Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={BLACK} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={BLACK} />
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
                  <Ionicons name="key-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password (min 6 chars)..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={YELLOW} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={changingPassword}>
                {changingPassword ? (
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={BLACK} />
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* DANGER ZONE */}
            <View style={[styles.sectionCard, { borderColor: '#EF4444' }]}>
              <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>ACCOUNT DANGER ZONE</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, lineHeight: 18 }}>
                Deleting your account will permanently wipe your profile, saved reels, cart items, and order history.
              </Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={16} color="#fff" />
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
                <Ionicons name="close" size={20} color="#fff" />
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
                  {profession === item && <Ionicons name="checkmark" size={16} color={YELLOW} />}
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
  },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '600' },

  subTabBar: { flexDirection: 'row', backgroundColor: DARK_CARD, borderBottomWidth: 1, borderBottomColor: BORDER },
  subTabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabBtnActive: { borderBottomColor: YELLOW, backgroundColor: BLACK },
  subTabBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, fontWeight: '700' },
  subTabBtnTextActive: { color: YELLOW, fontWeight: '900' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, paddingBottom: 40 },

  sectionCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.three },
  sectionHeader: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 1 },
  fieldGroup: { gap: 4 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, height: 42 },
  inputDisabled: { opacity: 0.6 },
  icon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: FontSize.xs },

  rowTwo: { flexDirection: 'row', gap: 8 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, height: 40 },
  genderBtnActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  genderText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  genderTextActive: { color: BLACK, fontWeight: '900' },

  dropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, height: 42 },
  dropdownText: { flex: 1, color: '#fff', fontSize: FontSize.xs },

  optionsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  langChip: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 5 },
  langChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  langText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  langTextActive: { color: BLACK, fontWeight: '900' },

  interestsShortcutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: DARK_CARD, borderWidth: 1, borderColor: YELLOW, padding: Spacing.four, gap: Spacing.three },
  interestsShortcutTitle: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  interestsShortcutSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: YELLOW, height: 46, marginTop: 6 },
  saveBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EF4444', height: 42, marginTop: 8 },
  deleteBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.four },
  modalBox: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, maxHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalItemActive: { backgroundColor: BLACK },
  modalItemText: { color: '#fff', fontSize: FontSize.xs },
  modalItemTextActive: { color: YELLOW, fontWeight: '900' },
});
