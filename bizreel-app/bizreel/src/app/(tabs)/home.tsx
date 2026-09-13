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
import { BrandColors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useAddToCart, useCart } from '@/features/cart/queries';
import { useReelsFeed } from '@/features/reels/queries';
import { useVendorListings } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import CreatorDashboardScreen from '../creator/dashboard';
import { getListingImage, resolveImageUrl } from '@/utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.four * 2 - Spacing.three) / 2;

const CATEGORIES: Array<{
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}> = [
  { id: '1', name: 'Electronics', icon: 'laptop-outline', color: '#2563EB' },
  { id: '2', name: 'Fashion', icon: 'shirt-outline', color: '#EC4899' },
  { id: '3', name: 'Home & Living', icon: 'home-outline', color: '#F59E0B' },
  { id: '4', name: 'Vehicles', icon: 'car-outline', color: '#8B5CF6' },
  { id: '5', name: 'Real Estate', icon: 'business-outline', color: '#10B981' },
  { id: '6', name: 'Beauty & Salon', icon: 'sparkles-outline', color: '#F43F5E' },
  { id: '7', name: 'Digital Services', icon: 'flash-outline', color: '#06B6D4' },
  { id: '8', name: 'Corporate Gifts', icon: 'gift-outline', color: '#D97706' },
];

