/**
 * Vendor Onboarding Hub — Full 6-step Interactive Wizard
 * Parity with Web Frontend BecomeVendorPage.jsx
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';
import { useCategories } from '@/features/search/queries';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const BUSINESS_TYPES = [
  { id: 'Retailer', label: 'Retailer / Shop', desc: 'Local shop, showroom, boutique store' },
  { id: 'Service Provider', label: 'Service Provider', desc: 'Repairs, salon, cleaning, consulting, etc.' },
  { id: 'Individual Seller', label: 'Individual Seller', desc: 'Single owner selling items or products' },
  { id: 'Business/Firm', label: 'Business / Firm', desc: 'Registered company, LLC, or private firm' },
  { id: 'Wholesaler', label: 'Wholesaler', desc: 'Bulk quantity sales to retailers & businesses' },
  { id: 'Manufacturer', label: 'Manufacturer', desc: 'Factory, production unit, craft maker' },
  { id: 'Distributor', label: 'Distributor', desc: 'Regional or city distribution agent' },
  { id: 'Freelancer', label: 'Freelancer', desc: 'Independent contractor or creative professional' },
];

const WEEKLY_OFF_OPTIONS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'None'];

export default function VendorOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { refetch: refetchProfile } = useCurrentUserProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Business Type & Offering
  const [businessType, setBusinessType] = useState('Retailer');
  const [vendorType, setVendorType] = useState<'product' | 'service' | 'both'>('both');

  // Step 2: Shop Details & Categories
  const [shopName, setShopName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [shopCoverImage, setShopCoverImage] = useState('');

  // AI Description Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAiBio, setGeneratingAiBio] = useState(false);

  // Category Pickers Modals
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [subSearch, setSubSearch] = useState('');

  // Step 3: Contact Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Step 4: Business Address & Geolocation
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Indore');
  const [city, setCity] = useState('Indore');
  const [areaLocality, setAreaLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [googleMapLocation, setGoogleMapLocation] = useState('');

  // Step 5: Delivery & Service Operations
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [homeDeliveryRadius, setHomeDeliveryRadius] = useState('5 km');
  const [homeDeliveryMinOrder, setHomeDeliveryMinOrder] = useState('200');
  const [homeDeliveryCharge, setHomeDeliveryCharge] = useState('30');
  const [courierByVendor, setCourierByVendor] = useState(true);
  const [customerVisitShop, setCustomerVisitShop] = useState(true);
  const [serviceAtCustomerLocation, setServiceAtCustomerLocation] = useState(false);
  const [serviceRadius, setServiceRadius] = useState('10 km');
  const [serviceMinOrder, setServiceMinOrder] = useState('500');

  // Step 6: Business Hours & Declaration
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyOff, setWeeklyOff] = useState('Sunday');
  const [open24x7, setOpen24x7] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch Categories
  const { data: categoriesRes } = useCategories();
  const categoriesList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes as any)?.items || (categoriesRes as any)?.categories || (categoriesRes as any)?.data || [];

  const parentCategories = categoriesList.filter((c: any) => !c.parent_id);

  // Hydrate user info
  useEffect(() => {
    if (user) {
      const u: any = user;
      if (u.phone || u.phone_number) {
        setMobileNumber(u.phone || u.phone_number);
        setWhatsappNumber(u.phone || u.phone_number);
      }
      if (u.email) setEmail(u.email);
      if (u.name) {
        setShopName(u.name);
        setDisplayName(u.name);
      }

      const vp: any = u.vendorProfile || {};
      if (vp.businessType) setBusinessType(vp.businessType);
      if (vp.vendorType) setVendorType(vp.vendorType);
      if (vp.shopName) setShopName(vp.shopName);
      if (vp.displayName) setDisplayName(vp.displayName);
      if (vp.categories && Array.isArray(vp.categories)) setSelectedCategories(vp.categories);
      if (vp.subCategories && Array.isArray(vp.subCategories)) setSelectedSubCategories(vp.subCategories);
      if (vp.businessDescription) setBusinessDescription(vp.businessDescription);
      if (vp.shopLogo) setShopLogo(vp.shopLogo);
      if (vp.shopCoverImage) setShopCoverImage(vp.shopCoverImage);
      if (vp.address) {
        if (vp.address.pincode) setPincode(vp.address.pincode);
        if (vp.address.state) setStateName(vp.address.state);
        if (vp.address.city) setCity(vp.address.city);
        if (vp.address.district) setDistrict(vp.address.district);
        if (vp.address.areaLocality) setAreaLocality(vp.address.areaLocality);
        if (vp.address.fullAddress) setFullAddress(vp.address.fullAddress);
      }
    }
  }, [user]);

  // Pincode Auto Lookup
  const handlePincodeLookup = async (code: string) => {
    if (!code || code.length !== 6) return;
    setPincodeLoading(true);
    try {
      const { data } = await api.post('/location/pincode-lookup', { pincode: code });
      const res = data?.data || data;
      if (res) {
        if (res.city) setCity(res.city);
        if (res.state) setStateName(res.state);
        if (res.district || res.city) setDistrict(res.district || res.city);
        if (res.area && !areaLocality) setAreaLocality(res.area);
        Alert.alert('📍 Location Found', `Auto-fetched: ${res.city || res.area}, ${res.state}`);
      }
    } catch (err) {
      console.warn('Pincode lookup error', err);
    } finally {
      setPincodeLoading(false);
    }
  };

  // GPS Auto-detect location
  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to detect your address.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      try {
        const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeo && reverseGeo.length > 0) {
          const item = reverseGeo[0];
          if (item.postalCode) {
            setPincode(item.postalCode);
            handlePincodeLookup(item.postalCode);
          }
          if (item.city || item.subregion) setCity(item.city || item.subregion || 'Indore');
          if (item.region) setStateName(item.region);
          if (item.district) setDistrict(item.district);
          if (item.street || item.name) {
            const addr = [item.name, item.street, item.subregion, item.city].filter(Boolean).join(', ');
            setFullAddress(addr);
          }
        }
      } catch (e) {}

      setGoogleMapLocation(`https://maps.google.com/?q=${latitude},${longitude}`);
      Alert.alert('📍 GPS Detected', 'Updated location coordinates successfully!');
    } catch (err) {
      Alert.alert('Error', 'Could not detect location. Please enter manually.');
    } finally {
      setDetectingGps(false);
    }
  };

  // Gemini AI Bio Generator
  const handleGenerateAiBio = async () => {
    const sName = shopName.trim() || displayName.trim() || 'Our Business';
    const catsStr = selectedCategories.join(', ') || 'Quality Products & Services';
    const promptText = aiPrompt.trim() || `${sName} specializing in ${catsStr}`;

    setGeneratingAiBio(true);
    try {
      const { data } = await api.post('/ai/generate-description', {
        prompt: promptText,
        type: 'business_profile',
        category: selectedCategories[0] || 'General',
        context: { shopName: sName, businessType, vendorType, city, state: stateName },
      });
      const res = data?.data || data;
      const desc = res?.detailedDescription || res?.description || res?.shortDescription;
      if (desc) {
        setBusinessDescription(desc);
        Alert.alert('✨ AI Generated Bio', 'Business description generated successfully!');
      } else {
        Alert.alert('Notice', 'AI could not generate bio. Please type manually.');
      }
    } catch (err) {
      Alert.alert('Notice', 'AI bio generation unavailable right now. Please type description manually.');
    } finally {
      setGeneratingAiBio(false);
    }
  };

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const toggleSubCategory = (subName: string) => {
    if (selectedSubCategories.includes(subName)) {
      setSelectedSubCategories(selectedSubCategories.filter((s) => s !== subName));
    } else {
      setSelectedSubCategories([...selectedSubCategories, subName]);
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!businessType) {
        Alert.alert('Validation Error', 'Please select your Business Type.');
        return;
      }
    } else if (currentStep === 2) {
      if (!shopName.trim()) {
        Alert.alert('Validation Error', 'Please enter your Shop / Business Name.');
        return;
      }
      if (selectedCategories.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one primary Business Category.');
        return;
      }
    } else if (currentStep === 3) {
      if (!mobileNumber.trim()) {
        Alert.alert('Validation Error', 'Please enter your Contact Mobile Number.');
        return;
      }
    } else if (currentStep === 4) {
      if (!pincode || pincode.length !== 6) {
        Alert.alert('Validation Error', 'Please enter a valid 6-digit PIN code.');
        return;
      }
      if (!fullAddress.trim()) {
        Alert.alert('Validation Error', 'Please enter your Full Business Address.');
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Final Submit Action
  const handleSubmitOnboarding = async () => {
    if (!termsAccepted) {
      Alert.alert('Declaration Required', 'Please accept the Vendor Declaration & Terms to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const vendorProfileData = {
        businessType,
        vendorType,
        shopName: shopName.trim(),
        displayName: displayName.trim() || shopName.trim(),
        categories: selectedCategories,
        category: selectedCategories[0] || 'General',
        subCategories: selectedSubCategories,
        businessDescription: businessDescription.trim(),
        description: businessDescription.trim(),
        shopLogo,
        shopCoverImage,
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
        email: email.trim(),
        website: website.trim(),
        address: {
          pincode,
          state: stateName,
          district: district || city,
          city,
          areaLocality: areaLocality.trim(),
          fullAddress: fullAddress.trim(),
          googleMapLocation,
        },
        businessAddress: fullAddress.trim(),
        deliveryService: {
          homeDelivery: {
            enabled: homeDeliveryEnabled,
            freeRadius: homeDeliveryRadius,
            minOrderPrice: Number(homeDeliveryMinOrder) || 0,
            deliveryCharge: Number(homeDeliveryCharge) || 0,
          },
          courierByVendor,
          customerVisitShop,
          serviceAtCustomerLocation: {
            enabled: serviceAtCustomerLocation,
            serviceRadius,
            minOrderPrice: Number(serviceMinOrder) || 0,
          },
        },
        businessHours: open24x7 ? 'Open 24/7' : `${openingTime} - ${closingTime} (Off: ${weeklyOff})`,
        businessTiming: { openingTime, closingTime, weeklyOff, open24x7 },
        termsAccepted: true,
        updatedAt: new Date().toISOString(),
      };

      await api.post('/auth/add-role', {
        role: 'vendor',
        profileData: vendorProfileData,
      });

      const { data: updatedProfile } = await refetchProfile();
      if (updatedProfile) setUser(updatedProfile);

      Alert.alert('🎉 Vendor Registration Completed!', 'Your vendor business profile has been activated successfully!', [
        {
          text: 'Go to Vendor Control Center',
          onPress: () => router.replace('/vendor/dashboard' as any),
        },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not complete vendor onboarding.';
      Alert.alert('Onboarding Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back())}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VENDOR STORE SETUP ({currentStep}/6)</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={() => Alert.alert('Vendor Help', 'Complete these 6 steps to launch your digital store on BizReels!')}>
          <Ionicons name="help-circle-outline" size={20} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${(currentStep / 6) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── STEP 1: BUSINESS TYPE & OFFERING ── */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>1. BUSINESS TYPE & OFFERINGS</Text>
            <Text style={styles.stepSub}>Select your primary business model and product/service type.</Text>

            {/* Vendor Type Switcher */}
            <Text style={styles.fieldLabel}>WHAT DO YOU OFFER?</Text>
            <View style={styles.pillRow}>
              {[
                { id: 'product', label: '🛍️ Products Only' },
                { id: 'service', label: '🛠️ Services Only' },
                { id: 'both', label: '⚡ Both Products & Services' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pillBtn, vendorType === item.id && styles.pillBtnActive]}
                  onPress={() => setVendorType(item.id as any)}>
                  <Text style={[styles.pillBtnText, vendorType === item.id && styles.pillBtnTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Business Type Selection */}
            <Text style={styles.fieldLabel}>BUSINESS TYPE / FIRM CATEGORY</Text>
            <View style={styles.bTypeGrid}>
              {BUSINESS_TYPES.map((bt) => {
                const isSelected = businessType === bt.id;
                return (
                  <TouchableOpacity
                    key={bt.id}
                    style={[styles.bTypeCard, isSelected && styles.bTypeCardActive]}
                    onPress={() => setBusinessType(bt.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bTypeTitle, isSelected && styles.bTypeTitleActive]}>
                        {bt.label}
                      </Text>
                      <Text style={styles.bTypeDesc}>{bt.desc}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={BLACK} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 2: SHOP DETAILS & CATEGORIES ── */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>2. SHOP BRANDING & CATEGORIES</Text>
            <Text style={styles.stepSub}>Provide store details, categories, and business description.</Text>

            <Text style={styles.fieldLabel}>SHOP / BUSINESS NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Furniture & Interiors"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={shopName}
              onChangeText={setShopName}
            />

            <Text style={styles.fieldLabel}>DISPLAY NAME (PUBLIC STORE TITLE)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Interiors Showroom"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={displayName}
              onChangeText={setDisplayName}
            />

            {/* Category Selector Button */}
            <Text style={styles.fieldLabel}>PRIMARY CATEGORIES *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setCatModalVisible(true)}>
              <Text style={styles.pickerBtnText}>
                {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Select Categories...'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={YELLOW} />
            </TouchableOpacity>

            {/* Subcategory Selector Button */}
            <Text style={styles.fieldLabel}>SUBCATEGORIES (OPTIONAL)</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setSubModalVisible(true)}>
              <Text style={styles.pickerBtnText}>
                {selectedSubCategories.length > 0 ? selectedSubCategories.join(', ') : 'Select Subcategories...'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={YELLOW} />
            </TouchableOpacity>

            {/* Gemini AI Bio Generator */}
            <View style={styles.aiBox}>
              <View style={styles.aiBoxHeader}>
                <Ionicons name="sparkles" size={16} color={YELLOW} />
                <Text style={styles.aiBoxTitle}>GEMINI AI BUSINESS BIO GENERATOR</Text>
              </View>
              <TextInput
                style={styles.aiInput}
                placeholder="Key keywords (e.g. Handmade wooden sofa, 10 yrs warranty...)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={aiPrompt}
                onChangeText={setAiPrompt}
              />
              <TouchableOpacity
                style={styles.aiGenerateBtn}
                onPress={handleGenerateAiBio}
                disabled={generatingAiBio}>
                {generatingAiBio ? (
                  <ActivityIndicator size="small" color={BLACK} />
                ) : (
                  <>
                    <Ionicons name="flash" size={14} color={BLACK} />
                    <Text style={styles.aiGenerateBtnText}>GENERATE BIO WITH AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>BUSINESS DESCRIPTION & STORE OVERVIEW</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe your products, warranty, services, experience..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              value={businessDescription}
              onChangeText={setBusinessDescription}
            />

            <Text style={styles.fieldLabel}>STORE LOGO IMAGE URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://... logo image link"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={shopLogo}
              onChangeText={setShopLogo}
            />

            <Text style={styles.fieldLabel}>COVER BANNER IMAGE URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://... cover banner image link"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={shopCoverImage}
              onChangeText={setShopCoverImage}
            />
          </View>
        )}

        {/* ── STEP 3: CONTACT & COMMUNICATION ── */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>3. CONTACT & COMMUNICATION</Text>
            <Text style={styles.stepSub}>Enter customer contact phone, WhatsApp, email, and website.</Text>

            <Text style={styles.fieldLabel}>MOBILE PHONE NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <Text style={styles.fieldLabel}>WHATSAPP BUSINESS NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="WhatsApp number for leads"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
            />

            <Text style={styles.fieldLabel}>BUSINESS EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="store@example.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.fieldLabel}>WEBSITE / CATALOG LINK (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.yourstore.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="url"
              value={website}
              onChangeText={setWebsite}
            />
          </View>
        )}

        {/* ── STEP 4: BUSINESS ADDRESS & GEOLOCATION ── */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>4. LOCATION & ADDRESS</Text>
            <Text style={styles.stepSub}>6-digit PIN code lookup and GPS geolocation detection.</Text>

            {/* GPS Auto Detect */}
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleDetectGps}
              disabled={detectingGps}>
              {detectingGps ? (
                <ActivityIndicator size="small" color={BLACK} />
              ) : (
                <>
                  <Ionicons name="navigate" size={16} color={BLACK} />
                  <Text style={styles.gpsBtnText}>AUTO-DETECT GPS LOCATION</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>6-DIGIT PIN CODE *</Text>
            <View style={styles.rowInputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 452001"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="number-pad"
                maxLength={6}
                value={pincode}
                onChangeText={(text) => {
                  setPincode(text);
                  if (text.length === 6) handlePincodeLookup(text);
                }}
              />
              <TouchableOpacity
                style={styles.lookupBtn}
                onPress={() => handlePincodeLookup(pincode)}
                disabled={pincodeLoading}>
                {pincodeLoading ? (
                  <ActivityIndicator size="small" color={BLACK} />
                ) : (
                  <Text style={styles.lookupBtnText}>LOOKUP</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>CITY / DISTRICT</Text>
            <TextInput
              style={styles.input}
              placeholder="City name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.fieldLabel}>STATE</Text>
            <TextInput
              style={styles.input}
              placeholder="State name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={stateName}
              onChangeText={setStateName}
            />

            <Text style={styles.fieldLabel}>AREA / LOCALITY</Text>
            <TextInput
              style={styles.input}
              placeholder="Sector, Landmark, Area"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={areaLocality}
              onChangeText={setAreaLocality}
            />

            <Text style={styles.fieldLabel}>FULL BUSINESS ADDRESS *</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Shop No., Street Address, Building, Landmark..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              value={fullAddress}
              onChangeText={setFullAddress}
            />
          </View>
        )}

        {/* ── STEP 5: DELIVERY & SERVICE OPERATIONS ── */}
        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>5. DELIVERY & SERVICE OPERATIONS</Text>
            <Text style={styles.stepSub}>Configure home delivery, pickup, and service parameters.</Text>

            {/* Home Delivery Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setHomeDeliveryEnabled(!homeDeliveryEnabled)}>
              <Ionicons
                name={homeDeliveryEnabled ? 'checkbox' : 'square-outline'}
                size={22}
                color={YELLOW}
              />
              <Text style={styles.toggleText}>Enable Local Home Delivery</Text>
            </TouchableOpacity>

            {homeDeliveryEnabled && (
              <View style={styles.subFieldsBox}>
                <Text style={styles.fieldLabel}>DELIVERY RADIUS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5 km"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={homeDeliveryRadius}
                  onChangeText={setHomeDeliveryRadius}
                />

                <Text style={styles.fieldLabel}>MINIMUM ORDER PRICE (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="200"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  value={homeDeliveryMinOrder}
                  onChangeText={setHomeDeliveryMinOrder}
                />

                <Text style={styles.fieldLabel}>DELIVERY CHARGE (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  value={homeDeliveryCharge}
                  onChangeText={setHomeDeliveryCharge}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setCustomerVisitShop(!customerVisitShop)}>
              <Ionicons
                name={customerVisitShop ? 'checkbox' : 'square-outline'}
                size={22}
                color={YELLOW}
              />
              <Text style={styles.toggleText}>Allow Customers to Visit Shop / In-Store Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setCourierByVendor(!courierByVendor)}>
              <Ionicons
                name={courierByVendor ? 'checkbox' : 'square-outline'}
                size={22}
                color={YELLOW}
              />
              <Text style={styles.toggleText}>Courier / Shipping Available Outside City</Text>
            </TouchableOpacity>

            {/* Service at Customer Location */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setServiceAtCustomerLocation(!serviceAtCustomerLocation)}>
              <Ionicons
                name={serviceAtCustomerLocation ? 'checkbox' : 'square-outline'}
                size={22}
                color={YELLOW}
              />
              <Text style={styles.toggleText}>Provide Onsite Service at Customer's Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 6: BUSINESS HOURS & DECLARATION ── */}
        {currentStep === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>6. BUSINESS HOURS & DECLARATION</Text>
            <Text style={styles.stepSub}>Set operational timings and sign terms declaration.</Text>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setOpen24x7(!open24x7)}>
              <Ionicons name={open24x7 ? 'checkbox' : 'square-outline'} size={22} color={YELLOW} />
              <Text style={styles.toggleText}>Open 24 Hours / 7 Days a Week</Text>
            </TouchableOpacity>

            {!open24x7 && (
              <View style={styles.subFieldsBox}>
                <Text style={styles.fieldLabel}>OPENING TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00 AM"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={openingTime}
                  onChangeText={setOpeningTime}
                />

                <Text style={styles.fieldLabel}>CLOSING TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00 PM"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={closingTime}
                  onChangeText={setClosingTime}
                />

                <Text style={styles.fieldLabel}>WEEKLY OFF DAY</Text>
                <View style={styles.pillRow}>
                  {WEEKLY_OFF_OPTIONS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayPill, weeklyOff === day && styles.dayPillActive]}
                      onPress={() => setWeeklyOff(day)}>
                      <Text style={[styles.dayPillText, weeklyOff === day && styles.dayPillTextActive]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Terms Declaration Checkbox */}
            <TouchableOpacity
              style={styles.declarationBox}
              onPress={() => setTermsAccepted(!termsAccepted)}>
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={24}
                color={YELLOW}
              />
              <Text style={styles.declarationText}>
                I hereby declare that all business details, addresses, and contact numbers provided are genuine and compliant with BizReels Vendor Terms.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step Action Bar */}
        <View style={styles.bottomActionBar}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={() => setCurrentStep(currentStep - 1)}>
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.prevBtnText}>PREVIOUS</Text>
            </TouchableOpacity>
          )}

          {currentStep < 6 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
              <Text style={styles.nextBtnText}>NEXT STEP</Text>
              <Ionicons name="arrow-forward" size={16} color={BLACK} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitOnboarding}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={BLACK} />
              ) : (
                <>
                  <Ionicons name="rocket" size={18} color={BLACK} />
                  <Text style={styles.submitBtnText}>LAUNCH VENDOR STORE</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Categories Selection Modal */}
      <Modal visible={catModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT CATEGORIES</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search categories..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={catSearch}
              onChangeText={setCatSearch}
            />

            <FlatList
              data={parentCategories.filter((c: any) =>
                (c.name || '').toLowerCase().includes(catSearch.toLowerCase())
              )}
              keyExtractor={(item: any) => item._id || item.id}
              renderItem={({ item }) => {
                const isSelected = selectedCategories.includes(item.name);
                return (
                  <TouchableOpacity
                    style={[styles.catModalRow, isSelected && styles.catModalRowActive]}
                    onPress={() => toggleCategory(item.name)}>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? YELLOW : '#fff'}
                    />
                    <Text style={styles.catModalRowText}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setCatModalVisible(false)}>
              <Text style={styles.modalDoneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Subcategories Selection Modal */}
      <Modal visible={subModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT SUBCATEGORIES</Text>
              <TouchableOpacity onPress={() => setSubModalVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search subcategories..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={subSearch}
              onChangeText={setSubSearch}
            />

            <FlatList
              data={categoriesList
                .filter((c: any) => c.parent_id)
                .filter((c: any) =>
                  (c.name || '').toLowerCase().includes(subSearch.toLowerCase())
                )}
              keyExtractor={(item: any) => item._id || item.id}
              renderItem={({ item }) => {
                const isSelected = selectedSubCategories.includes(item.name);
                return (
                  <TouchableOpacity
                    style={[styles.catModalRow, isSelected && styles.catModalRowActive]}
                    onPress={() => toggleSubCategory(item.name)}>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? YELLOW : '#fff'}
                    />
                    <Text style={styles.catModalRowText}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSubModalVisible(false)}>
              <Text style={styles.modalDoneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 32,
    height: 32,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  helpBtn: { padding: 4 },
  progressTrack: { height: 4, backgroundColor: DARK_CARD },
  progressBar: { height: '100%', backgroundColor: YELLOW },
  scrollContent: { padding: 16, paddingBottom: 40 },
  stepContainer: { gap: 12 },
  stepTitle: { color: YELLOW, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  stepSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 },
  fieldLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  input: {
    backgroundColor: DARK_CARD,
    color: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillBtn: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillBtnActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  pillBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  pillBtnTextActive: { color: BLACK },
  bTypeGrid: { gap: 8 },
  bTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  bTypeCardActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  bTypeTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  bTypeTitleActive: { color: BLACK },
  bTypeDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  aiBox: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  aiBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBoxTitle: { color: YELLOW, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  aiInput: {
    backgroundColor: BLACK,
    color: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 8,
    gap: 6,
  },
  aiGenerateBtnText: { color: BLACK, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 8,
  },
  gpsBtnText: { color: BLACK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  rowInputWrapper: { flexDirection: 'row', gap: 8 },
  lookupBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  lookupBtnText: { color: BLACK, fontSize: 11, fontWeight: '900' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },
  subFieldsBox: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 10, gap: 6, marginBottom: 8 },
  dayPill: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 6 },
  dayPillActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  dayPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  dayPillTextActive: { color: BLACK },
  declarationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 12,
    marginTop: 12,
  },
  declarationText: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 16 },
  bottomActionBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  prevBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 12,
    gap: 6,
  },
  nextBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: { color: BLACK, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: DARK_CARD, borderTopWidth: 2, borderTopColor: YELLOW, maxHeight: '80%', padding: 16, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: YELLOW, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  modalSearch: { backgroundColor: BLACK, color: '#fff', borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 },
  catModalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  catModalRowActive: { backgroundColor: 'rgba(245,158,11,0.1)' },
  catModalRowText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalDoneBtn: { backgroundColor: YELLOW, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  modalDoneBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
