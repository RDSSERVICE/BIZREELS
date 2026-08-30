/**
 * Search Screen — Web-Style Multi-Tier Discovery & Filter Engine.
 * Features distance radius (5, 10, 15, 25, 50, 100km, Anywhere), price ranges (₹1 to ₹2 Cr),
 * product/service type toggles, sorting, and GPS location detection.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
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
import { useAddToCart } from '@/features/cart/queries';
import { useCreateRequirement } from '@/features/requirements/queries';
import { useCategories, useListings } from '@/features/search/queries';
import type { Category } from '@/features/search/types';
import { getListingImage } from '@/utils/image';

const POPULAR_SEARCHES = [
  'Solar Energy',
  'Office Furniture',
  'Digital Marketing',
  'Beauty & Salon',
  'Modular Kitchen',
  'Electronics',
];

const POPULAR_CITIES = [
  'Near Me (GPS)',
  'All Cities',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
];

const DISTANCE_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'Anywhere (Global)', value: 0 },
];

const PRICE_PRESETS = [
  { label: 'All Prices', min: undefined, max: undefined },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 - ₹10,000', min: 2000, max: 10000 },
  { label: '₹10,000 - ₹50,000', min: 10000, max: 50000 },
  { label: '₹50,000 - ₹1 Lakh', min: 50000, max: 100000 },
  { label: '₹1 Lakh - ₹10 Lakh', min: 100000, max: 1000000 },
  { label: '₹10 Lakh - ₹50 Lakh', min: 1000000, max: 5000000 },
  { label: '₹50 Lakh - ₹2 Cr', min: 5000000, max: 20000000 },
];

const PRICE_SLIDER_STEPS = [
  { label: '₹0', val: 0 },
  { label: '₹500', val: 500 },
  { label: '₹2K', val: 2000 },
  { label: '₹10K', val: 10000 },
  { label: '₹50K', val: 50000 },
  { label: '₹1L', val: 100000 },
  { label: '₹10L', val: 1000000 },
  { label: '₹50L', val: 5000000 },
  { label: '₹2Cr+', val: 20000000 },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'product', label: 'Products Only' },
  { id: 'service', label: 'Services Only' },
];

const SORT_OPTIONS = [
  { id: 'latest', label: 'Newest First' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'nearest', label: 'Nearest First' },
];

function renderCategoryIcon(catName: string, iconUrl?: string) {
  if (iconUrl && iconUrl.length <= 4 && !iconUrl.startsWith('http')) {
    return <Text style={styles.categoryEmoji}>{iconUrl}</Text>;
  }

  const name = (catName || '').toLowerCase().trim();
  let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';

  if (name.includes('home') || name.includes('living') || name.includes('furniture')) {
    iconName = 'home-outline';
  } else if (name.includes('electronic') || name.includes('tech') || name.includes('mobile')) {
    iconName = 'hardware-chip-outline';
  } else if (name.includes('fashion') || name.includes('apparel') || name.includes('cloth')) {
    iconName = 'shirt-outline';
  } else if (name.includes('vehicle') || name.includes('auto') || name.includes('car')) {
    iconName = 'car-outline';
  } else if (name.includes('beauty') || name.includes('salon') || name.includes('spa')) {
    iconName = 'sparkles-outline';
  } else if (name.includes('digital') || name.includes('service') || name.includes('marketing')) {
    iconName = 'briefcase-outline';
  }

  return <Ionicons name={iconName} size={22} color={YELLOW} />;
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const u = (user as any) || {};
  const activeRole = u.activeRole || u.current_role || u.role || 'customer';
  const isVendor = activeRole === 'vendor';
  const isCustomer = activeRole === 'customer';

  // Core Search States
  const [searchText, setSearchText] = useState(params.q || '');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('All Cities');

  useEffect(() => {
    if (isVendor) {
      router.replace('/(tabs)/home');
    }
  }, [isVendor]);

  useEffect(() => {
    if (params.q) {
      setSearchText(params.q);
    }
  }, [params.q]);

  // Filter States
  const [selectedRadius, setSelectedRadius] = useState<number>(10); // 5, 10, 15, 25, 50, 100, 0
  const [selectedPricePreset, setSelectedPricePreset] = useState<number | null>(null);
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'nearest'>('latest');

  // Modal Visibility
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [postReqModalVisible, setPostReqModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // GPS Location State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
  } | null>(null);

  const addToCartMutation = useAddToCart();
  const createReqMutation = useCreateRequirement();

  // Defer search input for smooth typing
  const deferredSearch = useDeferredValue((searchText || '').trim());
  const isQueryActive =
    deferredSearch.length > 0 ||
    selectedCategory !== null ||
    selectedCity !== 'All Cities' ||
    userLocation !== null ||
    selectedPricePreset !== null ||
    minPriceInput !== '' ||
    maxPriceInput !== '' ||
    activeTypeFilter !== 'all' ||
    selectedRadius !== 10;

  // Request GPS Location & Detect City
  async function handleDetectCurrentLocation() {
    try {
      setIsDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'Please enable location permissions in app settings to find nearby sellers.'
        );
        setIsDetectingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      let detectedCityName = 'Near Me';

      try {
        const reverseGeo = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (reverseGeo && reverseGeo.length > 0) {
          detectedCityName =
            reverseGeo[0].city || reverseGeo[0].subregion || reverseGeo[0].region || 'Near Me';
        }
      } catch (e) {
        // Geocode fallback
      }

      setUserLocation({
        lat: latitude,
        lng: longitude,
        city: detectedCityName,
      });
      setSelectedCity('Near Me (GPS)');
    } catch (err: any) {
      Alert.alert('Location Error', 'Could not retrieve your current location.');
    } finally {
      setIsDetectingLocation(false);
    }
  }

  function handleCitySelect(cityName: string) {
    if (cityName === 'Near Me (GPS)') {
      if (!userLocation) {
        handleDetectCurrentLocation();
      } else {
        setSelectedCity('Near Me (GPS)');
      }
    } else {
      setSelectedCity(cityName);
      if (cityName === 'All Cities') {
        setUserLocation(null);
      }
    }
  }

  const isGpsActive = selectedCity === 'Near Me (GPS)' && userLocation !== null;

  // Price calculations from preset or custom inputs
  const computedMinPrice =
    selectedPricePreset !== null && PRICE_PRESETS[selectedPricePreset].min !== undefined
      ? PRICE_PRESETS[selectedPricePreset].min
      : minPriceInput
      ? parseFloat(minPriceInput)
      : undefined;

  const computedMaxPrice =
    selectedPricePreset !== null && PRICE_PRESETS[selectedPricePreset].max !== undefined
      ? PRICE_PRESETS[selectedPricePreset].max
      : maxPriceInput
      ? parseFloat(maxPriceInput)
      : undefined;

  const listingsParams = {
    page: 1,
    search: deferredSearch || undefined,
    category: selectedCategory?.name || undefined,
    type: activeTypeFilter !== 'all' ? activeTypeFilter : undefined,
    minPrice: computedMinPrice,
    maxPrice: computedMaxPrice,
    city: !isGpsActive && selectedCity !== 'All Cities' ? selectedCity : undefined,
    lat: isGpsActive ? userLocation?.lat : undefined,
    lng: isGpsActive ? userLocation?.lng : undefined,
    distance: selectedRadius > 0 ? selectedRadius : undefined,
    sort: sortBy,
  };

  const {
    data: categories,
    isLoading: catsLoading,
    refetch: refetchCats,
    isRefetching: catsRefetching,
  } = useCategories();

  const {
    data: listingsData,
    isLoading: listingsLoading,
    isFetching: listingsFetching,
    isRefetching: listingsRefetching,
    refetch: refetchListings,
  } = useListings(listingsParams, isQueryActive);

  const rawListings = Array.isArray(listingsData)
    ? listingsData
    : (listingsData as any)?.data || (listingsData as any)?.listings || [];

  // Filter & Sort results locally fallback
  const filteredListings = rawListings.filter((item: any) => {
    if (activeTypeFilter !== 'all') {
      const itemType = item.category_type || item.type;
      if (itemType !== activeTypeFilter) return false;
    }
    if (computedMinPrice !== undefined && (item.price || 0) < computedMinPrice) return false;
    if (computedMaxPrice !== undefined && (item.price || 0) > computedMaxPrice) return false;
    return true;
  });

  if (sortBy === 'price_low') {
    filteredListings.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price_high') {
    filteredListings.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
  }

  const resetAllFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    setSelectedCity('All Cities');
    setUserLocation(null);
    setSelectedRadius(10);
    setSelectedPricePreset(null);
    setMinPriceInput('');
    setMaxPriceInput('');
    setActiveTypeFilter('all');
    setSortBy('latest');
    setFilterModalVisible(false);
  };

  const handleRefresh = useCallback(() => {
    if (isQueryActive) refetchListings();
    else refetchCats();
  }, [isQueryActive, refetchListings, refetchCats]);

  const catList = Array.isArray(categories) ? categories : (categories as any)?.data || [];
  const parentCategories = catList.filter((c: any) => !c.parent_id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Search Bar Header */}
      <View style={styles.header}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, services, suppliers..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
              if (t) setSelectedCategory(null);
            }}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        {isCustomer && (
          <TouchableOpacity
            style={styles.postReqBtn}
            onPress={() => router.push('/post-requirement' as any)}
            accessibilityLabel="Post Requirement">
            <Ionicons name="add-circle" size={15} color={BLACK} />
            <Text style={styles.postReqBtnText}>Post Requirement</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          accessibilityLabel="Filter Options">
          <Ionicons name="options-outline" size={20} color={BLACK} />
        </TouchableOpacity>
      </View>

      {/* Location City Selector Row */}
      <View style={styles.citySelectorRow}>
        <TouchableOpacity
          style={[styles.gpsDetectBtn, isGpsActive && styles.gpsDetectBtnActive]}
          onPress={handleDetectCurrentLocation}
          disabled={isDetectingLocation}>
          {isDetectingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.gpsDetectBtnText}>
                {userLocation ? userLocation.city || 'Near Me' : 'Locate Me'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesScroll}>
          {POPULAR_CITIES.map((cityName) => {
            const isSelected = selectedCity === cityName;
            return (
              <TouchableOpacity
                key={cityName}
                style={[styles.cityChip, isSelected && styles.cityChipActive]}
                onPress={() => handleCitySelect(cityName)}>
                <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>
                  {cityName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Web-Style Quick Filter Bar (Distance, Price Range, Type, Sort) */}
      <View style={styles.webFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.webFilterScroll}>
          {/* Category Dropdown Filter Pill */}
          <TouchableOpacity
            style={[styles.webFilterPill, selectedCategory !== null && styles.webFilterPillActive]}
            onPress={() => {
              setCategorySearchQuery('');
              setCategoryModalVisible(true);
            }}>
            <Ionicons name="grid" size={12} color={selectedCategory !== null ? BLACK : YELLOW} />
            <Text style={[styles.webFilterPillText, selectedCategory !== null && styles.webFilterPillTextActive]}>
              Category: {selectedCategory ? selectedCategory.name : 'All'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={selectedCategory !== null ? BLACK : 'rgba(255,255,255,0.6)'} />
          </TouchableOpacity>

          {/* Distance Filter Quick Pill */}
          <TouchableOpacity
            style={[styles.webFilterPill, selectedRadius !== 10 && styles.webFilterPillActive]}
            onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="location" size={12} color={selectedRadius !== 10 ? BLACK : YELLOW} />
            <Text style={[styles.webFilterPillText, selectedRadius !== 10 && styles.webFilterPillTextActive]}>
              Distance: {selectedRadius === 0 ? 'Anywhere' : `${selectedRadius}km`}
            </Text>
            <Ionicons name="chevron-down" size={12} color={selectedRadius !== 10 ? BLACK : 'rgba(255,255,255,0.6)'} />
          </TouchableOpacity>

          {/* Price Range Filter Quick Pill */}
          <TouchableOpacity
            style={[
              styles.webFilterPill,
              (selectedPricePreset !== null || !!minPriceInput || !!maxPriceInput) && styles.webFilterPillActive,
            ]}
            onPress={() => setFilterModalVisible(true)}>
            <Ionicons
              name="cash-outline"
              size={12}
              color={selectedPricePreset !== null || !!minPriceInput ? BLACK : YELLOW}
            />
            <Text
              style={[
                styles.webFilterPillText,
                (selectedPricePreset !== null || !!minPriceInput || !!maxPriceInput) && styles.webFilterPillTextActive,
              ]}>
              Price:{' '}
              {selectedPricePreset !== null
                ? PRICE_PRESETS[selectedPricePreset].label
                : minPriceInput || maxPriceInput
                ? `₹${minPriceInput || 0} - ₹${maxPriceInput || '2Cr+'}`
                : '₹1 to ₹2Cr'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={selectedPricePreset !== null || !!minPriceInput ? BLACK : 'rgba(255,255,255,0.6)'}
            />
          </TouchableOpacity>

          {/* Type Filter Quick Pill */}
          <TouchableOpacity
            style={[styles.webFilterPill, activeTypeFilter !== 'all' && styles.webFilterPillActive]}
            onPress={() =>
              setActiveTypeFilter(activeTypeFilter === 'all' ? 'product' : activeTypeFilter === 'product' ? 'service' : 'all')
            }>
            <Ionicons name="cube" size={12} color={activeTypeFilter !== 'all' ? BLACK : YELLOW} />
            <Text style={[styles.webFilterPillText, activeTypeFilter !== 'all' && styles.webFilterPillTextActive]}>
              Type: {activeTypeFilter.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {/* Sort Filter Quick Pill */}
          <TouchableOpacity
            style={[styles.webFilterPill, sortBy !== 'latest' && styles.webFilterPillActive]}
            onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="swap-vertical" size={12} color={sortBy !== 'latest' ? BLACK : YELLOW} />
            <Text style={[styles.webFilterPillText, sortBy !== 'latest' && styles.webFilterPillTextActive]}>
              Sort: {SORT_OPTIONS.find((s) => s.id === sortBy)?.label || 'Latest'}
            </Text>
          </TouchableOpacity>

          {/* Active Category Chip */}
          {selectedCategory && (
            <View style={styles.activeCategoryTag}>
              <Text style={styles.activeCategoryTagText}>{selectedCategory.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)} hitSlop={4}>
                <Ionicons name="close" size={12} color={BLACK} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isQueryActive ? (
        /* Results View */
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.resultsList}
          refreshControl={
            <RefreshControl refreshing={listingsRefetching} onRefresh={handleRefresh} tintColor={YELLOW} />
          }
          ListHeaderComponent={
            <Text style={styles.resultsCountText}>
              FOUND {filteredListings.length} RESULTS{' '}
              {selectedRadius > 0 && isGpsActive ? `WITHIN ${selectedRadius}KM` : 'NATIONWIDE'}
            </Text>
          }
          ListEmptyComponent={
            listingsLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={YELLOW} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.4)" />
                <Text style={styles.emptyTitle}>No matching results</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your distance radius, price range, or category filter.
                </Text>
                <TouchableOpacity style={styles.resetFilterBtn} onPress={resetAllFilters}>
                  <Text style={styles.resetFilterBtnText}>RESET ALL FILTERS</Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => {
            const mainImg = getListingImage(item);
            const vendorName = item.vendor?.name || 'Verified Supplier';
            const cityText = item.city || item.location?.city || 'Local';

            return (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/listing/${item._id}`)}>
                {mainImg ? (
                  <Image source={{ uri: mainImg }} style={styles.resultImage} contentFit="cover" />
                ) : (
                  <View style={styles.resultImageFallback}>
                    <Ionicons name="bag" size={24} color="rgba(255,255,255,0.4)" />
                  </View>
                )}

                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <View style={styles.vendorCityRow}>
                    <Text style={styles.resultVendorName} numberOfLines={1}>
                      {vendorName}
                    </Text>
                    <View style={styles.cityBadge}>
                      <Ionicons name="location" size={10} color={YELLOW} />
                      <Text style={styles.cityBadgeText}>{cityText}</Text>
                    </View>
                  </View>

                  <View style={styles.resultPriceRow}>
                    <Text style={styles.resultPrice}>₹{item.salePrice || item.price}</Text>

                    <TouchableOpacity
                      style={styles.addCartSmallBtn}
                      onPress={() => {
                        addToCartMutation.mutate({ listing_id: item._id, quantity: 1 });
                        Alert.alert('Added', `"${item.title}" added to cart!`);
                      }}>
                      <Ionicons name="cart" size={12} color={BLACK} />
                      <Text style={styles.addCartSmallText}>Add +</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        /* Default Browse Categories View */
        <ScrollView
          contentContainerStyle={styles.browseScroll}
          refreshControl={
            <RefreshControl refreshing={catsRefetching} onRefresh={handleRefresh} tintColor={YELLOW} />
          }>
          {/* Popular Search Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>POPULAR SEARCHES</Text>
            <View style={styles.popularRow}>
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.popularChip}
                  onPress={() => setSearchText(term)}>
                  <Ionicons name="trending-up" size={12} color={YELLOW} />
                  <Text style={styles.popularChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Dropdown Selection Box */}
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>SELECT CATEGORY DROPDOWN</Text>
            <TouchableOpacity
              style={styles.categoryDropdownCard}
              onPress={() => {
                setCategorySearchQuery('');
                setCategoryModalVisible(true);
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={styles.categoryDropdownIconCircle}>
                  <Ionicons name="grid" size={20} color={YELLOW} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.categoryDropdownLabel}>Category Filter</Text>
                  <Text style={styles.categoryDropdownValue} numberOfLines={1}>
                    {selectedCategory ? selectedCategory.name : 'All Categories (Browse All System Items)'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={YELLOW} />
            </TouchableOpacity>

            {selectedCategory && (
              <TouchableOpacity style={styles.clearCategoryBtn} onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.clearCategoryText}>Clear Category Filter ({selectedCategory.name})</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* WEB-STYLE COMPREHENSIVE FILTER DRAWER MODAL */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTER & SORT SEARCH</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: Spacing.four, paddingVertical: Spacing.two }}>
                {/* 1. DISTANCE RADIUS OPTIONS */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterSectionTitle}>📍 DISTANCE RADIUS</Text>
                  <View style={styles.chipsWrap}>
                    {DISTANCE_OPTIONS.map((opt) => {
                      const isSelected = selectedRadius === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => setSelectedRadius(opt.value)}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. PRICE RANGE PRESETS (₹1 to ₹2 Cr) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterSectionTitle}>💰 PRICE RANGE (₹1 TO ₹2 CR)</Text>
                  <View style={styles.chipsWrap}>
                    {PRICE_PRESETS.map((preset, idx) => {
                      const isSelected = selectedPricePreset === idx;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedPricePreset(null);
                            } else {
                              setSelectedPricePreset(idx);
                              setMinPriceInput('');
                              setMaxPriceInput('');
                            }
                          }}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Price Range Input */}
                  <Text style={[styles.filterSubLabel, { marginTop: 8 }]}>Custom Min & Max Price (₹)</Text>
                  <View style={styles.priceInputRow}>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Min ₹ (e.g. 1000)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={minPriceInput}
                      onChangeText={(v) => {
                        setMinPriceInput(v);
                        setSelectedPricePreset(null);
                      }}
                    />
                    <Text style={{ color: YELLOW, fontWeight: '900' }}>—</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Max ₹ (e.g. 20000000)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      value={maxPriceInput}
                      onChangeText={(v) => {
                        setMaxPriceInput(v);
                        setSelectedPricePreset(null);
                      }}
                    />
                  </View>

                  {/* ── Interactive Price Range Sliding Bar ── */}
                  <View style={styles.priceSliderBox}>
                    <View style={styles.sliderHeaderRow}>
                      <Text style={styles.sliderTitle}>MAX BUDGET SLIDE BAR</Text>
                      <Text style={styles.sliderValueText}>
                        {!maxPriceInput || Number(maxPriceInput) === 0
                          ? 'Any Budget'
                          : `Max ₹${Number(maxPriceInput).toLocaleString('en-IN')}`}
                      </Text>
                    </View>

                    <View style={styles.trackBackground}>
                      <View
                        style={[
                          styles.trackFill,
                          {
                            width: `${
                              (PRICE_SLIDER_STEPS.findIndex(
                                (s) => s.val >= Number(maxPriceInput || 0)
                              ) === -1
                                ? PRICE_SLIDER_STEPS.length - 1
                                : Math.max(
                                    0,
                                    PRICE_SLIDER_STEPS.findIndex(
                                      (s) => s.val >= Number(maxPriceInput || 0)
                                    )
                                  )) /
                              (PRICE_SLIDER_STEPS.length - 1) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.stepButtonsRow}>
                      {PRICE_SLIDER_STEPS.map((step) => {
                        const currentVal = Number(maxPriceInput || 0);
                        const isSelected = step.val === currentVal;
                        const isPassed = currentVal >= step.val && step.val > 0;
                        return (
                          <TouchableOpacity
                            key={step.val}
                            style={[
                              styles.stepDotBtn,
                              isSelected && styles.stepDotBtnActive,
                            ]}
                            onPress={() => {
                              setMaxPriceInput(step.val === 0 ? '' : String(step.val));
                              setSelectedPricePreset(null);
                            }}>
                            <View
                              style={[
                                styles.stepDotInner,
                                isPassed && { backgroundColor: YELLOW },
                                isSelected && { backgroundColor: '#fff' },
                              ]}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.stepLabelsRow}>
                      <Text style={styles.stepLabelText}>₹0</Text>
                      <Text style={styles.stepLabelText}>₹50K</Text>
                      <Text style={styles.stepLabelText}>₹2Cr+</Text>
                    </View>
                  </View>
                </View>

                {/* 3. PRODUCT / SERVICE TYPE */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterSectionTitle}>⚡ LISTING TYPE</Text>
                  <View style={styles.chipsWrap}>
                    {TYPE_FILTERS.map((tab) => {
                      const isSelected = activeTypeFilter === tab.id;
                      return (
                        <TouchableOpacity
                          key={tab.id}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => setActiveTypeFilter(tab.id as any)}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 4. SORT ORDER */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterSectionTitle}>🔃 SORT RESULTS BY</Text>
                  <View style={{ gap: 6 }}>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.sortOption, isSelected && styles.sortOptionSelected]}
                          onPress={() => setSortBy(opt.id as any)}>
                          <Text style={[styles.sortOptionText, isSelected && { color: BLACK }]}>
                            {opt.label}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={16} color={BLACK} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Filter Action Buttons */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity style={styles.resetModalBtn} onPress={resetAllFilters}>
                <Text style={styles.resetModalBtnText}>RESET ALL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyModalBtn}
                onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.applyModalBtnText}>APPLY FILTERS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CATEGORY SELECTION DROPDOWN MODAL */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalVisible(false)} />
          <View style={[styles.modalContent, { maxHeight: 520 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="grid" size={18} color={YELLOW} />
                <Text style={styles.modalTitle}>SELECT CATEGORY DROPDOWN</Text>
              </View>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Modal Search Bar */}
            <View style={{ paddingHorizontal: Spacing.four, paddingTop: Spacing.two }}>
              <View style={styles.modalSearchRow}>
                <Ionicons name="search" size={16} color={YELLOW} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Filter categories (e.g. Solar, IT, Beauty)..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                />
                {!!categorySearchQuery && (
                  <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: Spacing.four, marginTop: 10 }}>
              {/* Option 1: All Categories (Show All) */}
              <TouchableOpacity
                style={[styles.categoryDropdownItem, selectedCategory === null && styles.categoryDropdownItemActive]}
                onPress={() => {
                  setSelectedCategory(null);
                  setCategoryModalVisible(false);
                }}>
                <Ionicons name="apps-outline" size={18} color={selectedCategory === null ? BLACK : YELLOW} />
                <Text style={[styles.categoryDropdownItemText, selectedCategory === null && styles.categoryDropdownItemTextActive]}>
                  All Categories (Browse All Products & Services)
                </Text>
                {selectedCategory === null && <Ionicons name="checkmark-circle" size={18} color={BLACK} />}
              </TouchableOpacity>

              {/* Category List */}
              {parentCategories
                .filter((c: any) =>
                  !categorySearchQuery.trim() ||
                  c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                )
                .map((cat: any) => {
                  const isSelected = selectedCategory?.id === cat.id || selectedCategory?._id === cat._id || selectedCategory?.name === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id || cat._id || cat.name}
                      style={[styles.categoryDropdownItem, isSelected && styles.categoryDropdownItemActive]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setCategoryModalVisible(false);
                      }}>
                      <View style={styles.catDropdownIconWrap}>
                        {renderCategoryIcon(cat.name, cat.icon_url)}
                      </View>
                      <Text style={[styles.categoryDropdownItemText, isSelected && styles.categoryDropdownItemTextActive]}>
                        {cat.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color={BLACK} />}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: BLACK,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: FontSize.xs, fontWeight: '600', height: '100%' },
  postReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    height: 42,
  },
  postReqBtnText: { color: BLACK, fontSize: 10, fontWeight: '900' },
  filterBtn: {
    width: 42,
    height: 42,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: BLACK,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    gap: 4,
  },
  gpsDetectBtnActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  gpsDetectBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  citiesScroll: { paddingRight: Spacing.four, gap: 6 },
  cityChip: {
    backgroundColor: DARK_CARD,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cityChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  cityChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  cityChipTextActive: { color: BLACK, fontWeight: '900' },
  webFilterBar: {
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
  },
  webFilterScroll: { paddingHorizontal: Spacing.four, gap: 8, alignItems: 'center' },
  webFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  webFilterPillActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  webFilterPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800' },
  webFilterPillTextActive: { color: BLACK, fontWeight: '900' },
  activeCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  activeCategoryTagText: { color: BLACK, fontSize: 11, fontWeight: '900' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
  resetFilterBtn: { backgroundColor: YELLOW, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  resetFilterBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  resultsList: { padding: Spacing.four, gap: Spacing.three },
  resultsCountText: { color: YELLOW, fontSize: 11, fontWeight: '900', marginBottom: 4 },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  resultImage: { width: 100, height: 100 },
  resultImageFallback: {
    width: 100,
    height: 100,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1, padding: Spacing.three, justifyContent: 'space-between' },
  resultTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  vendorCityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultVendorName: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, flex: 1 },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  cityBadgeText: { color: YELLOW, fontSize: 10, fontWeight: '900' },
  resultPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultPrice: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  addCartSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    gap: 2,
  },
  addCartSmallText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  browseScroll: { padding: Spacing.four, gap: Spacing.four },
  section: { gap: Spacing.three },
  sectionHeaderTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  popularChipText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.xs, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  categoryGridCard: {
    width: '31%',
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 20 },
  categoryGridTitle: { color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: Spacing.two,
  },
  modalTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900', letterSpacing: 1 },
  closeBtn: {
    width: 28,
    height: 28,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGroup: { gap: 8 },
  filterSectionTitle: { color: YELLOW, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  filterSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetChip: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  presetChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  presetChipTextActive: { color: BLACK, fontWeight: '900' },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: {
    flex: 1,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
    paddingHorizontal: 10,
    height: 38,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BLACK,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sortOptionSelected: { backgroundColor: YELLOW, borderColor: YELLOW },
  sortOptionText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  filterModalFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  resetModalBtn: {
    flex: 1,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  applyModalBtn: {
    flex: 2,
    backgroundColor: YELLOW,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyModalBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },

  categoryDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    marginTop: 6,
  },
  categoryDropdownIconCircle: {
    width: 38,
    height: 38,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDropdownLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryDropdownValue: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
    marginTop: 2,
  },
  clearCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearCategoryText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryDropdownItemActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  catDropdownIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDropdownItemText: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  categoryDropdownItemTextActive: {
    color: BLACK,
    fontWeight: '900',
  },

  // Price Slider Bar Styles
  priceSliderBox: {
    backgroundColor: BLACK,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginTop: 10,
    gap: 10,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sliderValueText: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  trackBackground: {
    height: 6,
    backgroundColor: '#1c1c1e',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: YELLOW,
    borderRadius: 3,
  },
  stepButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: -13,
  },
  stepDotBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotBtnActive: {
    backgroundColor: YELLOW,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3C',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stepLabelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
  },
});