const CATEGORY_BG_OPAQUE: Record<string, string> = {
  'Electronics': '#EFF6FF',
  'Fashion': '#FDF2F8',
  'Home & Living': '#FEF3C7',
  'Vehicles': '#F5F3FF',
  'Real Estate': '#ECFDF5',
  'Beauty & Salon': '#FFF1F2',
  'Digital Services': '#ECFEFF',
  'Corporate Gifts': '#FFFBEB',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [listings, setListings] = useState<any[]>([]);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: cart } = useCart();
  const addToCartMutation = useAddToCart();
  const { data: reelsData } = useReelsFeed();
  const { data: vendorListings = [] } = useVendorListings();

  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const isVendor = activeRole === 'vendor';
  const isCreator = activeRole === 'creator';
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

  const fetchActiveOffers = async () => {
    try {
      const { data } = await api.get('/offers/active');
      const items = data.data || data.items || data.offers || data || [];
      const list = Array.isArray(items) ? items : [];
      const now = new Date();
      const validActive = list.filter((o: any) => {
        if (o.endTime && new Date(o.endTime) < now) return false;
        if (o.status === 'Disabled' || o.status === 'Expired') return false;
        return true;
      });
      setActiveOffers(validActive);
    } catch (err) {
      setActiveOffers([]);
    }
  };

  const fetchHomeData = async () => {
    try {
      const { data } = await api.get('/listings', { params: { limit: 20 } });
      const items = data.data || data.items || data || [];
      setListings(Array.isArray(items) ? items : []);
      fetchActiveOffers();
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
            {!user ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={styles.headerLoginBtn}
                  onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.headerLoginText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerRegisterBtn}
                  onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.headerRegisterText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <RoleSwitcher />

                {!isCreator && (
                  <TouchableOpacity
                    style={styles.chatIconBtn}
                    onPress={() => router.push('/messages' as any)}
                    accessibilityLabel="Messages Inbox">
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={YELLOW} />
                  </TouchableOpacity>
                )}

                {!isVendor && !isCreator && (
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
                )}
              </>
            )}
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
        {/* Highlighted Search Bar (Customer & Vendor mode only) */}
        {!isCreator && (
          <TouchableOpacity
            style={styles.searchBarContainer}
            activeOpacity={0.92}
            onPress={() => router.push('/(tabs)/search' as any)}>
            <View style={styles.searchIconBox}>
              <Ionicons name="search" size={18} color={YELLOW} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search 10,000+ Products, Services & Sellers..."
              placeholderTextColor="#64748B"
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
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : (
              <View style={styles.searchActionBtn}>
                <Text style={styles.searchActionText}>SEARCH</Text>
                <Ionicons name="arrow-forward" size={12} color={YELLOW} />
              </View>
            )}
          </TouchableOpacity>
        )}



        {/* Hero Promotional Card Banner (Customer mode only) */}
        {!isVendor && !isCreator && (
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
        {!isVendor && !isCreator && (
          <View style={styles.categoriesSectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitleGroup}>
                <View style={styles.sectionHeaderIconBox}>
                  <Ionicons name="apps" size={14} color={YELLOW} />
                </View>
                <Text style={styles.sectionTitle}>Browse Categories</Text>
              </View>
              {selectedCategory ? (
                <TouchableOpacity
                  style={styles.clearFilterBadge}
                  onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.clearFilterText}>Reset Filter</Text>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                </TouchableOpacity>
              ) : (
                <View style={styles.categoryCountChip}>
                  <Text style={styles.categoryCountChipText}>{CATEGORIES.length} Categories</Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {/* "All" Category Tile */}
              <TouchableOpacity
                style={[
                  styles.categoryCardTile,
                  selectedCategory === null && styles.categoryCardTileSelectedAll,
                ]}
                onPress={() => setSelectedCategory(null)}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.categoryIconContainer,
                    {
                      backgroundColor: selectedCategory === null ? YELLOW : '#E2E8F0',
                      borderColor: selectedCategory === null ? YELLOW : 'rgba(203, 213, 225, 0.6)',
                    },
                  ]}>
                  <Ionicons
                    name="grid"
                    size={22}
                    color={selectedCategory === null ? '#1E293B' : '#64748B'}
                  />
                  {selectedCategory === null && (
                    <View style={[styles.categoryActiveCheckDot, { backgroundColor: '#241B15', borderColor: YELLOW }]}>
                      <Ionicons name="checkmark" size={9} color={YELLOW} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.categoryTileName,
                    selectedCategory === null && styles.categoryTileNameSelected,
                  ]}>
                  All
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const opaqueBg = CATEGORY_BG_OPAQUE[cat.name] || '#F1F5F9';

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCardTile,
                      isSelected && {
                        backgroundColor: opaqueBg,
                        borderColor: cat.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
                    activeOpacity={0.8}>
                    <View
                      style={[
                        styles.categoryIconContainer,
                        {
                          backgroundColor: isSelected ? cat.color : cat.color + '22',
                          borderColor: isSelected ? cat.color : cat.color + '40',
                        },
                      ]}>
                      <Ionicons
                        name={cat.icon}
                        size={22}
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                      {isSelected && (
                        <View style={[styles.categoryActiveCheckDot, { backgroundColor: '#241B15', borderColor: cat.color }]}>
                          <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.categoryTileName,
                        isSelected && { color: TEXT_DARK, fontWeight: '900' },
                      ]}
                      numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Creator Studio Hub / Vendor Catalog / Customer Marketplace */}
        {isCreator ? (
          <CreatorDashboardScreen embedded />
        ) : isVendor ? (
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
                {vendorListings.map((item, idx) => {
                  const imgUri = getListingImage(item) || 'https://via.placeholder.com/300';
                  return (
                    <TouchableOpacity
                      key={item._id ? `${item._id}_v_${idx}` : `vcat_${idx}`}
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
                  {myReels.map((reel, idx) => {
                    const reelThumb = resolveImageUrl(reel.thumbnailUrl || reel.mediaUrls?.[0] || (reel as any).coverImage);
                    return (
                      <TouchableOpacity
                        key={reel._id ? `${reel._id}_my_${idx}` : `myreel_${idx}`}
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
                {reels.slice(0, 6).map((reel, idx) => {
                  const reelThumb = resolveImageUrl(reel.thumbnailUrl || reel.mediaUrls?.[0] || (reel as any).coverImage);
                  return (
                    <TouchableOpacity
                      key={reel._id ? `${reel._id}_feat_${idx}` : `feat_reel_${idx}`}
                      style={styles.reelHighlightCard}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)',
                          params: { reelId: reel._id || (reel as any).id },
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

        {/* 🔥 Active Deals & Special Offers Section (Customer & Vendor mode) */}
        {!isCreator && activeOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Active Vendor Deals & Coupons ({activeOffers.length})</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {activeOffers.map((offer: any, idx: number) => {
                const code = offer.code || offer.couponCode || 'PROMO';
                const discount = offer.discountValue || offer.discountPct || 15;
                const discType = offer.discountType || 'percent';
                const discText = discType === 'fixed' ? `₹${discount} OFF` : `${discount}% OFF`;

                return (
                  <View
                    key={offer._id ? `${offer._id}_${idx}` : `offer_${idx}`}
                    style={{
                      width: 220,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      padding: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ backgroundColor: '#D99A3D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{discText}</Text>
                      </View>
                      <Ionicons name="pricetag" size={14} color="#D99A3D" />
                    </View>
                    <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                      {offer.title || offer.offerName || 'Special Offer'}
                    </Text>
                    {Boolean(offer.description) && (
                      <Text style={{ color: '#64748B', fontSize: 11, marginVertical: 4 }} numberOfLines={2}>
                        {offer.description}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '900' }}>CODE: {code}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 10 }}>
                        {offer.endTime ? new Date(offer.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Active'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Vendor Catalog / Trending Listings Grid (Customer & Vendor mode only) */}
        {!isCreator && (
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
                {filteredListings.map((item, idx) => {
                  const imageUrl = getListingImage(item);
                  const price = item.salePrice || item.sellingPrice || item.price || 0;
                  const originalPrice = item.actualPrice || item.price;

                  return (
                    <TouchableOpacity
                      key={(item._id || item.id) ? `${item._id || item.id}_grid_${idx}` : `list_${idx}`}
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

                          {!isVendor && !isCreator && (
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
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── About BizReels Public Platform Overview ── */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutHeaderRow}>
            <View style={styles.aboutBadge}>
              <Text style={styles.aboutBadgeText}>ABOUT BIZREELS.IN</Text>
            </View>
            <Text style={styles.aboutTitle}>Empowering Local Businesses & Buyers</Text>
            <Text style={styles.aboutSubtitle}>
              BizReels is India's first short-video marketplace connecting local sellers, content creators, and buyers directly with zero commission markups.
            </Text>
          </View>

          <View style={styles.aboutGrid}>
            <View style={styles.aboutCard}>
              <View style={styles.aboutIconBox}>
                <Ionicons name="videocam-outline" size={22} color={YELLOW} />
              </View>
              <Text style={styles.aboutCardTitle}>Short Video Reels</Text>
              <Text style={styles.aboutCardDesc}>
                Watch 15-second product & service reels created by local sellers before making buying decisions.
              </Text>
            </View>

            <View style={styles.aboutCard}>
              <View style={styles.aboutIconBox}>
                <Ionicons name="chatbubbles-outline" size={22} color={YELLOW} />
              </View>
              <Text style={styles.aboutCardTitle}>Direct Connect</Text>
              <Text style={styles.aboutCardDesc}>
                Chat directly on WhatsApp or call vendors directly without middlemen or hidden fees.
              </Text>
            </View>

            <View style={styles.aboutCard}>
              <View style={styles.aboutIconBox}>
                <Ionicons name="shield-checkmark-outline" size={22} color={YELLOW} />
              </View>
              <Text style={styles.aboutCardTitle}>Verified Suppliers</Text>
              <Text style={styles.aboutCardDesc}>
                Discover 10,000+ KYC verified businesses across Electronics, Fashion, Services & Local Deals.
              </Text>
            </View>

            <View style={styles.aboutCard}>
              <View style={styles.aboutIconBox}>
                <Ionicons name="flash-outline" size={22} color={YELLOW} />
              </View>
              <Text style={styles.aboutCardTitle}>Zero Commission</Text>
              <Text style={styles.aboutCardDesc}>
                Sellers keep 100% of profits, ensuring buyers get authentic wholesale and factory prices.
              </Text>
            </View>
          </View>

          {!user && (
            <View style={styles.aboutCtaBox}>
              <Text style={styles.aboutCtaTitle}>Join Thousands of Local Buyers & Sellers</Text>
              <Text style={styles.aboutCtaSub}>Create your free account today to message sellers & post reels.</Text>
              <View style={styles.aboutCtaBtnRow}>
                <TouchableOpacity
                  style={styles.aboutCtaPrimaryBtn}
                  onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.aboutCtaPrimaryText}>Create Free Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aboutCtaSecondaryBtn}
                  onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.aboutCtaSecondaryText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const YELLOW = '#F59E0B';
const PRIMARY = '#2563EB';
const LIGHT_BG = '#F6F4EE';
const WHITE_CARD = '#FBF9F5';
const BORDER = '#E5E0D4';
const TEXT_DARK = '#1E1B18';
const TEXT_MUTED = '#6E675F';
const BLACK = '#1E1B18';
const DARK_CARD = '#FBF9F5';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: WHITE_CARD,
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
    color: TEXT_DARK,
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandAccent: {
    color: YELLOW,
  },
  cartIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: YELLOW,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: TEXT_DARK,
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    paddingBottom: 100,
    gap: Spacing.four,
  },

  // ── Highlighted Search Bar ──
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE_CARD,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 154, 61, 0.45)',
    gap: 10,
    shadowColor: '#D99A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  searchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#241B15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    color: TEXT_DARK,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  searchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#241B15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchActionText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── Bento Hero Banner ──
  heroBanner: {
    marginHorizontal: Spacing.four,
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroContent: {
    gap: Spacing.two,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  heroTagText: {
    color: '#D97706',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.lg,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroSub: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  heroBtnText: {
    color: TEXT_DARK,
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
    color: TEXT_DARK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  seeAllText: {
    color: PRIMARY,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },

  // ── Bento Category Cards ──
  categoriesSectionContainer: {
    gap: 8,
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: '#241B15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.6)',
  },
  categoryCountChipText: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  clearFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearFilterText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  categoryScroll: {
    paddingHorizontal: Spacing.four,
    gap: 10,
    paddingVertical: 6,
  },
  categoryCardTile: {
    alignItems: 'center',
    width: 84,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.xl,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'rgba(203, 213, 225, 0.8)',
  },
  categoryCardTileSelectedAll: {
    backgroundColor: '#FFFBEB',
    borderColor: YELLOW,
    borderWidth: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  categoryActiveCheckDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryTileName: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 14,
  },
  categoryTileNameSelected: {
    color: TEXT_DARK,
    fontWeight: '900',
  },

  // ── Reels ──
  reelsHighlightScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  reelHighlightCard: {
    width: 116,
    height: 176,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: WHITE_CARD,
    justifyContent: 'flex-end',
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reelThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  reelOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  reelPlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelCaption: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },

  // ── Bento Product Grid ──
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productImageFallback: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: Spacing.two,
    gap: 4,
  },
  productTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.xs,
    fontWeight: '800',
    lineHeight: 16,
  },
  vendorName: {
    color: TEXT_MUTED,
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  productPrice: {
    color: '#D97706',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  originalPrice: {
    color: '#94A3B8',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  addCartBtn: {
    backgroundColor: YELLOW,
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSmallBtn: {
    backgroundColor: WHITE_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    width: 28,
    height: 28,
    borderRadius: Radius.md,
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
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
  },

  // ── Bento Vendor Catalog ──
  vendorCatalogContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  vendorStoreCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: BORDER,
    gap: Spacing.three,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  vendorStoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  vendorStoreName: {
    color: TEXT_DARK,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  verifiedShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: YELLOW,
    gap: 3,
  },
  verifiedShieldText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '900',
  },
  vendorStoreSub: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginTop: 2,
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
  },
  addListingBtnText: {
    color: TEXT_DARK,
    fontSize: 11,
    fontWeight: '900',
  },
  storeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  storeMetricChip: {
    alignItems: 'center',
    flex: 1,
  },
  storeMetricValue: {
    color: PRIMARY,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  storeMetricLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
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
    width: 154,
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  catalogCardImage: {
    width: '100%',
    height: 120,
  },
  catalogPriceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  catalogPriceText: {
    color: TEXT_DARK,
    fontSize: 10,
    fontWeight: '900',
  },
  catalogCategoryTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
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
    color: TEXT_DARK,
    fontSize: FontSize.xs,
    fontWeight: '800',
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
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
  },
  stockText: {
    color: TEXT_MUTED,
    fontSize: 9,
  },
  editCardBtn: {
    width: 24,
    height: 24,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  emptyCatalogCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  emptyCatalogTitle: {
    color: TEXT_DARK,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  emptyCatalogDesc: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  emptyCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    marginTop: Spacing.two,
  },
  emptyCatalogBtnText: {
    color: TEXT_DARK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  headerLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  headerLoginText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  headerRegisterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: YELLOW,
  },
  headerRegisterText: {
    color: TEXT_DARK,
    fontSize: 12,
    fontWeight: '900',
  },

  // ── Bento About Section ──
  aboutSection: {
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: Spacing.four,
    paddingVertical: 20,
    backgroundColor: WHITE_CARD,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  aboutHeaderRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutBadge: {
    backgroundColor: 'rgba(37,99,235,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    marginBottom: 8,
  },
  aboutBadgeText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aboutTitle: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  aboutSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  aboutGrid: {
    gap: 12,
  },
  aboutCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  aboutIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aboutCardTitle: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  aboutCardDesc: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  aboutCtaBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(37,99,235,0.05)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
    alignItems: 'center',
  },
  aboutCtaTitle: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutCtaSub: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  aboutCtaBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aboutCtaPrimaryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  aboutCtaPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  aboutCtaSecondaryBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  aboutCtaSecondaryText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
});

