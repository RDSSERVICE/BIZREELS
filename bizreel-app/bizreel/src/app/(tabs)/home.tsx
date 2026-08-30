import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

import { RoleSwitcher } from '@/components/role-switcher';
import { VendorDrawerModal } from '@/components/vendor-drawer-modal';
import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useAddToCart, useCart } from '@/features/cart/queries';
import { useReelsFeed } from '@/features/reels/queries';
import { useVendorListings } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.four * 2 - Spacing.three) / 2;

const CATEGORIES: Array<{
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { id: '1', name: 'Electronics', icon: 'laptop-outline', color: '#4A90E2' },
  { id: '2', name: 'Fashion', icon: 'shirt-outline', color: '#E91E63' },
  { id: '3', name: 'Home & Living', icon: 'home-outline', color: '#FF9800' },
  { id: '4', name: 'Vehicles', icon: 'car-outline', color: '#9C27B0' },
  { id: '5', name: 'Real Estate', icon: 'business-outline', color: '#009688' },
  { id: '6', name: 'Beauty & Salon', icon: 'sparkles-outline', color: '#EC407A' },
  { id: '7', name: 'Digital Services', icon: 'flash-outline', color: '#00BCD4' },
  { id: '8', name: 'Corporate Gifts', icon: 'gift-outline', color: '#795548' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [listings, setListings] = useState<any[]>([]);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const { data: reelsData } = useReelsFeed();
  const { data: vendorListings = [] } = useVendorListings();

  const isVendor = user?.activeRole === 'vendor' || user?.current_role === 'vendor';
  const reels = reelsData?.pages?.flatMap((p) => p.data || []) || [];
  const cartItemCount = cart?.total_items || 0;

  const fetchMyReels = async () => {
    if (!isVendor) return;
    try {
      const { data } = await api.get('/reels/my-reels');
      const items = data.data || data.items || data.reels || data || [];
      setMyReels(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to load vendor my reels', err);
    }
  };

  const fetchHomeData = async () => {
    try {
      const { data } = await api.get('/listings', { params: { limit: 20 } });
      const items = data.data || data.items || data || [];
      setListings(Array.isArray(items) ? items : []);
      if (isVendor) fetchMyReels();
    } catch (err) {
      console.warn('Failed to load listings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [isVendor]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const currentUserId = (user as any)?._id || (user as any)?.id;
  const sourceListings = isVendor ? vendorListings : listings;
  const filteredListings = sourceListings.filter((item: any) => {
    if (isVendor && currentUserId) {
      const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
      if (itemVendorId && itemVendorId.toString() !== currentUserId.toString()) {
        return false;
      }
    }
    const matchesSearch = searchQuery
      ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? item.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <VendorDrawerModal isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top App Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandGroup}>
            <TouchableOpacity
              style={{ marginRight: 8, padding: 4 }}
              onPress={() => setDrawerOpen(true)}>
              <Ionicons name="menu-outline" size={26} color={YELLOW} />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>BIZ<Text style={styles.brandAccent}>REELS</Text></Text>
          </View>

          <View style={styles.headerRightGroup}>
            <RoleSwitcher />

            <TouchableOpacity
              style={styles.chatIconBtn}
              onPress={() => router.push('/messages' as any)}
              accessibilityLabel="Messages Inbox">
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={YELLOW} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cartIconBtn}
              onPress={() => router.push('/cart')}
              accessibilityLabel="Cart">
              <Ionicons name="cart" size={20} color="#fff" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/search' as any)}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 10,000+ Products, Services & Sellers..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
            }}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                router.push(`/(tabs)/search?q=${encodeURIComponent(searchQuery.trim())}` as any);
              }
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Hero Promotional Card Banner (Customer mode only) */}
        {!isVendor && (
          <View style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <View style={styles.heroTag}>
                <Ionicons name="flame" size={14} color={BrandColors.primary} />
                <Text style={styles.heroTagText}>TRENDING MARKETPLACE</Text>
              </View>
              <Text style={styles.heroTitle}>Discover & Buy Directly from Sellers</Text>
              <Text style={styles.heroSub}>Watch short reels to preview products in action</Text>
              <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(tabs)')}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.heroBtnText}>Watch Reels Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Category Horizontal Selector (Customer mode only) */}
        {!isVendor && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              {selectedCategory && (
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.clearFilterText}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => setSelectedCategory(isSelected ? null : cat.name)}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Redesigned Vendor Store Hub & Catalog Section */}
        {isVendor ? (
          <View style={styles.vendorCatalogContainer}>
            {/* Vendor Store Header Card */}
            <View style={styles.vendorStoreCard}>
              <View style={styles.vendorStoreHeaderRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => router.push('/vendor/profile' as any)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.vendorStoreName}>
                      {(user as any)?.vendorProfile?.storeName || (user as any)?.vendorProfile?.businessName || user?.name || 'My Store'}
                    </Text>
                    <View style={styles.verifiedShieldBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#fff" />
                      <Text style={styles.verifiedShieldText}>VERIFIED</Text>
                    </View>
                  </View>
                  <Text style={styles.vendorStoreSub}>
                    {(user as any)?.vendorProfile?.category || 'Vendor Store Catalog & Live Inventory'} • Tap to Edit Business Profile ›
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addListingBtn}
                  onPress={() => router.push('/vendor/profile' as any)}>
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.addListingBtnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Metrics Row */}
              <View style={styles.storeMetricsRow}>
                <View style={styles.storeMetricChip}>
                  <Text style={styles.storeMetricValue}>{vendorListings.length}</Text>
                  <Text style={styles.storeMetricLabel}>Total Items</Text>
                </View>
                <View style={styles.storeMetricDivider} />
                <View style={styles.storeMetricChip}>
                  <Text style={styles.storeMetricValue}>4.9 ★</Text>
                  <Text style={styles.storeMetricLabel}>Store Rating</Text>
                </View>
                <View style={styles.storeMetricDivider} />
                <View style={styles.storeMetricChip}>
                  <Text style={styles.storeMetricValue}>Active</Text>
                  <Text style={styles.storeMetricLabel}>Status</Text>
                </View>
              </View>
            </View>

            {/* Catalog Grid Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🛍️ Vendor Catalog ({vendorListings.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/vendor/listings' as any)}>
                <Text style={styles.seeAllText}>Manage All Catalog ›</Text>
              </TouchableOpacity>
            </View>

            {vendorListings.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catalogScrollContent}>
                {vendorListings.map((item) => {
                  const imgUri = getListingImage(item) || 'https://via.placeholder.com/300';
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.catalogCard}
                      onPress={() => router.push('/vendor/listings' as any)}>
                      <Image source={{ uri: imgUri }} style={styles.catalogCardImage} contentFit="cover" />
                      
                      {/* Price Badge */}
                      <View style={styles.catalogPriceBadge}>
                        <Text style={styles.catalogPriceText}>₹{item.price}</Text>
                      </View>

                      {/* Category Badge */}
                      <View style={styles.catalogCategoryTag}>
                        <Text style={styles.catalogCategoryText}>
                          {item.type === 'service' ? 'Service' : 'Product'}
                        </Text>
                      </View>

                      <View style={styles.catalogCardDetails}>
                        <Text style={styles.catalogItemTitle} numberOfLines={2}>
                          {item.title}
                        </Text>

                        <View style={styles.catalogCardFooter}>
                          <View style={styles.stockBadge}>
                            <View style={styles.stockDot} />
                            <Text style={styles.stockText}>In Stock</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.editCardBtn}
                            onPress={() => router.push('/vendor/listings' as any)}>
                            <Ionicons name="create-outline" size={14} color={BrandColors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyCatalogCard}>
                <Ionicons name="cube-outline" size={36} color={BrandColors.primary} />
                <Text style={styles.emptyCatalogTitle}>Your Store Catalog is Empty</Text>
                <Text style={styles.emptyCatalogDesc}>
                  Add your first product or service listing to showcase on the marketplace and video reels!
                </Text>
                <TouchableOpacity
                  style={styles.emptyCatalogBtn}
                  onPress={() => router.push('/vendor/listings' as any)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.emptyCatalogBtnText}>+ Add First Product / Service</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Vendor's Own Reels Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎥 My Video Reels ({myReels.length})</Text>
                <TouchableOpacity onPress={() => router.push('/vendor/reels/create' as any)}>
                  <Text style={styles.seeAllText}>+ Create Reel</Text>
                </TouchableOpacity>
              </View>

              {myReels.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reelsHighlightScroll}>
                  {myReels.map((reel) => {
                    const reelThumb = resolveImageUrl(reel.thumbnailUrl || reel.mediaUrls?.[0] || (reel as any).coverImage);
                    return (
                      <TouchableOpacity
                        key={reel._id}
                        style={styles.reelHighlightCard}
                        onPress={() =>
                          router.push({
                            pathname: '/reel/[id]',
                            params: { id: reel._id, videoUrl: reel.videoUrl || reel.mediaUrls?.[0] || '' },
                          } as any)
                        }>
                        {reelThumb ? (
                          <Image
                            source={{ uri: reelThumb }}
                            style={styles.reelThumbnail}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.reelThumbnail, { backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name="film-outline" size={28} color="rgba(255,255,255,0.4)" />
                          </View>
                        )}
                        <View style={styles.reelOverlayGradient} />
                        <View style={styles.reelPlayBadge}>
                          <Ionicons name="play" size={14} color="#fff" />
                        </View>
                        <Text style={styles.reelCaption} numberOfLines={2}>
                          {reel.caption || reel.title || 'My Video Reel'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyCatalogCard}>
                  <Ionicons name="videocam-outline" size={32} color={YELLOW} />
                  <Text style={styles.emptyCatalogTitle}>Promote Products with Short Reels</Text>
                  <Text style={styles.emptyCatalogDesc}>
                    Upload high-converting product videos, demos, and special offers to attract local buyers.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyCatalogBtn}
                    onPress={() => router.push('/vendor/reels/create' as any)}>
                    <Ionicons name="add-circle" size={16} color={BLACK} />
                    <Text style={styles.emptyCatalogBtnText}>+ CREATE FIRST VIDEO REEL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          reels.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Video Reels</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.seeAllText}>View All ›</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reelsHighlightScroll}>
                {reels.slice(0, 6).map((reel) => {
                  const reelThumb = resolveImageUrl(reel.thumbnailUrl || reel.mediaUrls?.[0] || (reel as any).coverImage);
                  return (
                    <TouchableOpacity
                      key={reel._id}
                      style={styles.reelHighlightCard}
                      onPress={() =>
                        router.push({
                          pathname: '/reel/[id]',
                          params: { id: reel._id, videoUrl: reel.videoUrl || reel.mediaUrls?.[0] || '' },
                        } as any)
                      }>
                      {reelThumb ? (
                        <Image
                          source={{ uri: reelThumb }}
                          style={styles.reelThumbnail}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.reelThumbnail, { backgroundColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="film-outline" size={28} color="rgba(255,255,255,0.4)" />
                        </View>
                      )}
                      <View style={styles.reelOverlayGradient} />
                      <View style={styles.reelPlayBadge}>
                        <Ionicons name="play" size={14} color="#fff" />
                      </View>
                      <Text style={styles.reelCaption} numberOfLines={2}>
                        {reel.caption || reel.creatorName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )
        )}

        {/* Vendor Catalog / Trending Listings Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isVendor
                ? selectedCategory
                  ? `${selectedCategory} (${filteredListings.length})`
                  : `📦 My Store Catalog Items (${filteredListings.length})`
                : selectedCategory
                ? `${selectedCategory} (${filteredListings.length})`
                : 'Trending Products & Services'}
            </Text>
            {isVendor && (
              <TouchableOpacity onPress={() => router.push('/vendor/listings' as any)}>
                <Text style={styles.seeAllText}>Manage Store Catalog ›</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={BrandColors.primary} style={{ marginVertical: 40 }} />
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Ionicons name="basket-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyListingsText}>No products found matching your search</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredListings.map((item) => {
                const imageUrl = getListingImage(item);
                const price = item.salePrice || item.sellingPrice || item.price || 0;
                const originalPrice = item.actualPrice || item.price;

                return (
                  <TouchableOpacity
                    key={item._id || item.id}
                    style={styles.productCard}
                    onPress={() => router.push(`/listing/${item._id || item.id}`)}>
                    {/* Card Thumbnail */}
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <View style={styles.productImageFallback}>
                        <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}

                    {/* Content Details */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <Text style={styles.vendorName} numberOfLines={1}>
                        {item.vendor?.businessName || item.vendor?.name || 'Verified Vendor'}
                      </Text>

                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.productPrice}>₹{price}</Text>
                          {originalPrice > price && (
                            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                          <TouchableOpacity
                            style={styles.chatSmallBtn}
                            onPress={() => {
                              const recipientId = item.vendor?._id || item.vendor?.id || item.vendor_id || item.user_id;
                              const vendorName = item.vendor?.businessName || item.vendor?.name || 'Seller';
                              if (!recipientId) {
                                Alert.alert('Seller Info', 'Seller details not available for this item.');
                                return;
                              }
                              router.push({
                                pathname: '/messages/[id]' as any,
                                params: {
                                  id: `direct_${recipientId}`,
                                  recipientId,
                                  name: vendorName,
                                  avatar: item.vendor?.avatarUrl || '',
                                },
                              } as any);
                            }}>
                            <Ionicons name="chatbubble-ellipses-outline" size={14} color={YELLOW} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.addCartBtn}
                            onPress={() =>
                              addToCartMutation.mutate({ listing_id: item._id || item.id, quantity: 1 })
                            }
                            disabled={addToCartMutation.isPending}>
                            <Ionicons name="add" size={18} color={BLACK} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BLACK,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandAccent: {
    color: YELLOW,
  },
  cartIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: YELLOW,
    minWidth: 16,
    height: 16,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 100,
    gap: Spacing.four,
  },

  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // ── Hero Banner ──
  heroBanner: {
    marginHorizontal: Spacing.four,
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.four,
    borderWidth: 2,
    borderColor: YELLOW,
    overflow: 'hidden',
  },
  heroContent: {
    gap: Spacing.two,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  heroTagText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 0,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  heroBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  seeAllText: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  clearFilterText: {
    color: '#EF4444',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  // ── Categories ──
  categoryScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryCard: {
    alignItems: 'center',
    width: 72,
    gap: 4,
  },
  categoryCardSelected: {
    opacity: 1,
  },
  categoryIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_CARD,
  },
  categoryName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: FontWeight.semibold,
  },
  categoryNameSelected: {
    color: YELLOW,
    fontWeight: '900',
  },

  // ── Reels ──
  reelsHighlightScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  reelHighlightCard: {
    width: 110,
    height: 170,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: DARK_CARD,
    justifyContent: 'flex-end',
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
  },
  reelThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  reelOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  reelPlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelCaption: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 4,
  },

  // ── Product Grid ──
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productImageFallback: {
    width: '100%',
    height: 140,
    backgroundColor: '#222228',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: Spacing.two,
    gap: 4,
  },
  productTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    lineHeight: 16,
  },
  vendorName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  productPrice: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    backgroundColor: YELLOW,
    width: 26,
    height: 26,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSmallBtn: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    width: 26,
    height: 26,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListings: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.two,
  },
  emptyListingsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
  },

  // ── Vendor Catalog ──
  vendorCatalogContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  vendorStoreCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.four,
    borderWidth: 2,
    borderColor: YELLOW,
    gap: Spacing.three,
  },
  vendorStoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  vendorStoreName: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  verifiedShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    gap: 3,
  },
  verifiedShieldText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
  },
  vendorStoreSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 0,
    gap: 4,
  },
  addListingBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },
  storeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BLACK,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  storeMetricChip: {
    alignItems: 'center',
    flex: 1,
  },
  storeMetricValue: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  storeMetricLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    marginTop: 1,
  },
  storeMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: BORDER,
  },
  catalogScrollContent: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  catalogCard: {
    width: 150,
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
  },
  catalogCardImage: {
    width: '100%',
    height: 120,
  },
  catalogPriceBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  catalogPriceText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  catalogCategoryTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 0,
  },
  catalogCategoryText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  catalogCardDetails: {
    padding: Spacing.two,
    gap: 5,
  },
  catalogItemTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    lineHeight: 15,
  },
  catalogCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 0,
    backgroundColor: YELLOW,
  },
  stockText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
  },
  editCardBtn: {
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: YELLOW,
  },
  emptyCatalogCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: YELLOW,
    gap: 8,
  },
  emptyCatalogTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyCatalogDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  emptyCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: 0,
    gap: 6,
    marginTop: Spacing.two,
  },
  emptyCatalogBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
});
