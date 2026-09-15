/**
 * Vendor Onboarding & Business Setup Screen — Mobile Application
 * Redesigned to match the rest of the application's Warm Matte Light Color Theme.
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

import { BrandColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCurrentUserProfile } from '@/features/auth/queries';
import { useCategories } from '@/features/search/queries';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

// Light Theme Design Tokens
const PRIMARY = '#F59E0B';
const PRIMARY_DARK = '#D97706';
const PRIMARY_LIGHT_BG = '#FFFBEB';
const BG_LIGHT = '#F6F4EE';
const CARD_BG = '#FFFFFF';
const CARD_BG_ALT = '#FBF9F5';
const INPUT_BG = '#F0EDE4';
const BORDER = '#E5E0D4';
const TEXT_DARK = '#1E1B18';
const TEXT_MUTED = '#6E675F';
const TEXT_PLACEHOLDER = '#8C857B';

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

  // Dynamically filter subcategories strictly belonging to selected parent categories
  const availableSubCategories = React.useMemo(() => {
    if (selectedCategories.length === 0) return [];

    const parentObjs = parentCategories.filter((pc: any) =>
      selectedCategories.some((sc) => (sc || '').toLowerCase() === (pc.name || '').toLowerCase())
    );
    const parentIds = new Set(parentObjs.map((pc: any) => String(pc.id || pc._id)));
    const parentNames = new Set(parentObjs.map((pc: any) => (pc.name || '').toLowerCase()));

    return subCategoriesList.filter((sub: any) => {
      const pId = String(sub.parent_id || sub.parent || '');
      const pName = (sub.parent_name || sub.parentCategory || '').toLowerCase();
      return parentIds.has(pId) || parentNames.has(pName);
    });
  }, [selectedCategories, parentCategories, subCategoriesList]);

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

      if (Array.isArray(vp.subCategories) && vp.subCategories.length > 0) {
        setSelectedSubCategories(vp.subCategories);
      }

      const desc = vp.businessDescription || vp.description || '';
      setBusinessDescription(desc);

      if (vp.shopLogo || vp.logo) setShopLogo(vp.shopLogo || vp.logo);
      if (vp.shopCoverImage || vp.coverBanner || vp.coverImage) {
        setShopCoverImage(vp.shopCoverImage || vp.coverBanner || vp.coverImage);
      }

      setMobileNumber(vp.mobileNumber || uData.phone || '');
      setWhatsappNumber(vp.whatsappNumber || vp.whatsapp || uData.phone || '');
      setEmail(vp.email || uData.email || '');
      setWebsite(vp.website || '');

      const addrObj = vp.address || {};
      setPincode(addrObj.pincode || vp.pincode || '');
      setStateName(addrObj.state || vp.state || 'Madhya Pradesh');
      setDistrict(addrObj.district || vp.district || 'Indore');
      setCity(addrObj.city || vp.city || 'Indore');
      setAreaLocality(addrObj.areaLocality || addrObj.locality || '');
      setFullAddress(addrObj.fullAddress || addrObj.address || vp.businessAddress || '');
      setGoogleMapLocation(addrObj.googleMapLocation || '');

      const del = vp.deliveryService || {};
      if (del.homeDelivery) {
        setHomeDeliveryEnabled(Boolean(del.homeDelivery.enabled ?? true));
        if (del.homeDelivery.freeRadius) setHomeDeliveryRadius(String(del.homeDelivery.freeRadius));
        if (del.homeDelivery.minOrderPrice) setHomeDeliveryMinOrder(String(del.homeDelivery.minOrderPrice));
        if (del.homeDelivery.deliveryCharge) setHomeDeliveryCharge(String(del.homeDelivery.deliveryCharge));
      }
      if (typeof del.courierByVendor === 'boolean') setCourierByVendor(del.courierByVendor);
      if (typeof del.customerVisitShop === 'boolean') setCustomerVisitShop(del.customerVisitShop);
      if (del.serviceAtCustomerLocation) {
        setServiceAtCustomerLocation(Boolean(del.serviceAtCustomerLocation.enabled));
        if (del.serviceAtCustomerLocation.serviceRadius) {
          setServiceRadius(String(del.serviceAtCustomerLocation.serviceRadius));
        }
        if (del.serviceAtCustomerLocation.minOrderPrice) {
          setServiceMinOrder(String(del.serviceAtCustomerLocation.minOrderPrice));
        }
      }

      const timing = vp.businessTiming || {};
      if (timing.openingTime) setOpeningTime(timing.openingTime);
      if (timing.closingTime) setClosingTime(timing.closingTime);
      if (timing.weeklyOff) setWeeklyOff(timing.weeklyOff);
      if (typeof timing.open24x7 === 'boolean') setOpen24x7(timing.open24x7);
    } catch (err) {
      console.warn('Could not hydrate vendor profile:', err);
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

  // Image Picker & Upload Handler
  const handlePickAndUploadImage = async (type: 'logo' | 'cover') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to upload shop images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const localAsset = result.assets[0];
      if (type === 'logo') setUploadingLogo(true);
      else setUploadingCover(true);

      const formData = new FormData();
      formData.append('file', {
        uri: localAsset.uri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`,
      } as any);
      formData.append('folder', 'bizreels/vendors');

      const response = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).catch(() =>
        api.post('/v1/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );

      const uploadedUrl =
        response.data?.data?.url || response.data?.url || response.data?.secure_url || response.data?.data?.path;

      if (uploadedUrl) {
        if (type === 'logo') setShopLogo(uploadedUrl);
        else setShopCoverImage(uploadedUrl);
        Alert.alert('Upload Success', `Shop ${type === 'logo' ? 'logo' : 'cover banner'} updated!`);
      } else {
        if (type === 'logo') setShopLogo(localAsset.uri);
        else setShopCoverImage(localAsset.uri);
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      Alert.alert('Notice', 'Direct cloud upload failed. Applied image preview locally.');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  // Pincode Lookup Auto-fetch
  const handlePincodeLookup = async (pinStr?: string) => {
    const targetCode = (pinStr || pincode || '').trim();
    if (!targetCode || targetCode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await api
        .post('/v1/location/pincode-lookup', { pincode: targetCode })
        .catch(() => api.get(`/v1/location/pincode/${targetCode}`))
        .catch(() => api.get(`/location/pincode/${targetCode}`));

      const data = res?.data?.data || res?.data;
      if (data) {
        if (data.city || data.district) setCity(data.city || data.district);
        if (data.district || data.city) setDistrict(data.district || data.city);
        if (data.state) setStateName(data.state);
        if (data.area && !areaLocality) setAreaLocality(data.area);
        Alert.alert('📍 Location Found', `Auto-fetched: ${data.city || data.district || data.area}, ${data.state}`);
      } else {
        Alert.alert('Notice', 'No location data found for this PIN code. Please enter address details manually.');
      }
    } catch (err) {
      console.warn('Pincode lookup error:', err);
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

  // Simple AI Bio Generator
  const handleGenerateAiBio = async () => {
    const sName = shopName.trim() || displayName.trim() || 'Our Store';
    const catsStr = selectedCategories.length > 0 ? selectedCategories.join(', ') : 'Quality Products & Services';
    const subCatsStr = selectedSubCategories.length > 0 ? ` (${selectedSubCategories.join(', ')})` : '';
    const promptText = aiPrompt.trim() || `${sName} specializing in ${catsStr}${subCatsStr}`;

    setGeneratingAiBio(true);
    let generatedDesc = '';
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
      generatedDesc = res?.detailedDescription || res?.description || res?.shortDescription || '';
    } catch (err) {
      console.log('API AI generation skipped/fallback used');
    } finally {
      setGeneratingAiBio(false);
    }

    if (!generatedDesc) {
      generatedDesc = `Welcome to ${sName}! We are a premier ${businessType} serving ${city || 'our local community'}, offering top-rated ${catsStr}${subCatsStr}. We take pride in delivering excellent quality, fair prices, and exceptional customer satisfaction.${aiPrompt ? `\n\nSpecial Highlights: ${aiPrompt.trim()}` : ''}\n\nVisit us or contact our team today for the best deals!`;
    }

    setBusinessDescription(generatedDesc);
    Alert.alert('✨ Bio Generated', 'Business description generated successfully!');
  };


  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      const nextCats = selectedCategories.filter((c) => c !== catName);
      setSelectedCategories(nextCats);

      // Auto-remove subcategories of the removed category
      const removedParent = parentCategories.find((c: any) => c.name === catName);
      const removedId = String(removedParent?.id || removedParent?._id || '');
      const subsToRemove = subCategoriesList
        .filter(
          (sub: any) =>
            String(sub.parent_id || sub.parent) === removedId ||
            (sub.parent_name || '').toLowerCase() === catName.toLowerCase()
        )
        .map((sub: any) => sub.name);

      setSelectedSubCategories((prev) => prev.filter((s) => !subsToRemove.includes(s)));
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
        Alert.alert('Business Model Required', 'Please select your Business Type (e.g. Retailer, Service Provider) to proceed.');
        return;
      }
    } else if (currentStep === 2) {
      if (!shopName.trim()) {
        Alert.alert('Shop Name Required', 'Please enter your Shop or Business Name to set up your store identity.');
        return;
      }
      if (selectedCategories.length === 0) {
        Alert.alert('Business Category Required', 'Please select at least one primary business category.');
        return;
      }
    } else if (currentStep === 3) {
      if (!mobileNumber.trim()) {
        Alert.alert('Contact Number Required', 'Please enter a valid primary calling number for customer inquiries.');
        return;
      }
    } else if (currentStep === 4) {
      if (!pincode || pincode.length !== 6) {
        Alert.alert('PIN Code Required', 'Please enter a valid 6-digit Indian PIN code to locate your store.');
        return;
      }
      if (!city.trim()) {
        Alert.alert('City Required', 'Please enter your store\'s city or town name.');
        return;
      }
      if (!stateName.trim()) {
        Alert.alert('State Required', 'Please specify your state name.');
        return;
      }
      if (!fullAddress.trim()) {
        Alert.alert('Store Address Required', 'Please enter your complete physical shop address so nearby customers can find you.');
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
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ONBOARDING DETAILS ({currentStep}/6)</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={fetchAndHydrateProfile}>
          <Ionicons name="refresh-outline" size={20} color={PRIMARY} />
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} />
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
                      <Text style={[styles.bTypeDesc, isSelected && styles.bTypeDescActive]}>{bt.desc}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={PRIMARY_DARK} />}
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
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={shopName}
              onChangeText={setShopName}
            />

            <Text style={styles.fieldLabel}>DISPLAY NAME (PUBLIC STORE TITLE)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Trends Retail Store"
              placeholderTextColor={TEXT_PLACEHOLDER}
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
                    <Ionicons name="camera-outline" size={24} color={TEXT_MUTED} />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handlePickAndUploadImage('logo')}
                  disabled={uploadingLogo}>
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
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
                    <Ionicons name="image-outline" size={24} color={TEXT_MUTED} />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={() => handlePickAndUploadImage('cover')}
                  disabled={uploadingCover}>
                  {uploadingCover ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
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
              <Ionicons name="chevron-down" size={18} color={PRIMARY} />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>SUBCATEGORIES / SPECIALTIES</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setSubModalVisible(true)}>
              <Text style={styles.pickerBtnText}>
                {selectedSubCategories.length > 0
                  ? selectedSubCategories.join(', ')
                  : 'Select Subcategories...'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={PRIMARY} />
            </TouchableOpacity>

            {/* Simple AI Bio Generator */}
            <View style={styles.aiBox}>
              <View style={styles.aiBoxHeader}>
                <Ionicons name="sparkles" size={16} color={PRIMARY_DARK} />
                <Text style={styles.aiBoxTitle}>AI BIO GENERATOR</Text>
              </View>
              <Text style={styles.aiBoxSub}>
                Instantly create a professional business description based on your shop name and selected categories.
              </Text>
              <TextInput
                style={styles.aiInput}
                placeholder="Optional keywords (e.g. 10 yrs experience, fast delivery...)"
                placeholderTextColor={TEXT_PLACEHOLDER}
                value={aiPrompt}
                onChangeText={setAiPrompt}
              />
              <TouchableOpacity
                style={styles.aiGenerateBtn}
                onPress={handleGenerateAiBio}
                disabled={generatingAiBio}>
                {generatingAiBio ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.aiGenerateBtnText}>GENERATE BIO WITH AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>BUSINESS DESCRIPTION & SPECIALTY</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Describe your products, warranty, fast delivery, services offered..."
              placeholderTextColor={TEXT_PLACEHOLDER}
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
              placeholderTextColor={TEXT_PLACEHOLDER}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <Text style={styles.fieldLabel}>WHATSAPP BUSINESS NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="WhatsApp number for leads & inquiries"
              placeholderTextColor={TEXT_PLACEHOLDER}
              keyboardType="phone-pad"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
            />

            <Text style={styles.fieldLabel}>BUSINESS EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="store@example.com"
              placeholderTextColor={TEXT_PLACEHOLDER}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.fieldLabel}>WEBSITE / ONLINE CATALOG LINK</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.yourstore.com"
              placeholderTextColor={TEXT_PLACEHOLDER}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.gpsBtnText}>AUTO-DETECT GPS LOCATION</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>6-DIGIT PIN CODE *</Text>
            <View style={styles.rowInputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. 452001"
                placeholderTextColor={TEXT_PLACEHOLDER}
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.lookupBtnText}>LOOKUP</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>CITY / TOWN *</Text>
            <TextInput
              style={styles.input}
              placeholder="City name"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.fieldLabel}>DISTRICT</Text>
            <TextInput
              style={styles.input}
              placeholder="District name"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={district}
              onChangeText={setDistrict}
            />

            <Text style={styles.fieldLabel}>STATE *</Text>
            <TextInput
              style={styles.input}
              placeholder="State name"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={stateName}
              onChangeText={setStateName}
            />

            <Text style={styles.fieldLabel}>AREA / LOCALITY / MARKET NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Sector, Landmark, Market Name"
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={areaLocality}
              onChangeText={setAreaLocality}
            />

            <Text style={styles.fieldLabel}>FULL PHYSICAL ADDRESS *</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Shop No., Floor, Building Name, Street Address, Landmark..."
              placeholderTextColor={TEXT_PLACEHOLDER}
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
                trackColor={{ false: '#CBD5E1', true: PRIMARY }}
                thumbColor={homeDeliveryEnabled ? '#FFFFFF' : '#F8FAFC'}
              />
            </View>

            {homeDeliveryEnabled && (
              <View style={styles.subFieldsBox}>
                <Text style={styles.fieldLabel}>FREE DELIVERY RADIUS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5 km"
                  placeholderTextColor={TEXT_PLACEHOLDER}
                  value={homeDeliveryRadius}
                  onChangeText={setHomeDeliveryRadius}
                />

                <Text style={styles.fieldLabel}>MINIMUM ORDER PRICE (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="200"
                  placeholderTextColor={TEXT_PLACEHOLDER}
                  keyboardType="number-pad"
                  value={homeDeliveryMinOrder}
                  onChangeText={setHomeDeliveryMinOrder}
                />

                <Text style={styles.fieldLabel}>DELIVERY CHARGE OUTSIDE RADIUS (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={TEXT_PLACEHOLDER}
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
                trackColor={{ false: '#CBD5E1', true: PRIMARY }}
                thumbColor={customerVisitShop ? '#FFFFFF' : '#F8FAFC'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Courier / Shipping Nationwide</Text>
              <Switch
                value={courierByVendor}
                onValueChange={setCourierByVendor}
                trackColor={{ false: '#CBD5E1', true: PRIMARY }}
                thumbColor={courierByVendor ? '#FFFFFF' : '#F8FAFC'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Doorstep / On-Site Service Calls</Text>
              <Switch
                value={serviceAtCustomerLocation}
                onValueChange={setServiceAtCustomerLocation}
                trackColor={{ false: '#CBD5E1', true: PRIMARY }}
                thumbColor={serviceAtCustomerLocation ? '#FFFFFF' : '#F8FAFC'}
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
                trackColor={{ false: '#CBD5E1', true: PRIMARY }}
                thumbColor={open24x7 ? '#FFFFFF' : '#F8FAFC'}
              />
            </View>

            {!open24x7 && (
              <View style={styles.subFieldsBox}>
                <Text style={styles.fieldLabel}>OPENING TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00 AM"
                  placeholderTextColor={TEXT_PLACEHOLDER}
                  value={openingTime}
                  onChangeText={setOpeningTime}
                />

                <Text style={styles.fieldLabel}>CLOSING TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00 PM"
                  placeholderTextColor={TEXT_PLACEHOLDER}
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
                color={PRIMARY_DARK}
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
            <Ionicons name="arrow-back" size={16} color={TEXT_DARK} />
            <Text style={styles.prevBtnText}>PREVIOUS</Text>
          </TouchableOpacity>
        )}

        {currentStep < 6 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>NEXT STEP</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmitOnboarding}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
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
                <Ionicons name="close" size={22} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search categories..."
              placeholderTextColor={TEXT_PLACEHOLDER}
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
                      color={isSelected ? PRIMARY_DARK : TEXT_MUTED}
                    />
                    <Text style={[styles.catModalRowText, isSelected && styles.catModalRowTextActive]}>
                      {item.name}
                    </Text>
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
                <Ionicons name="close" size={22} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search subcategories..."
              placeholderTextColor={TEXT_PLACEHOLDER}
              value={subSearch}
              onChangeText={setSubSearch}
            />

            <FlatList
              data={availableSubCategories.filter((c: any) =>
                (c.name || '').toLowerCase().includes(subSearch.toLowerCase())
              )}
              keyExtractor={(item: any) => item._id || item.id || item.name}
              ListEmptyComponent={() => (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                    {selectedCategories.length === 0
                      ? '⚠️ Please select a primary business category above first.'
                      : 'No subcategories found for the selected category.'}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => {
                const isSelected = selectedSubCategories.includes(item.name);
                return (
                  <TouchableOpacity
                    style={[styles.catModalRow, isSelected && styles.catModalRowActive]}
                    onPress={() => toggleSubCategory(item.name)}>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? PRIMARY_DARK : TEXT_MUTED}
                    />
                    <Text style={[styles.catModalRowText, isSelected && styles.catModalRowTextActive]}>
                      {item.name}
                    </Text>
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
  container: { flex: 1, backgroundColor: BG_LIGHT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34,
    height: 34,
    backgroundColor: INPUT_BG,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  helpBtn: { padding: 4 },

  progressTrack: { height: 4, backgroundColor: BORDER },
  progressBar: { height: '100%', backgroundColor: PRIMARY },

  scrollContent: { padding: 16, paddingBottom: 40 },
  stepContainer: { gap: 12 },
  stepTitle: { color: PRIMARY_DARK, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  stepSub: { color: TEXT_MUTED, fontSize: 12, marginBottom: 8 },
  fieldLabel: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginTop: 8 },
  input: {
    backgroundColor: CARD_BG,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    borderRadius: Radius.md,
  },

  imagesRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  imageUploadCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  imageCardLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  logoPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  logoImg: { width: '100%', height: '100%' },
  coverPreviewBox: {
    width: '100%',
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: INPUT_BG,
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
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillBtn: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  pillBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillBtnText: { color: TEXT_DARK, fontSize: 12, fontWeight: '700' },
  pillBtnTextActive: { color: '#FFFFFF', fontWeight: '900' },

  bTypeGrid: { gap: 8 },
  bTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: Radius.lg,
  },
  bTypeCardActive: { backgroundColor: PRIMARY_LIGHT_BG, borderColor: PRIMARY },
  bTypeTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: '800' },
  bTypeTitleActive: { color: PRIMARY_DARK, fontWeight: '900' },
  bTypeDesc: { color: TEXT_MUTED, fontSize: 11, marginTop: 2 },
  bTypeDescActive: { color: '#92400E' },

  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  pickerBtnText: { color: TEXT_DARK, fontSize: 12, fontWeight: '700', flex: 1 },

  aiBox: {
    backgroundColor: PRIMARY_LIGHT_BG,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginVertical: 8,
    borderRadius: Radius.lg,
    gap: 8,
  },
  aiBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBoxTitle: { color: PRIMARY_DARK, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  aiBoxSub: { color: TEXT_MUTED, fontSize: 11, lineHeight: 15, marginBottom: 2 },
  aiInput: {
    backgroundColor: CARD_BG,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: Radius.md,
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  aiGenerateBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    marginBottom: 8,
  },
  gpsBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  rowInputWrapper: { flexDirection: 'row', gap: 8 },
  lookupBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  lookupBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
    marginVertical: 4,
  },
  switchLabel: { color: TEXT_DARK, fontSize: 12, fontWeight: '700', flex: 1 },

  subFieldsBox: {
    backgroundColor: CARD_BG_ALT,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: Radius.lg,
    gap: 6,
    marginBottom: 8,
  },
  dayPill: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  dayPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dayPillText: { color: TEXT_DARK, fontSize: 11, fontWeight: '700' },
  dayPillTextActive: { color: '#FFFFFF', fontWeight: '900' },

  declarationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PRIMARY_LIGHT_BG,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: Radius.lg,
    marginTop: 12,
  },
  declarationText: { color: TEXT_DARK, fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 16 },

  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
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
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: Radius.md,
    gap: 6,
  },
  prevBtnText: { color: TEXT_DARK, fontSize: 12, fontWeight: '900' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    height: 44,
    borderRadius: Radius.md,
    gap: 6,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    height: 44,
    borderRadius: Radius.md,
    gap: 6,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: CARD_BG,
    borderTopWidth: 2,
    borderTopColor: PRIMARY,
    maxHeight: '80%',
    padding: 16,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: PRIMARY_DARK, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  modalSearch: {
    backgroundColor: INPUT_BG,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: Radius.md,
  },
  catModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  catModalRowActive: { backgroundColor: '#FEF3C7' },
  catModalRowText: { color: TEXT_DARK, fontSize: 12, fontWeight: '700' },
  catModalRowTextActive: { color: PRIMARY_DARK, fontWeight: '900' },
  modalDoneBtn: { backgroundColor: PRIMARY, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderRadius: Radius.md },
  modalDoneBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
