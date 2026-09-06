/**
 * Vendor Onboarding & Business Setup Screen — Mobile Application
 * Full parity with Web Frontend BecomeVendorPage.jsx (vendor/onboarding-details).
 * Features auto-populating existing data, Shop Logo & Cover Banner image picker & upload,
 * GPS location auto-detection, Pincode lookup, Gemini AI bio generator, and business timings.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';
import { useCategories } from '@/features/search/queries';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

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

const WEEKLY_OFF_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VendorOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const { refetch: refetchProfile } = useCurrentUserProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Business Type & Offering
  const [businessType, setBusinessType] = useState('Retailer');
  const [vendorType, setVendorType] = useState<'product' | 'service' | 'both'>('both');

  // 2. Shop Details, Images & Categories
  const [shopName, setShopName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [shopCoverImage, setShopCoverImage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // AI Description Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAiBio, setGeneratingAiBio] = useState(false);

  // Category Pickers Modals
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [subSearch, setSubSearch] = useState('');

  // 3. Contact Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  // 4. Business Address & Geolocation
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Indore');
  const [city, setCity] = useState('Indore');
  const [areaLocality, setAreaLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [googleMapLocation, setGoogleMapLocation] = useState('');

  // 5. Delivery & Service Operations
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [homeDeliveryRadius, setHomeDeliveryRadius] = useState('5 km');
  const [homeDeliveryMinOrder, setHomeDeliveryMinOrder] = useState('200');
  const [homeDeliveryCharge, setHomeDeliveryCharge] = useState('30');
  const [courierByVendor, setCourierByVendor] = useState(true);
  const [customerVisitShop, setCustomerVisitShop] = useState(true);
  const [serviceAtCustomerLocation, setServiceAtCustomerLocation] = useState(false);
  const [serviceRadius, setServiceRadius] = useState('10 km');
  const [serviceMinOrder, setServiceMinOrder] = useState('500');

  // 6. Business Hours & Declaration
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyOff, setWeeklyOff] = useState('Sunday');
  const [open24x7, setOpen24x7] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Fetch Live Categories from Backend
  const { data: categoriesRes } = useCategories();
  const categoriesList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes as any)?.items || (categoriesRes as any)?.categories || (categoriesRes as any)?.data || [];

  const parentCategories = categoriesList.filter((c: any) => !c.parent_id);
  const subCategoriesList = categoriesList.filter((c: any) => Boolean(c.parent_id));

  // Auto-populate / Hydrate existing vendor profile details
  const fetchAndHydrateProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await api
        .get('/v1/users/me')
        .catch(() => api.get('/vendors/me/profile'))
        .catch(() => api.get('/users/me'));

      const uData = res.data?.data?.user || res.data?.user || res.data?.data || res.data || user || {};
      const vp = uData.vendorProfile || {};

      if (vp.businessType) setBusinessType(vp.businessType);
      if (vp.vendorType) setVendorType(vp.vendorType);

      const resolvedShopName = vp.shopName || vp.businessName || uData.name || '';
      setShopName(resolvedShopName);
      setDisplayName(vp.displayName || resolvedShopName);

      if (Array.isArray(vp.categories) && vp.categories.length > 0) {
        setSelectedCategories(vp.categories);
      } else if (vp.category) {
        setSelectedCategories([vp.category]);
      }

      if (Array.isArray(vp.subCategories)) {
        setSelectedSubCategories(vp.subCategories);
      }

      if (vp.businessDescription || vp.description) {
        setBusinessDescription(vp.businessDescription || vp.description);
      }

      const logo = vp.shopLogo || uData.profile_pic || uData.avatarUrl || '';
      const cover = vp.shopCoverImage || vp.coverBanner || vp.coverUrl || '';
      setShopLogo(logo);
      setShopCoverImage(cover);

      setMobileNumber(vp.mobileNumber || uData.phone || '');
      setWhatsappNumber(vp.whatsappNumber || vp.whatsapp || uData.phone || '');
      setEmail(vp.email || uData.email || '');
      setWebsite(vp.website || '');

      const addr = typeof vp.address === 'object' && vp.address ? vp.address : {};
      setPincode(addr.pincode || vp.pincode || uData.location?.pincode || '');
      setStateName(addr.state || vp.state || uData.location?.state || 'Madhya Pradesh');
      setDistrict(addr.district || vp.district || uData.location?.district || 'Indore');
      setCity(addr.city || vp.city || uData.location?.city || 'Indore');
      setAreaLocality(addr.areaLocality || addr.area || vp.area || '');
      setFullAddress(addr.fullAddress || addr.address || vp.businessAddress || uData.location?.address || '');
      setGoogleMapLocation(addr.googleMapLocation || '');

      if (vp.deliveryService) {
        const ds = vp.deliveryService;
        if (ds.homeDelivery) {
          setHomeDeliveryEnabled(ds.homeDelivery.enabled ?? true);
          if (ds.homeDelivery.freeRadius) setHomeDeliveryRadius(ds.homeDelivery.freeRadius);
          if (ds.homeDelivery.minOrderPrice !== undefined) setHomeDeliveryMinOrder(String(ds.homeDelivery.minOrderPrice));
          if (ds.homeDelivery.deliveryCharge !== undefined) setHomeDeliveryCharge(String(ds.homeDelivery.deliveryCharge));
        }
        if (ds.courierByVendor !== undefined) setCourierByVendor(ds.courierByVendor);
        if (ds.customerVisitShop !== undefined) setCustomerVisitShop(ds.customerVisitShop);
        if (ds.serviceAtCustomerLocation) {
          setServiceAtCustomerLocation(ds.serviceAtCustomerLocation.enabled ?? false);
          if (ds.serviceAtCustomerLocation.serviceRadius) setServiceRadius(ds.serviceAtCustomerLocation.serviceRadius);
          if (ds.serviceAtCustomerLocation.minOrderPrice !== undefined) setServiceMinOrder(String(ds.serviceAtCustomerLocation.minOrderPrice));
        }
      }

      if (vp.businessTiming) {
        const bt = vp.businessTiming;
        if (bt.openingTime) setOpeningTime(bt.openingTime);
        if (bt.closingTime) setClosingTime(bt.closingTime);
        if (bt.weeklyOff) setWeeklyOff(bt.weeklyOff);
        if (bt.open24x7 !== undefined) setOpen24x7(bt.open24x7);
      }
    } catch (err) {
      console.log('Error populating vendor profile details:', err);
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAndHydrateProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAndHydrateProfile();
  };

  // Image Picker & Upload for Shop Logo & Cover Image
  const handlePickAndUploadImage = async (type: 'logo' | 'cover') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library access permission is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (type === 'logo') setUploadingLogo(true);
        else setUploadingCover(true);

        const formData = new FormData();
        const filename = uri.split('/').pop() || `${type}_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', { uri, name: filename, type: fileType } as any);

        try {
          const res = await api.post('/v1/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }).catch(() => api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }));

          const uploadedUrl = res.data?.url || res.data?.data?.url || res.data?.imageUrl;
          if (uploadedUrl) {
            if (type === 'logo') setShopLogo(uploadedUrl);
            else setShopCoverImage(uploadedUrl);
            Alert.alert('Success', `${type === 'logo' ? 'Shop Logo' : 'Cover Banner'} uploaded!`);
          } else {
            if (type === 'logo') setShopLogo(uri);
            else setShopCoverImage(uri);
          }
        } catch (uploadErr) {
          console.log('Image upload network fallback:', uploadErr);
          if (type === 'logo') setShopLogo(uri);
          else setShopCoverImage(uri);
        } finally {
          if (type === 'logo') setUploadingLogo(false);
          else setUploadingCover(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pick image.');
      setUploadingLogo(false);
      setUploadingCover(false);
    }
  };

  // Pincode Auto Lookup
  const handlePincodeLookup = async (code: string) => {
    if (!code || code.length !== 6) return;
    setPincodeLoading(true);
    try {
      const { data } = await api
        .post('/v1/location/pincode-lookup', { pincode: code })
        .catch(() => api.post('/location/pincode-lookup', { pincode: code }));

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
      Alert.alert('Error', 'Could not detect location. Please enter address manually.');
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
      const { data } = await api
        .post('/v1/ai/generate-description', {
          prompt: promptText,
          type: 'business_profile',
          category: selectedCategories[0] || 'General',
          context: { shopName: sName, businessType, vendorType, city, state: stateName },
        })
        .catch(() =>
          api.post('/ai/generate-description', {
            prompt: promptText,
            type: 'business_profile',
            category: selectedCategories[0] || 'General',
            context: { shopName: sName, businessType, vendorType, city, state: stateName },
          })
        );

      const res = data?.data || data;
      const desc = res?.detailedDescription || res?.description || res?.shortDescription;
      if (desc) {
        setBusinessDescription(desc);
        Alert.alert('✨ AI Generated Bio', 'Business description generated successfully!');
      } else {
        Alert.alert('Notice', 'AI could not generate bio. Please type description manually.');
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

  const toggleWeeklyOffDay = (day: string) => {
    let days = weeklyOff === 'None' ? [] : weeklyOff.split(', ').filter(Boolean);
    if (days.includes(day)) {
      days = days.filter((d) => d !== day);
    } else {
      days.push(day);
    }
    setWeeklyOff(days.length > 0 ? days.join(', ') : 'None');
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
        Alert.alert('Validation Error', 'Please select at least one Business Category.');
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

  // Final Save & Update Action
  const handleSubmitOnboarding = async () => {
    if (!termsAccepted) {
      Alert.alert('Declaration Required', 'Please accept the Vendor Declaration & Terms to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const vendorProfileData = {
        ...(user?.vendorProfile || {}),
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
        coverBanner: shopCoverImage,
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
        whatsapp: whatsappNumber.trim() || mobileNumber.trim(),
        email: email.trim(),
        website: website.trim(),
        address: {
          pincode,
          state: stateName,
          district: district || city,
          city,
          areaLocality: areaLocality.trim(),
          fullAddress: fullAddress.trim(),
          address: fullAddress.trim(),
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

      // 1. Update Profile via PUT /v1/vendors/me/profile
      await api
        .put('/v1/vendors/me/profile', vendorProfileData)
        .catch(() => api.patch('/v1/users/me', { vendorProfile: vendorProfileData }))
        .catch(() => api.post('/auth/add-role', { role: 'vendor', profileData: vendorProfileData }));

      // 2. Refetch profile to synchronize local Auth State
      const { data: updatedProfile } = await refetchProfile();
      if (updatedProfile) setUser(updatedProfile);

      Alert.alert(
        '🎉 Profile Updated!',
        'Your vendor business profile details and images have been saved successfully!',
        [
          {
            text: 'Go to Vendor Dashboard',
            onPress: () => router.replace('/vendor/dashboard' as any),
          },
        ]
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Could not save vendor profile changes.';
      Alert.alert('Save Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const logoUri = resolveImageUrl(shopLogo);
  const coverUri = resolveImageUrl(shopCoverImage);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back())}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ONBOARDING DETAILS ({currentStep}/6)</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={fetchAndHydrateProfile}>
          <Ionicons name="refresh-outline" size={18} color={YELLOW} />
        </TouchableOpacity>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${(currentStep / 6) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={YELLOW} />
        }>
        {/* ── STEP 1: BUSINESS TYPE & OFFERING ── */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>1. BUSINESS TYPE & MODEL</Text>
            <Text style={styles.stepSub}>Select the model that best describes your store operations.</Text>

            <Text style={styles.fieldLabel}>VENDOR TYPE (PRODUCT / SERVICE / BOTH) *</Text>
            <View style={styles.pillRow}>
              {[
                { id: 'product', label: '🛍️ Product Vendor' },
                { id: 'service', label: '🛠️ Service Provider' },
                { id: 'both', label: '⚡ Product & Service' },
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

            <Text style={styles.fieldLabel}>BUSINESS TYPE / CATEGORY *</Text>
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

        {/* ── STEP 2: SHOP DETAILS, IMAGES & CATEGORIES ── */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>2. SHOP & BUSINESS INFORMATION</Text>
            <Text style={styles.stepSub}>Your storefront branding, logo, cover banner, and categories.</Text>

            <Text style={styles.fieldLabel}>SHOP / BUSINESS NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Trends Boutique Store"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={shopName}
              onChangeText={setShopName}
            />

            <Text style={styles.fieldLabel}>DISPLAY NAME (PUBLIC STORE TITLE)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Trends Retail Store"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={displayName}
              onChangeText={setDisplayName}
            />

            {/* Shop Logo & Cover Upload */}
            <Text style={styles.fieldLabel}>STORE LOGO & COVER BANNER IMAGES</Text>
            <View style={styles.imagesRow}>
              {/* Logo Card */}
              <View style={styles.imageUploadCard}>
                <Text style={styles.imageCardLabel}>SHOP LOGO</Text>
                <View style={styles.logoPreviewBox}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoImg} />
                  ) : (
                    <Ionicons name="camera-outline" size={24} color="rgba(255,255,255,0.4)" />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handlePickAndUploadImage('logo')}
                  disabled={uploadingLogo}>
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color={BLACK} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={14} color={BLACK} />
                      <Text style={styles.uploadBtnText}>Upload Logo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Cover Banner Card */}
              <View style={styles.imageUploadCard}>
                <Text style={styles.imageCardLabel}>COVER BANNER</Text>
                <View style={styles.coverPreviewBox}>
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.coverImg} />
                  ) : (
                    <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.4)" />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handlePickAndUploadImage('cover')}
                  disabled={uploadingCover}>
                  {uploadingCover ? (
                    <ActivityIndicator size="small" color={BLACK} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={14} color={BLACK} />
                      <Text style={styles.uploadBtnText}>Upload Cover</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Selectors */}
            <Text style={styles.fieldLabel}>PRIMARY BUSINESS CATEGORIES *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setCatModalVisible(true)}>
              <Text style={styles.pickerBtnText}>
                {selectedCategories.length > 0
                  ? selectedCategories.join(', ')
                  : 'Select Business Categories...'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={YELLOW} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>SUBCATEGORIES / SPECIALTIES</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setSubModalVisible(true)}>
              <Text style={styles.pickerBtnText}>
                {selectedSubCategories.length > 0
                  ? selectedSubCategories.join(', ')
                  : 'Select Subcategories...'}
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
                placeholder="Key keywords (e.g. 10 yrs experienced salon, warranty...)"
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

            <Text style={styles.fieldLabel}>BUSINESS DESCRIPTION & SPECIALTY</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe your products, warranty, fast delivery, services offered..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              value={businessDescription}
              onChangeText={setBusinessDescription}
            />
          </View>
        )}

        {/* ── STEP 3: CONTACT INFORMATION ── */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>3. CONTACT CHANNELS & INQUIRIES</Text>
            <Text style={styles.stepSub}>Direct phone, WhatsApp, email, and website link.</Text>

            <Text style={styles.fieldLabel}>CALLING MOBILE NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="Primary 10-digit calling number"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <Text style={styles.fieldLabel}>WHATSAPP BUSINESS NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="WhatsApp number for leads & inquiries"
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

            <Text style={styles.fieldLabel}>WEBSITE / ONLINE CATALOG LINK</Text>
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

        {/* ── STEP 4: PHYSICAL ADDRESS & GEOLOCATION ── */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>4. PHYSICAL STORE ADDRESS & GPS</Text>
            <Text style={styles.stepSub}>Pinpoint your shop so nearby customers can navigate to you.</Text>

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

            <Text style={styles.fieldLabel}>CITY / TOWN *</Text>
            <TextInput
              style={styles.input}
              placeholder="City name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.fieldLabel}>DISTRICT</Text>
            <TextInput
              style={styles.input}
              placeholder="District name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={district}
              onChangeText={setDistrict}
            />

            <Text style={styles.fieldLabel}>STATE *</Text>
            <TextInput
              style={styles.input}
              placeholder="State name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={stateName}
              onChangeText={setStateName}
            />

            <Text style={styles.fieldLabel}>AREA / LOCALITY / MARKET NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Sector, Landmark, Market Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={areaLocality}
              onChangeText={setAreaLocality}
            />

            <Text style={styles.fieldLabel}>FULL PHYSICAL ADDRESS *</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Shop No., Floor, Building Name, Street Address, Landmark..."
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
            <Text style={styles.stepTitle}>5. DELIVERY MODES & SERVICE RADIUS</Text>
            <Text style={styles.stepSub}>Configure local delivery, shop walk-in, and service radius.</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Local Home Delivery Available</Text>
              <Switch
                value={homeDeliveryEnabled}
                onValueChange={setHomeDeliveryEnabled}
                trackColor={{ false: BORDER, true: YELLOW }}
                thumbColor={homeDeliveryEnabled ? BLACK : '#fff'}
              />
            </View>

            {homeDeliveryEnabled && (
              <View style={styles.subFieldsBox}>
                <Text style={styles.fieldLabel}>FREE DELIVERY RADIUS</Text>
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

                <Text style={styles.fieldLabel}>DELIVERY CHARGE OUTSIDE RADIUS (₹)</Text>
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

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow In-Store Customer Walk-In / Pickup</Text>
              <Switch
                value={customerVisitShop}
                onValueChange={setCustomerVisitShop}
                trackColor={{ false: BORDER, true: YELLOW }}
                thumbColor={customerVisitShop ? BLACK : '#fff'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Courier / Shipping Nationwide</Text>
              <Switch
                value={courierByVendor}
                onValueChange={setCourierByVendor}
                trackColor={{ false: BORDER, true: YELLOW }}
                thumbColor={courierByVendor ? BLACK : '#fff'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Doorstep / On-Site Service Calls</Text>
              <Switch
                value={serviceAtCustomerLocation}
                onValueChange={setServiceAtCustomerLocation}
                trackColor={{ false: BORDER, true: YELLOW }}
                thumbColor={serviceAtCustomerLocation ? BLACK : '#fff'}
              />
            </View>
          </View>
        )}

        {/* ── STEP 6: BUSINESS HOURS & DECLARATION ── */}
        {currentStep === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>6. BUSINESS HOURS & DECLARATION</Text>
            <Text style={styles.stepSub}>Set operational hours, weekly off days, and accept terms.</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open 24 Hours / 7 Days a Week</Text>
              <Switch
                value={open24x7}
                onValueChange={setOpen24x7}
                trackColor={{ false: BORDER, true: YELLOW }}
                thumbColor={open24x7 ? BLACK : '#fff'}
              />
            </View>

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

                <Text style={styles.fieldLabel}>WEEKLY OFF DAYS (SELECT ALL THAT APPLY)</Text>
                <View style={styles.pillRow}>
                  {WEEKLY_OFF_DAYS.map((day) => {
                    const isOff = weeklyOff !== 'None' && weeklyOff.split(', ').includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayPill, isOff && styles.dayPillActive]}
                        onPress={() => toggleWeeklyOffDay(day)}>
                        <Text style={[styles.dayPillText, isOff && styles.dayPillTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.declarationBox}
              onPress={() => setTermsAccepted(!termsAccepted)}>
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={22}
                color={YELLOW}
              />
              <Text style={styles.declarationText}>
                I hereby declare that all business details, addresses, and contact numbers provided are true, valid, and authentic.
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
                <Ionicons name="save-outline" size={18} color={BLACK} />
                <Text style={styles.submitBtnText}>SAVE & UPDATE PROFILE</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Selection Modal */}
      <Modal visible={catModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT BUSINESS CATEGORIES</Text>
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
              keyExtractor={(item: any) => item._id || item.id || item.name}
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

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setCatModalVisible(false)}>
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
              data={subCategoriesList.filter((c: any) =>
                (c.name || '').toLowerCase().includes(subSearch.toLowerCase())
              )}
              keyExtractor={(item: any) => item._id || item.id || item.name}
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

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setSubModalVisible(false)}>
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

  stepTabsScroll: { backgroundColor: DARK_CARD, paddingVertical: 6, paddingHorizontal: 12 },
  stepTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: BLACK,
    marginRight: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepTabChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  stepTabText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800' },
  stepTabTextActive: { color: BLACK, fontWeight: '900' },

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
    borderRadius: 8,
  },

  imagesRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  imageUploadCard: {
    flex: 1,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  imageCardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  logoPreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoImg: { width: '100%', height: '100%' },
  coverPreviewBox: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  coverImg: { width: '100%', height: '100%' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  uploadBtnText: { color: BLACK, fontSize: 10, fontWeight: '900' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillBtn: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
    borderRadius: 10,
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
    borderRadius: 8,
  },
  pickerBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },

  aiBox: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 12,
    marginVertical: 8,
    borderRadius: 10,
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
    borderRadius: 6,
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  aiGenerateBtnText: { color: BLACK, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  gpsBtnText: { color: BLACK, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  rowInputWrapper: { flexDirection: 'row', gap: 8 },
  lookupBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  lookupBtnText: { color: BLACK, fontSize: 11, fontWeight: '900' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK_CARD,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginVertical: 4,
  },
  switchLabel: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },

  subFieldsBox: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  dayPill: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
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
    borderRadius: 10,
    marginTop: 12,
  },
  declarationText: { color: '#fff', fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 16 },

  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK_CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    gap: 6,
  },
  prevBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    height: 44,
    borderRadius: 10,
    gap: 6,
  },
  nextBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: YELLOW,
    height: 44,
    borderRadius: 10,
    gap: 6,
  },
  submitBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    maxHeight: '80%',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: YELLOW, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  modalSearch: {
    backgroundColor: BLACK,
    color: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: 8,
  },
  catModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  catModalRowActive: { backgroundColor: 'rgba(245,158,11,0.1)' },
  catModalRowText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalDoneBtn: { backgroundColor: YELLOW, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderRadius: 8 },
  modalDoneBtnText: { color: BLACK, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
