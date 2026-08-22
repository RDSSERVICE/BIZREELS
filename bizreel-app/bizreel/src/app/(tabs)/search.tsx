/**
 * Search Screen
 *
 * States:
 *  1. Browse   — no query, no category selected → shows /categories grid
 *  2. Results  — user typed in search bar OR tapped a category → shows /listings
 *
 * Interactions:
 *  - Type in search bar → fires listings query with `search` param
 *  - Tap a category pill → fires listings query with `category` param
 *  - Active category pill shown above results; tap X to clear it (back to browse)
 *  - Clear the search bar → back to browse if no category selected
 *  - Pull to refresh on both views
 */

import { Image } from 'expo-image';
import { useCallback, useDeferredValue, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    BrandColors,
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Spacing,
} from '@/constants/theme';
import { useCategories, useListings } from '@/features/search/queries';
import type { Category, Listing } from '@/features/search/types';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(listing: Listing): string {
  const price = listing.salePrice && listing.salePrice > 0
    ? listing.salePrice
    : listing.price;
  if (!price) return 'Price on request';
  return `₹${price.toLocaleString('en-IN')}`;
}

function getParentCategories(categories: Category[]): Category[] {
  return categories
    .filter((c) => c.parent_id === null && c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Maps parent category id → its children
function buildCategoryMap(categories: Category[]): Record<string, Category[]> {
  const map: Record<string, Category[]> = {};
  for (const cat of categories) {
    if (cat.parent_id) {
      if (!map[cat.parent_id]) map[cat.parent_id] = [];
      map[cat.parent_id].push(cat);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchBar({
  value,
  onChangeText,
  onClear,
  theme,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onClear: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <View style={[searchBarStyles.wrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={[searchBarStyles.icon, { color: theme.textSecondary }]}>🔍</Text>
      <TextInput
        style={[searchBarStyles.input, { color: theme.text }]}
        placeholder="Search listings, shops, services…"
        placeholderTextColor={theme.placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear search">
          <Text style={[searchBarStyles.clear, { color: theme.textSecondary }]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

function ActiveCategoryChip({
  name,
  onClear,
  theme,
}: {
  name: string;
  onClear: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <View style={chipStyles.row}>
      <View style={chipStyles.chip}>
        <Text style={chipStyles.label}>{name}</Text>
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear category filter">
          <Text style={chipStyles.close}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CategoryCard({
  category,
  onPress,
  theme,
}: {
  category: Category;
  onPress: () => void;
  theme: typeof Colors.light;
}) {
  const isEmoji = category.icon_url && category.icon_url.length <= 4;
  const isUrl = category.icon_url && category.icon_url.startsWith('http');

  return (
    <Pressable
      style={({ pressed }) => [
        catStyles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={category.name}>
      <View style={catStyles.iconWrapper}>
        {isUrl ? (
          <Image source={{ uri: category.icon_url! }} style={catStyles.iconImage} contentFit="cover" />
        ) : (
          <Text style={catStyles.iconEmoji}>{isEmoji ? category.icon_url : '🗂️'}</Text>
        )}
      </View>
      <Text style={[catStyles.name, { color: theme.text }]} numberOfLines={2}>
        {category.name}
      </Text>
      <View style={[catStyles.typePill, { backgroundColor: category.category_type === 'service' ? 'rgba(200,134,10,0.12)' : 'rgba(34,197,94,0.12)' }]}>
        <Text style={[catStyles.typeLabel, { color: category.category_type === 'service' ? BrandColors.primary : BrandColors.success }]}>
          {category.category_type}
        </Text>
      </View>
    </Pressable>
  );
}

function ListingCard({
  listing,
  theme,
}: {
  listing: Listing;
  theme: typeof Colors.light;
}) {
  const imageUrl = listing.images?.[0];
  const initials = listing.vendor?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={[listingStyles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {/* Image */}
      <View style={listingStyles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={listingStyles.image} contentFit="cover" />
        ) : (
          <View style={[listingStyles.imageFallback, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={{ fontSize: FontSize.xl }}>🛍️</Text>
          </View>
        )}
        {listing.isBoosted && (
          <View style={listingStyles.boostedBadge}>
            <Text style={listingStyles.boostedText}>Ad</Text>
          </View>
        )}
        {listing.discount > 0 && (
          <View style={listingStyles.discountBadge}>
            <Text style={listingStyles.discountText}>{listing.discount}% off</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={listingStyles.info}>
        <Text style={[listingStyles.title, { color: theme.text }]} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={[listingStyles.price, { color: BrandColors.primary }]}>
          {formatPrice(listing)}
        </Text>

        {/* Category + type */}
        <View style={listingStyles.metaRow}>
          <Text style={[listingStyles.metaText, { color: theme.textSecondary }]}>
            {listing.category}{listing.subcategory ? ` › ${listing.subcategory}` : ''}
          </Text>
        </View>

        {/* Rating + city */}
        <View style={listingStyles.bottomRow}>
          {listing.rating > 0 && (
            <Text style={[listingStyles.rating, { color: theme.textSecondary }]}>
              ⭐ {listing.rating.toFixed(1)} ({listing.totalReviews})
            </Text>
          )}
          {listing.city ? (
            <Text style={[listingStyles.city, { color: theme.textSecondary }]} numberOfLines={1}>
              📍 {listing.city}
            </Text>
          ) : null}
        </View>

        {/* Vendor */}
        <View style={listingStyles.vendorRow}>
          {listing.vendor?.avatarUrl ? (
            <Image source={{ uri: listing.vendor.avatarUrl }} style={listingStyles.vendorAvatar} contentFit="cover" />
          ) : (
            <View style={[listingStyles.vendorAvatar, listingStyles.vendorAvatarFallback]}>
              <Text style={listingStyles.vendorInitial}>{initials}</Text>
            </View>
          )}
          <Text style={[listingStyles.vendorName, { color: theme.textSecondary }]} numberOfLines={1}>
            {listing.vendor?.name ?? 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyResults({ query, theme }: { query: string; theme: typeof Colors.light }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.emoji}>🔍</Text>
      <Text style={[emptyStyles.title, { color: theme.text }]}>No results found</Text>
      <Text style={[emptyStyles.sub, { color: theme.textSecondary }]}>
        No listings matched "{query}". Try a different search or browse by category.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Defer search text so the FlatList doesn't re-render on every keystroke
  const deferredSearch = useDeferredValue(searchText.trim());

  // A query is "active" when user has typed something OR selected a category
  const isQueryActive = deferredSearch.length > 0 || selectedCategory !== null;

  const listingsParams = {
    page: 1,
    search: deferredSearch || undefined,
    category: selectedCategory?.name || undefined,
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

  const listings = listingsData?.data ?? [];
  const total = listingsData?.meta.total ?? 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSearchChange(text: string) {
    setSearchText(text);
    // Typing clears category filter so results reflect search intent
    if (text.length > 0) setSelectedCategory(null);
  }

  function handleClearSearch() {
    setSearchText('');
  }

  function handleSelectCategory(cat: Category) {
    setSelectedCategory(cat);
    setSearchText('');
  }

  function handleClearCategory() {
    setSelectedCategory(null);
  }

  const handleRefresh = useCallback(() => {
    if (isQueryActive) refetchListings();
    else refetchCats();
  }, [isQueryActive, refetchListings, refetchCats]);

  // ── Render: categories browse ─────────────────────────────────────────────

  const parentCategories = categories ? getParentCategories(categories) : [];
  const childMap = categories ? buildCategoryMap(categories) : {};

  const renderBrowse = () => {
    if (catsLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.browseContent}
        refreshControl={
          <RefreshControl
            refreshing={catsRefetching}
            onRefresh={handleRefresh}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Browse by category
        </Text>

        {parentCategories.map((parent) => {
          const children = childMap[parent.id] ?? [];
          return (
            <View key={parent.id} style={styles.categoryGroup}>
              {/* Parent header — tapping selects parent as category filter */}
              <Pressable
                style={({ pressed }) => [styles.parentHeader, pressed && { opacity: 0.75 }]}
                onPress={() => handleSelectCategory(parent)}>
                <Text style={styles.parentIcon}>
                  {parent.icon_url && parent.icon_url.length <= 4 ? parent.icon_url : '🗂️'}
                </Text>
                <Text style={[styles.parentName, { color: theme.text }]}>{parent.name}</Text>
                <Text style={[styles.parentChevron, { color: theme.textSecondary }]}>›</Text>
              </Pressable>

              {/* Children chips */}
              {children.length > 0 && (
                <View style={styles.childrenRow}>
                  {children.map((child) => (
                    <Pressable
                      key={child.id}
                      style={({ pressed }) => [
                        styles.childChip,
                        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSelectCategory(child)}>
                      <Text style={[styles.childChipText, { color: theme.text }]}>
                        {child.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // ── Render: listings results ──────────────────────────────────────────────

  const renderResults = () => {
    const queryLabel = selectedCategory?.name ?? deferredSearch;

    if (listingsLoading && listings.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      );
    }

    if (!listingsLoading && listings.length === 0) {
      return <EmptyResults query={queryLabel} theme={theme} />;
    }

    return (
      <FlatList
        data={listings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ListingCard listing={item} theme={theme} />}
        contentContainerStyle={styles.resultsContent}
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
          <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
            {listingsFetching && listings.length > 0
              ? 'Updating…'
              : `${total} result${total !== 1 ? 's' : ''}`}
          </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
      />
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <SearchBar
          value={searchText}
          onChangeText={handleSearchChange}
          onClear={handleClearSearch}
          theme={theme}
        />

        {/* Active category chip */}
        {selectedCategory && (
          <ActiveCategoryChip
            name={selectedCategory.name}
            onClear={handleClearCategory}
            theme={theme}
          />
        )}
      </View>

      {/* Body */}
      {isQueryActive ? renderResults() : renderBrowse()}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Browse
  browseContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.eight,
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.two,
  },
  categoryGroup: {
    marginBottom: Spacing.three,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  parentIcon: { fontSize: 22 },
  parentName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  parentChevron: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  childrenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingLeft: 32,
  },
  childChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  childChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  // Results
  resultsContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.eight,
  },
  resultsCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.three,
  },
});

const searchBarStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  icon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: 0,
  },
  clear: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  label: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  close: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});

const catStyles = StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(200,134,10,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: { width: 52, height: 52 },
  iconEmoji: { fontSize: 28 },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  typePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
});

const listingStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: 110,
    position: 'relative',
  },
  image: {
    width: 110,
    height: '100%',
  },
  imageFallback: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boostedText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: BrandColors.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  info: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: FontSize.xs },
  bottomRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  rating: { fontSize: FontSize.xs },
  city: { fontSize: FontSize.xs, flex: 1 },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  vendorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  vendorAvatarFallback: {
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorInitial: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
  vendorName: { fontSize: FontSize.xs, flex: 1 },
});

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  sub: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22 },
});
