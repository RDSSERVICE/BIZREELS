/**
 * Creator Onboarding Studio Wizard
 * Redesigned to match the rest of the application's Warm Matte Light Color Theme.
 * Full Feature Parity with Web BecomeCreatorPage.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const PRIMARY = '#F59E0B';
const PRIMARY_DARK = '#D97706';
const PRIMARY_LIGHT_BG = '#FFFBEB';
const BG_LIGHT = '#F6F4EE';
const CARD_BG = '#FFFFFF';
const INPUT_BG = '#F0EDE4';
const BORDER = '#E5E0D4';
const TEXT_DARK = '#1E1B18';
const TEXT_MUTED = '#6E675F';
const TEXT_PLACEHOLDER = '#8C857B';

const CREATOR_CATEGORIES = [
  'Product Reel Creator',
  'Product Photographer',
  'Video Editor',
  'Graphic Designer',
  'UGC Creator',
  'Influencer',
  'Voice Over Artist',
  'AI Content Creator',
  'Script Writer',
  'Copywriter',
  'Thumbnail Designer',
  'Animation Creator',
  'Drone Videographer',
  'Livestream Host',
];

const SKILLS_LIST = [
  'Video Shooting',
  'Video Editing',
  'Photo Editing',
  'AI Video',
  'AI Image',
  'Canva',
  'CapCut',
  'Premiere Pro',
  'After Effects',
  'Photoshop',
  'Mobile Editing',
];

const LANGUAGES_LIST = ['Hindi', 'English', 'Chhattisgarhi', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada'];
const EXPERIENCE_LEVELS = ['Beginner (0-1 yrs)', 'Intermediate (1-3 yrs)', 'Professional (3+ yrs)'];

export default function CreatorOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState(user?.name || '');
  const [displayName, setDisplayName] = useState((user as any)?.creatorProfile?.displayName || user?.name || '');
  const [gender, setGender] = useState((user as any)?.creatorProfile?.gender || 'Male');
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [ageConfirmed, setAgeConfirmed] = useState(true);

  // Step 2: Location
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState((user as any)?.creatorProfile?.state || 'Chhattisgarh');
  const [city, setCity] = useState(user?.city || (user as any)?.creatorProfile?.city || 'Raipur');
  const [district, setDistrict] = useState(user?.city || 'Raipur');
  const [pincode, setPincode] = useState((user as any)?.creatorProfile?.pincode || '');

  // Step 3: Categories & Skills
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    (user as any)?.creatorProfile?.categories || ['Product Reel Creator']
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    (user as any)?.creatorProfile?.skills || ['Video Shooting', 'Video Editing']
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    (user as any)?.creatorProfile?.languages || ['Hindi', 'English']
  );
  const [experience, setExperience] = useState((user as any)?.creatorProfile?.experience || 'Intermediate (1-3 yrs)');

  // Step 4: Pricing & Bio
  const [reelPrice, setReelPrice] = useState(String((user as any)?.creatorProfile?.reelPrice || 1500));
  const [photoShootPrice, setPhotoShootPrice] = useState(String((user as any)?.creatorProfile?.photoShootPrice || 1000));
  const [hourlyRate, setHourlyRate] = useState(String((user as any)?.creatorProfile?.hourlyRate || 800));
  const [monthlyCollaboration, setMonthlyCollaboration] = useState(
    String((user as any)?.creatorProfile?.monthlyCollaboration || 15000)
  );
  const [negotiable, setNegotiable] = useState(Boolean((user as any)?.creatorProfile?.negotiable ?? true));
  const [bio, setBio] = useState((user as any)?.creatorProfile?.bio || '');

  // Step 5: Portfolio & Socials
  const [instagramLink, setInstagramLink] = useState((user as any)?.creatorProfile?.socialLinks?.instagram || '');
  const [youtubeLink, setYoutubeLink] = useState((user as any)?.creatorProfile?.socialLinks?.youtube || '');
  const [portfolioVideoLink, setPortfolioVideoLink] = useState((user as any)?.creatorProfile?.portfolioVideoLink || '');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const toggleArrayItem = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!fullName.trim() || !mobileNumber.trim())) {
      Alert.alert('Personal Details Required', 'Please enter your Full Name and Mobile Contact Number.');
      return;
    }
    if (currentStep === 2 && (!stateName.trim() || !city.trim())) {
      Alert.alert('Location Details Required', 'Please specify your operating State and City.');
      return;
    }
    if (currentStep === 3 && selectedCategories.length === 0) {
      Alert.alert('Creator Category Required', 'Please select at least 1 Creator Category.');
      return;
    }
    if (currentStep === 4 && !reelPrice) {
      Alert.alert('Reel Rate Required', 'Please enter your Base Reel Creation Price.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Creator Collaboration Terms to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const creatorProfileData = {
        displayName: displayName.trim() || fullName.trim(),
        fullName: fullName.trim(),
        gender,
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim(),
        ageConfirmed,
        country,
        state: stateName.trim(),
        city: city.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
        categories: selectedCategories,
        category: selectedCategories[0] || 'Product Reel Creator',
        skills: selectedSkills,
        languages: selectedLanguages,
        experience,
        reelPrice: Number(reelPrice) || 1500,
        photoShootPrice: Number(photoShootPrice) || 1000,
        hourlyRate: Number(hourlyRate) || 800,
        monthlyCollaboration: Number(monthlyCollaboration) || 15000,
        negotiable,
        bio: bio.trim(),
        socialLinks: {
          instagram: instagramLink.trim(),
          youtube: youtubeLink.trim(),
        },
        portfolioVideoLink: portfolioVideoLink.trim(),
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update Profile Data in backend
      const res = await api.patch('/users/me', {
        name: displayName.trim(),
        city: city.trim(),
        creatorProfile: creatorProfileData,
      });

      // 2. Ensure Active Role is switched to creator
      const switchRes = await api.post('/v1/users/me/switch-role', { role: 'creator' }).catch(() => null);

      const updatedUser = switchRes?.data?.user || res.data?.data?.user || res.data?.user || res.data;
      if (updatedUser) {
        setUser({
          ...user,
          ...updatedUser,
          activeRole: 'creator',
          current_role: 'creator',
        });
      }

      Alert.alert('🎉 Creator Studio Activated!', 'Your Creator Profile is now live for vendor collaboration deals.');
      router.replace('/creator/dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Could not complete creator onboarding.';
      Alert.alert('Registration Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (currentStep > 1 ? setCurrentStep((s) => s - 1) : router.replace('/(tabs)/home'))}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR ONBOARDING</Text>
          <Text style={styles.headerSub}>Step {currentStep} of 5 — Creator Studio Setup</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(currentStep / 5) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Personal & Contact */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Personal Identity & Contact</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Sharma" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Creator Display / Studio Handle *</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="e.g. Rahul Content Studio" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Mobile Phone Number *</Text>
            <TextInput style={styles.input} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput style={styles.input} value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="creator@example.com" placeholderTextColor={TEXT_PLACEHOLDER} />

            <View style={styles.switchRow}>
              <Switch value={ageConfirmed} onValueChange={setAgeConfirmed} trackColor={{ false: '#CBD5E1', true: PRIMARY }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>I confirm I am 18+ years of age for Creator registration</Text>
            </View>
          </View>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Location & Operating Region</Text>

            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="India" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>State *</Text>
            <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="e.g. Chhattisgarh, Maharashtra, Delhi" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>City *</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Raipur, Bilaspur, Durg, Bhilai" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>District</Text>
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. Raipur" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Pincode</Text>
            <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="number-pad" placeholder="492001" placeholderTextColor={TEXT_PLACEHOLDER} />
          </View>
        )}

        {/* Step 3: Categories & Skills */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Creator Specialty & Skills</Text>

            <Text style={styles.label}>Select Creator Categories *</Text>
            <View style={styles.chipRow}>
              {CREATOR_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity key={cat} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleArrayItem(cat, selectedCategories, setSelectedCategories)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Skills & Tools Used</Text>
            <View style={styles.chipRow}>
              {SKILLS_LIST.map((skill) => {
                const active = selectedSkills.includes(skill);
                return (
                  <TouchableOpacity key={skill} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleArrayItem(skill, selectedSkills, setSelectedSkills)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{skill}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Languages Spoken</Text>
            <View style={styles.chipRow}>
              {LANGUAGES_LIST.map((lang) => {
                const active = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity key={lang} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleArrayItem(lang, selectedLanguages, setSelectedLanguages)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Experience Level</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <TouchableOpacity key={exp} style={[styles.chip, experience === exp && styles.chipActive]} onPress={() => setExperience(exp)}>
                  <Text style={[styles.chipText, experience === exp && styles.chipTextActive]}>{exp}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Pricing & Package Rates */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>4. Pricing & Rates (₹)</Text>

            <Text style={styles.label}>Base Reel Price (₹) *</Text>
            <TextInput style={styles.input} value={reelPrice} onChangeText={setReelPrice} keyboardType="number-pad" placeholder="1500" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Product Photo Shoot Rate (₹)</Text>
            <TextInput style={styles.input} value={photoShootPrice} onChangeText={setPhotoShootPrice} keyboardType="number-pad" placeholder="1000" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Hourly Shoot Rate (₹)</Text>
            <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="number-pad" placeholder="800" placeholderTextColor={TEXT_PLACEHOLDER} />

            <Text style={styles.label}>Monthly Brand Collaboration Package (₹)</Text>
            <TextInput style={styles.input} value={monthlyCollaboration} onChangeText={setMonthlyCollaboration} keyboardType="number-pad" placeholder="15000" placeholderTextColor={TEXT_PLACEHOLDER} />

            <View style={styles.switchRow}>
              <Switch value={negotiable} onValueChange={setNegotiable} trackColor={{ false: '#CBD5E1', true: PRIMARY }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>Open to budget negotiations for long-term vendor campaigns</Text>
            </View>

            <Text style={styles.label}>Creator Bio / Pitch Statement</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe your creative style and why local vendors should hire you..."
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        )}

        {/* Step 5: Portfolio & Social Links */}
        {currentStep === 5 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>5. Portfolio Links & Activation</Text>

            <Text style={styles.label}>Instagram Profile / Reel Link</Text>
            <TextInput style={styles.input} value={instagramLink} onChangeText={setInstagramLink} placeholder="https://instagram.com/yourhandle" placeholderTextColor={TEXT_PLACEHOLDER} autoCapitalize="none" />

            <Text style={styles.label}>YouTube Channel / Video Link</Text>
            <TextInput style={styles.input} value={youtubeLink} onChangeText={setYoutubeLink} placeholder="https://youtube.com/@channel" placeholderTextColor={TEXT_PLACEHOLDER} autoCapitalize="none" />

            <Text style={styles.label}>Sample Portfolio Video Link</Text>
            <TextInput style={styles.input} value={portfolioVideoLink} onChangeText={setPortfolioVideoLink} placeholder="https://drive.google.com/..." placeholderTextColor={TEXT_PLACEHOLDER} autoCapitalize="none" />

            <View style={styles.switchRow}>
              <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: '#CBD5E1', true: PRIMARY }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>I accept the BizReels Creator Collaboration Policy & Terms</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteRegistration} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Complete & Activate Creator Studio ✦</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>Continue to Step {currentStep + 1} →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_LIGHT },
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
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  headerTitle: { color: PRIMARY_DARK, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 0.5 },
  headerSub: { color: TEXT_MUTED, fontSize: FontSize.xs, fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: BORDER, width: '100%' },
  progressFill: { height: '100%', backgroundColor: PRIMARY },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  card: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, borderRadius: Radius.lg, gap: Spacing.two },
  cardTitle: { color: PRIMARY_DARK, fontSize: FontSize.sm, fontWeight: '900', marginBottom: 4 },
  label: { color: '#475569', fontSize: FontSize.xs, fontWeight: '700', marginTop: 8 },
  input: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT_DARK,
    paddingHorizontal: Spacing.three,
    height: 44,
    fontSize: FontSize.xs,
    borderRadius: Radius.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { color: TEXT_DARK, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '900' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  switchLabel: { flex: 1, color: TEXT_DARK, fontSize: 11, fontWeight: '600' },
  nextBtn: { backgroundColor: PRIMARY, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  nextBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '900' },
  submitBtn: { backgroundColor: PRIMARY, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitBtnText: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: '900' },
});
