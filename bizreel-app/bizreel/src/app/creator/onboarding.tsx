/**
 * Creator Onboarding Studio Wizard
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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

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

const LANGUAGES_LIST = ['Hindi', 'English', 'Chhattisgarhi', 'Marathi', 'Tamil', 'Telugu', 'Punjabi', 'Others'];

const EXPERIENCE_LEVELS = ['Fresher', '0–1 Year', '1–3 Years', '3–5 Years', '5+ Years'];

export default function CreatorOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const u = (user as any) || {};
  const cp = u.creatorProfile || {};

  // Step 1: Personal & Contact
  const [fullName, setFullName] = useState(cp.fullName || u.name || '');
  const [displayName, setDisplayName] = useState(cp.displayName || u.name || '');
  const [gender, setGender] = useState(cp.gender || 'Male');
  const [dob, setDob] = useState(cp.dob ? String(cp.dob).split('T')[0] : '2000-01-01');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [mobileNumber, setMobileNumber] = useState(cp.mobileNumber || u.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(cp.whatsappNumber || u.phone || '');
  const [email, setEmail] = useState(cp.email || u.email || '');

  // Step 2: Location
  const [country, setCountry] = useState(cp.address?.country || 'India');
  const [stateName, setStateName] = useState(cp.address?.state || u.location?.state || 'Chhattisgarh');
  const [city, setCity] = useState(cp.address?.city || u.city || u.location?.city || '');
  const [district, setDistrict] = useState(cp.address?.district || u.location?.district || '');
  const [pincode, setPincode] = useState(cp.address?.pincode || u.location?.pincode || '');

  // Step 3: Categories & Skills
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    cp.creatorCategories || cp.categories || ['Product Reel Creator', 'UGC Creator']
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    cp.skills || ['Video Shooting', 'Mobile Editing', 'CapCut']
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    cp.languages || ['Hindi', 'English']
  );
  const [experience, setExperience] = useState(cp.experience || '1–3 Years');

  // Step 4: Pricing & Packages
  const [reelPrice, setReelPrice] = useState(String(cp.pricing?.reelPrice || cp.pricing?.reel1 || '1500'));
  const [photoShootPrice, setPhotoShootPrice] = useState(String(cp.pricing?.photoShootPrice || '1000'));
  const [hourlyRate, setHourlyRate] = useState(String(cp.pricing?.hourlyRate || '800'));
  const [monthlyCollaboration, setMonthlyCollaboration] = useState(String(cp.pricing?.monthlyCollaboration || '15000'));
  const [negotiable, setNegotiable] = useState(cp.pricing?.negotiable !== false);
  const [bio, setBio] = useState(cp.bio || '');

  // Step 5: Portfolio & Social Links
  const [instagramLink, setInstagramLink] = useState(cp.portfolio?.instagramLink || '');
  const [youtubeLink, setYoutubeLink] = useState(cp.portfolio?.youtubeLink || '');
  const [portfolioVideoLink, setPortfolioVideoLink] = useState(cp.portfolio?.portfolioVideoLink || '');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const toggleArrayItem = (item: string, array: string[], setArray: (v: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim() || !displayName.trim()) {
        Alert.alert('Required Fields', 'Please enter your Full Name and Display Name.');
        return;
      }
      if (!mobileNumber.trim()) {
        Alert.alert('Required Field', 'Please enter your Mobile Number.');
        return;
      }
      if (!ageConfirmed) {
        Alert.alert('Age Restriction', 'You must confirm you are 18+ years of age.');
        return;
      }
    } else if (currentStep === 2) {
      if (!city.trim() || !stateName.trim()) {
        Alert.alert('Required Location', 'Please enter your City and State.');
        return;
      }
    } else if (currentStep === 3) {
      if (selectedCategories.length === 0) {
        Alert.alert('Category Selection', 'Please select at least one Creator Category.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleCompleteRegistration = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms & Policy', 'Please agree to the Creator Collaboration Terms & Policy to activate your profile.');
      return;
    }

    setSubmitting(true);
    try {
      const creatorProfileData = {
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        gender,
        dob,
        ageConfirmed,
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: (whatsappNumber || mobileNumber).trim(),
        email: email.trim(),
        address: {
          country: country.trim(),
          state: stateName.trim(),
          district: (district || city).trim(),
          city: city.trim(),
          pincode: pincode.trim(),
        },
        creatorCategories: selectedCategories,
        categories: selectedCategories,
        skills: selectedSkills,
        languages: selectedLanguages,
        experience,
        pricing: {
          reelPrice: Number(reelPrice) || 1500,
          reel1: Number(reelPrice) || 1500,
          photoShootPrice: Number(photoShootPrice) || 1000,
          hourlyRate: Number(hourlyRate) || 800,
          monthlyCollaboration: Number(monthlyCollaboration) || 15000,
          negotiable,
        },
        bio: bio.trim(),
        portfolio: {
          instagramLink: instagramLink.trim(),
          youtubeLink: youtubeLink.trim(),
          portfolioVideoLink: portfolioVideoLink.trim(),
        },
        termsAccepted: true,
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
          <Ionicons name="arrow-back" size={20} color="#fff" />
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
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Sharma" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Creator Display / Studio Handle *</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="e.g. Rahul Content Studio" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Mobile Phone Number *</Text>
            <TextInput style={styles.input} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>WhatsApp Number</Text>
            <TextInput style={styles.input} value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="creator@example.com" placeholderTextColor="rgba(255,255,255,0.4)" />

            <View style={styles.switchRow}>
              <Switch value={ageConfirmed} onValueChange={setAgeConfirmed} trackColor={{ false: BORDER, true: YELLOW }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>I confirm I am 18+ years of age for Creator registration</Text>
            </View>
          </View>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Location & Operating Region</Text>

            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="India" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>State *</Text>
            <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="e.g. Chhattisgarh, Maharashtra, Delhi" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>City *</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Raipur, Bilaspur, Durg, Bhilai" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>District</Text>
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="e.g. Raipur" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Pincode</Text>
            <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="number-pad" placeholder="492001" placeholderTextColor="rgba(255,255,255,0.4)" />
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
            <TextInput style={styles.input} value={reelPrice} onChangeText={setReelPrice} keyboardType="number-pad" placeholder="1500" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Product Photo Shoot Rate (₹)</Text>
            <TextInput style={styles.input} value={photoShootPrice} onChangeText={setPhotoShootPrice} keyboardType="number-pad" placeholder="1000" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Hourly Shoot Rate (₹)</Text>
            <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="number-pad" placeholder="800" placeholderTextColor="rgba(255,255,255,0.4)" />

            <Text style={styles.label}>Monthly Brand Collaboration Package (₹)</Text>
            <TextInput style={styles.input} value={monthlyCollaboration} onChangeText={setMonthlyCollaboration} keyboardType="number-pad" placeholder="15000" placeholderTextColor="rgba(255,255,255,0.4)" />

            <View style={styles.switchRow}>
              <Switch value={negotiable} onValueChange={setNegotiable} trackColor={{ false: BORDER, true: YELLOW }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>Open to budget negotiations for long-term vendor campaigns</Text>
            </View>

            <Text style={styles.label}>Creator Bio / Pitch Statement</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Describe your creative style and why local vendors should hire you..."
              placeholderTextColor="rgba(255,255,255,0.4)"
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
            <TextInput style={styles.input} value={instagramLink} onChangeText={setInstagramLink} placeholder="https://instagram.com/yourhandle" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />

            <Text style={styles.label}>YouTube Channel / Video Link</Text>
            <TextInput style={styles.input} value={youtubeLink} onChangeText={setYoutubeLink} placeholder="https://youtube.com/@channel" placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />

            <Text style={styles.label}>Sample Portfolio Video Link</Text>
            <TextInput style={styles.input} value={portfolioVideoLink} onChangeText={setPortfolioVideoLink} placeholder="https://drive.google.com/..." placeholderTextColor="rgba(255,255,255,0.4)" autoCapitalize="none" />

            <View style={styles.switchRow}>
              <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: BORDER, true: YELLOW }} thumbColor="#fff" />
              <Text style={styles.switchLabel}>I accept the BizReels Creator Collaboration Policy & Terms</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteRegistration} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={BLACK} />
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
  progressTrack: { height: 4, backgroundColor: BORDER, width: '100%' },
  progressFill: { height: '100%', backgroundColor: YELLOW },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  card: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, borderRadius: 12, gap: Spacing.two },
  cardTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', marginBottom: 4 },
  label: { color: '#ddd', fontSize: FontSize.xs, fontWeight: '700', marginTop: 8 },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  chipText: { color: '#ccc', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: BLACK, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  switchLabel: { flex: 1, color: '#ccc', fontSize: 11, fontWeight: '600' },
  nextBtn: { backgroundColor: YELLOW, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  nextBtnText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
  submitBtn: { backgroundColor: YELLOW, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitBtnText: { color: BLACK, fontSize: FontSize.base, fontWeight: '900' },
});
