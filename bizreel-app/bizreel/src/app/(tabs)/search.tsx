/**
 * Search Screen — Modern e-commerce & location-based discovery search.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useDeferredValue, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAddToCart } from '@/features/cart/queries';
import { useCategories, useListings } from '@/features/search/queries';
import type { Category, Listing } from '@/features/search/types';

const POPULAR_SEARCHES = [
  'Solar Energy',
  'Office Furniture',
  'Digital Marketing',
  'Beauty & Salon',
  'Modular Kitchen',
  'Electronics',
];

const POPULAR_CITIES = [
  'All Cities',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Products' },
  { id: 'service', label: 'Services' },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const addToCartMutation = useAddToCart();

  // Defer search input to keep typing butter smooth
  const deferredSearch = useDeferredValue(searchText.trim());
  const isQueryActive =
    deferredSearch.length > 0 || selectedCategory !== null || selectedCity !== 'All Cities';

  const listingsParams = {
    page: 1,
    search: deferredSearch || undefined,
    category: selectedCategory?.name || undefined,
    city: selectedCity !== 'All Cities' ? selectedCity : undefined,
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
    refetch: refetchListings,
    isRefetching: listingsRefetching,
  } = useListings(listingsParams, isQueryActive);

  const rawListings = listingsData?.data ?? [];

  // Filter & Sort results locally (for type and city)
  const filteredListings = rawListings.filter((item: any) => {
    if (activeTypeFilter !== 'all') {
      const itemType = item.category_type || item.type;
      if (itemType !== activeTypeFilter) return false;
    }
    if (selectedCity !== 'All Cities') {
      const itemCity = item.city || item.location?.city || item.vendor?.city || '';
      if (itemCity && !itemCity.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  if (sortBy === 'price_low') {
    filteredListings.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortBy === 'price_high') {
    filteredListings.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  const handleRefresh = useCallback(() => {
    if (isQueryActive) refetchListings();
    else refetchCats();
  }, [isQueryActive, refetchListings, refetchCats]);

  const parentCategories = (categories || []).filter((c) => !c.parent_id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Search Bar Header */}
      <View style={styles.header}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, services & verified sellers..."
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

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          accessibilityLabel="Filter Options">
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Location City Selector Row */}
      <View style={styles.citySelectorRow}>
        <View style={styles.locationTag}>
          <Ionicons name="location" size={14} color={BrandColors.primary} />
          <Text style={styles.locationTagText}>Location:</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesScroll}>
          {POPULAR_CITIES.map((cityName) => {
            const isSelected = selectedCity === cityName;
            return (
              <TouchableOpacity
                key={cityName}
                style={[styles.cityChip, isSelected && styles.cityChipActive]}
                onPress={() => setSelectedCity(cityName)}>
                <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>
                  {cityName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Type Filter Tabs Row */}
      <View style={styles.filterTabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TYPE_FILTERS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, activeTypeFilter === tab.id && styles.filterChipActive]}
              onPress={() => setActiveTypeFilter(tab.id as any)}>
              <Text style={[styles.filterChipText, activeTypeFilter === tab.id && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedCategory && (
            <View style={styles.activeCategoryTag}>
              <Text style={styles.activeCategoryTagText}>{selectedCategory.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)} hitSlop={4}>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isQueryActive ? (
        /* Results View */
        listingsLoading && filteredListings.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={BrandColors.primary} />
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={56} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No Local Results Found</Text>
            <Text style={styles.emptySub}>
              We couldn't find matching items in "{selectedCity}" for "{deferredSearch || selectedCategory?.name}". Try selecting "All Cities" or adjusting search.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={listingsRefetching}
                onRefresh={handleRefresh}
                tintColor={BrandColors.primary}
                colors={[BrandColors.primary]}
              />
            }
            ListHeaderComponent={
              <Text style={styles.resultsCountText}>
                {listingsFetching
                  ? 'Updating results…'
                  : `${filteredListings.length} local items found ${selectedCity !== 'All Cities' ? `in ${selectedCity}` : ''}`}
              </Text>
            }
            renderItem={({ item }) => {
              const image = item.images?.[0];
              const price = item.salePrice || item.price || 0;
              const locationCity =
                (item as any).city ||
                (item as any).location?.city ||
                (item as any).vendor?.city ||
                'Local Vendor';

              return (
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => router.push(`/listing/${item._id}`)}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.resultImage} contentFit="cover" />
                  ) : (
                    <View style={styles.resultImageFallback}>
                      <Ionicons name="basket-outline" size={28} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}

                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <View style={styles.vendorCityRow}>
                      <Text style={styles.resultVendorName} numberOfLines={1}>
                        {item.vendor?.name || 'Verified Vendor'}
                      </Text>
                      <View style={styles.cityBadge}>
                        <Ionicons name="location-outline" size={10} color={BrandColors.primaryLight} />
                        <Text style={styles.cityBadgeText}>{locationCity}</Text>
                      </View>
                    </View>

                    <View style={styles.resultPriceRow}>
                      <Text style={styles.resultPrice}>₹{price}</Text>

                      <TouchableOpacity
                        style={styles.addCartSmallBtn}
                        onPress={() => addToCartMutation.mutate({ listing_id: item._id, quantity: 1 })}>
                        <Ionicons name="add" size={14} color="#fff" />
                        <Text style={styles.addCartSmallText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )
      ) : (
        /* Browse Categories & Popular Searches View */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.browseScroll}
          refreshControl={
            <RefreshControl
              refreshing={catsRefetching}
              onRefresh={handleRefresh}
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }>
          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>Popular Searches</Text>
            <View style={styles.popularRow}>
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.popularChip}
                  onPress={() => setSearchText(term)}>
                  <Ionicons name="flash-outline" size={12} color={BrandColors.primary} />
                  <Text style={styles.popularChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categories Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionHeaderTitle}>Explore Categories</Text>
            {catsLoading ? (
              <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginVertical: 30 }} />
            ) : (
              <View style={styles.categoryGrid}>
                {parentCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryGridCard}
                    onPress={() => setSelectedCategory(cat)}>
                    <View style={styles.categoryIconCircle}>
                      <Text style={styles.categoryEmoji}>
                        {cat.icon_url && cat.icon_url.length <= 4 ? cat.icon_url : '🗂️'}
                      </Text>
                    </View>
                    <Text style={styles.categoryGridTitle} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Location Filters</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'newest' && styles.sortOptionSelected]}
              onPress={() => setSortBy('newest')}>
              <Text style={styles.sortOptionText}>Newest Listings</Text>
              {sortBy === 'newest' && <Ionicons name="checkmark" size={16} color={BrandColors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'price_low' && styles.sortOptionSelected]}
              onPress={() => setSortBy('price_low')}>
              <Text style={styles.sortOptionText}>Price: Low to High</Text>
              {sortBy === 'price_low' && <Ionicons name="checkmark" size={16} color={BrandColors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, sortBy === 'price_high' && styles.sortOptionSelected]}
              onPress={() => setSortBy('price_high')}>
              <Text style={styles.sortOptionText}>Price: High to Low</Text>
              {sortBy === 'price_high' && <Ionicons name="checkmark" size={16} color={BrandColors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.sm,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    gap: Spacing.two,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.four,
  },
  locationTagText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  citiesScroll: {
    paddingRight: Spacing.four,
    gap: Spacing.two,
  },
  cityChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  cityChipActive: {
    backgroundColor: 'rgba(217, 154, 61, 0.2)',
    borderColor: BrandColors.primary,
  },
  cityChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  cityChipTextActive: {
    color: BrandColors.primaryLight,
    fontWeight: FontWeight.bold,
  },
  filterTabsRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  tabsScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: FontWeight.bold,
  },
  activeCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  activeCategoryTagText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsList: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  resultsCountText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.two,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  resultImage: {
    width: 100,
    height: 100,
  },
  resultImageFallback: {
    width: 100,
    height: 100,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  resultTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  vendorCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultVendorName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    flex: 1,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cityBadgeText: {
    color: BrandColors.primaryLight,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  resultPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPrice: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  addCartSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  addCartSmallText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  browseScroll: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeaderTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  popularRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.one,
  },
  popularChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  categoryGridCard: {
    width: '30%',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryGridTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  filterSectionTitle: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    padding: Spacing.three,
    borderRadius: 8,
  },
  sortOptionSelected: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    borderWidth: 1,
    borderColor: BrandColors.primary,
  },
  sortOptionText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  applyFilterBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  applyFilterBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
