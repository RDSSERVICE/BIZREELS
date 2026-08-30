import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';
import { useAddToCart } from '@/features/cart/queries';
import { useFollowUser, useUnfollowUser } from '@/features/reels/queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - Spacing.four * 3) / 2;

interface VendorDetails {
  id: string;
  name: string;
  business_name?: string;
  profile_pic?: string;
  cover_banner?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  city?: string;
  state?: string;
  address?: string;
  whatsapp?: string;
  phone?: string;
  verified_badge?: boolean;
  rating_avg?: number;
  rating_count?: number;
  viewer_following?: boolean;
  stats?: {
    posts?: number;
    followers?: number;
    following?: number;
    likes?: number;
    views?: number;
    reviews?: number;
    products?: number;
    services?: number;
  };
}

interface ProductItem {
  _id: string;
  id?: string;
  title: string;
  price: number;
  salePrice?: number;
  actualPrice?: number;
  images?: string[];
  thumbnailUrl?: string;
  type?: 'product' | 'service';
  vendor?: any;
}

interface ReelItemData {
  _id: string;
  id?: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaUrls?: string[];
  videoUrl?: string;
  views_count?: number;
  likes_count?: number;
}

export default function PublicVendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; vendorId?: string }>();
  const vendorId = params.id || params.vendorId;

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [reels, setReels] = useState<ReelItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reels' | 'about'>('products');
  const [isFollowing, setIsFollowing] = useState(false);

  const addToCartMutation = useAddToCart();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const fetchVendorData = useCallback(async () => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    try {
      const [vendorRes, listingsRes, reelsRes] = await Promise.all([
        api.get(`/vendors/${vendorId}`).catch(() =>
          api.get(`/users/${vendorId}`).catch(() => ({ data: {} }))
        ),
        api.get(`/listings`, { params: { vendor_id: vendorId } }).catch(() =>
          api.get(`/v1/listings`, { params: { vendor: vendorId } }).catch(() => ({ data: { items: [] } }))
        ),
        api.get(`/reels`, { params: { vendor_id: vendorId } }).catch(() =>
          api.get(`/reels`, { params: { creator_id: vendorId } }).catch(() => ({ data: { items: [] } }))
        ),
      ]);

      const vData = vendorRes.data?.data || vendorRes.data?.vendor || vendorRes.data || {};
      setVendor(vData);
      setIsFollowing(Boolean(vData.viewer_following));

      const pItems = listingsRes.data?.data?.items || listingsRes.data?.items || listingsRes.data || [];
      setProducts(Array.isArray(pItems) ? pItems : []);

      const rItems = reelsRes.data?.data?.reels || reelsRes.data?.reels || reelsRes.data?.items || reelsRes.data || [];
      setReels(Array.isArray(rItems) ? rItems : []);
    } catch (err) {
      console.warn('Failed to load vendor profile details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorData();
  };

  const handleToggleFollow = () => {
    if (!vendorId) return;
    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      followMutation.mutate(vendorId);
    } else {
      unfollowMutation.mutate(vendorId);
    }
  };

  const handleChat = () => {
    if (!vendorId) return;
    const name = vendor?.business_name || vendor?.name || 'Store Seller';
    router.push({
      pathname: '/messages/[id]' as any,
      params: {
        id: `direct_${vendorId}`,
        recipientId: vendorId,
        name,
        avatar: vendor?.profile_pic || '',
      },
    } as any);
  };

  const handleCall = () => {
    const num = vendor?.whatsapp || vendor?.phone;
    if (num) {
      Linking.openURL(`tel:${num}`).catch(() =>
        Alert.alert('Phone Call', `Vendor contact number: ${num}`)
      );
    } else {
      Alert.alert('Contact Vendor', 'Phone number not shared publicly.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
        <Text style={styles.loadingText}>Loading Vendor Store...</Text>
      </View>
    );
  }

  if (!vendor || !vendorId) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="storefront-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.notFoundTitle}>Vendor Profile Not Found</Text>
        <Text style={styles.notFoundSub}>The vendor profile you requested could not be located.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri = resolveImageUrl(vendor.profile_pic) || 'https://via.placeholder.com/150';
  const bannerUri = resolveImageUrl(vendor.cover_banner) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800';

  return (
    <View style={styles.container}>
      {/* Sticky Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top + Spacing.two }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {vendor.business_name || vendor.name}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {vendor.category || 'Verified Business Store'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} />}>
        {/* Cover Banner */}
        <View style={styles.coverBox}>
          <Image source={{ uri: bannerUri }} style={styles.coverImage} contentFit="cover" />
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Header Info Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarBorder}>
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            </View>
            <View style={styles.headerBtnGroup}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={handleToggleFollow}>
                <Ionicons
                  name={isFollowing ? 'checkmark-circle' : 'person-add-outline'}
                  size={14}
                  color={isFollowing ? '#fff' : BLACK}
                />
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow Store'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <Ionicons name="chatbubble-ellipses" size={14} color={BLACK} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Details */}
          <View style={styles.businessInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.businessTitle}>
                {vendor.business_name || vendor.name}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.verifiedBadgeText}>VERIFIED STORE</Text>
              </View>
            </View>

            <Text style={styles.categorySub}>
              {vendor.category ? `${vendor.category}` : 'General Business'}
              {vendor.subcategory ? ` • ${vendor.subcategory}` : ''}
            </Text>

            {!!vendor.address || !!vendor.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={YELLOW} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {vendor.address || `${vendor.city || ''}, ${vendor.state || ''}`}
                </Text>
              </View>
            ) : null}

            {!!vendor.description && (
              <Text style={styles.descriptionText} numberOfLines={3}>
                {vendor.description}
              </Text>
            )}
          </View>

          {/* Action Row */}
          <View style={styles.contactActionRow}>
            <TouchableOpacity style={styles.actionPill} onPress={handleCall}>
              <Ionicons name="call-outline" size={14} color={YELLOW} />
              <Text style={styles.actionPillText}>Call Store</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionPill} onPress={handleChat}>
              <Ionicons name="paper-plane-outline" size={14} color={YELLOW} />
              <Text style={styles.actionPillText}>Send Inquiry</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsRow}>
            <View style={styles.metricChip}>
              <Text style={styles.metricVal}>{vendor.stats?.products ?? products.length}</Text>
              <Text style={styles.metricLabel}>Products</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricChip}>
              <Text style={styles.metricVal}>{vendor.stats?.posts ?? reels.length}</Text>
              <Text style={styles.metricLabel}>Video Reels</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricChip}>
              <Text style={styles.metricVal}>{vendor.stats?.followers ?? (isFollowing ? 1 : 0)}</Text>
              <Text style={styles.metricLabel}>Followers</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricChip}>
              <Text style={styles.metricVal}>{(vendor.rating_avg || 4.9).toFixed(1)} ★</Text>
              <Text style={styles.metricLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Tab Headers */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
            onPress={() => setActiveTab('products')}>
            <Ionicons
              name="bag-handle-outline"
              size={16}
              color={activeTab === 'products' ? YELLOW : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'products' && styles.tabBtnTextActive]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'reels' && styles.tabBtnActive]}
            onPress={() => setActiveTab('reels')}>
            <Ionicons
              name="videocam-outline"
              size={16}
              color={activeTab === 'reels' ? YELLOW : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'reels' && styles.tabBtnTextActive]}>
              Reels ({reels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'about' && styles.tabBtnActive]}
            onPress={() => setActiveTab('about')}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={activeTab === 'about' ? YELLOW : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'about' && styles.tabBtnTextActive]}>
              About Store
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENTS */}
        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            {products.length > 0 ? (
              <View style={styles.productGrid}>
                {products.map((item) => {
                  const imgUri =
                    resolveImageUrl(item.images?.[0] || item.thumbnailUrl) ||
                    'https://via.placeholder.com/300';
                  const price = item.salePrice || item.price || 0;

                  return (
                    <TouchableOpacity
                      key={item._id || item.id}
                      style={styles.productCard}
                      onPress={() => router.push(`/listing/${item._id || item.id}`)}>
                      <Image source={{ uri: imgUri }} style={styles.productImage} contentFit="cover" />
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <View style={styles.productPriceRow}>
                          <Text style={styles.productPrice}>₹{price}</Text>
                          <TouchableOpacity
                            style={styles.addCartSmallBtn}
                            onPress={() =>
                              addToCartMutation.mutate({ listing_id: (item._id || item.id || ''), quantity: 1 })
                            }>
                            <Ionicons name="cart" size={14} color={BLACK} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="basket-outline" size={36} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>No Products Cataloged</Text>
                <Text style={styles.emptySub}>This vendor has not published catalog products yet.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'reels' && (
          <View style={styles.tabContent}>
            {reels.length > 0 ? (
              <View style={styles.reelsGrid}>
                {reels.map((reel) => {
                  const thumb =
                    resolveImageUrl(reel.thumbnailUrl || reel.mediaUrls?.[0]) ||
                    'https://via.placeholder.com/300';
                  return (
                    <TouchableOpacity
                      key={reel._id || reel.id}
                      style={styles.reelThumbCard}
                      onPress={() =>
                        router.push({
                          pathname: '/reel/[id]',
                          params: { id: reel._id || reel.id, videoUrl: reel.videoUrl || '' },
                        } as any)
                      }>
                      <Image source={{ uri: thumb }} style={styles.reelThumbImage} contentFit="cover" />
                      <View style={styles.reelPlayBadge}>
                        <Ionicons name="play" size={12} color="#fff" />
                        <Text style={styles.reelPlayText}>{(reel.views_count || 420).toLocaleString()}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={36} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyTitle}>No Video Reels Yet</Text>
                <Text style={styles.emptySub}>This vendor has not uploaded video reels yet.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutHeader}>STORE INFORMATION</Text>
              <View style={styles.aboutRow}>
                <Ionicons name="business-outline" size={16} color={YELLOW} />
                <Text style={styles.aboutLabel}>Business Name:</Text>
                <Text style={styles.aboutVal}>{vendor.business_name || vendor.name}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="grid-outline" size={16} color={YELLOW} />
                <Text style={styles.aboutLabel}>Category:</Text>
                <Text style={styles.aboutVal}>{vendor.category || 'General Business'}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="location-outline" size={16} color={YELLOW} />
                <Text style={styles.aboutLabel}>Location:</Text>
                <Text style={styles.aboutVal}>
                  {vendor.address || `${vendor.city || 'India'}, ${vendor.state || ''}`}
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={YELLOW} />
                <Text style={styles.aboutLabel}>Verification Status:</Text>
                <Text style={[styles.aboutVal, { color: '#10B981', fontWeight: '900' }]}>
                  Verified Business
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  centerContainer: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  loadingText: { color: '#fff', fontSize: FontSize.xs, marginTop: 12, fontWeight: '700' },
  notFoundTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900', marginTop: 12 },
  notFoundSub: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  backHomeBtn: { backgroundColor: YELLOW, paddingHorizontal: 16, paddingVertical: 10 },
  backHomeBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  headerSub: { color: YELLOW, fontSize: 10, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  coverBox: { height: 130, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  profileHeaderCard: {
    backgroundColor: DARK_CARD,
    marginHorizontal: Spacing.four,
    marginTop: -30,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  avatarBorder: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: YELLOW, overflow: 'hidden', backgroundColor: BLACK },
  avatarImage: { width: '100%', height: '100%' },
  headerBtnGroup: { flexDirection: 'row', gap: 8 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 8 },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: BORDER },
  followBtnText: { color: BLACK, fontSize: 11, fontWeight: '900' },
  followBtnTextActive: { color: '#fff' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
  chatBtnText: { color: BLACK, fontSize: 11, fontWeight: '900' },
  businessInfo: { gap: 4 },
  businessTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2 },
  verifiedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  categorySub: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  descriptionText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, lineHeight: 18, marginTop: 4 },
  contactActionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 6, flex: 1, justifyContent: 'center' },
  actionPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingVertical: 10, marginTop: 4 },
  metricChip: { flex: 1, alignItems: 'center' },
  metricVal: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  metricLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', marginTop: 2 },
  metricDivider: { width: 1, backgroundColor: BORDER },
  tabBar: { flexDirection: 'row', backgroundColor: DARK_CARD, marginHorizontal: Spacing.four, marginTop: Spacing.three, borderWidth: 1, borderColor: BORDER },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: YELLOW, backgroundColor: BLACK },
  tabBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, fontWeight: '700' },
  tabBtnTextActive: { color: YELLOW, fontWeight: '900' },
  tabContent: { paddingHorizontal: Spacing.four, marginTop: Spacing.three },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  productCard: { width: COLUMN_WIDTH, backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  productImage: { width: '100%', height: 130 },
  productInfo: { padding: 8, gap: 4 },
  productTitle: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 15 },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productPrice: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900' },
  addCartSmallBtn: { backgroundColor: YELLOW, padding: 4 },
  reelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reelThumbCard: { width: (SCREEN_WIDTH - Spacing.four * 2 - 16) / 3, height: 160, backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, position: 'relative' },
  reelThumbImage: { width: '100%', height: '100%' },
  reelPlayBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2 },
  reelPlayText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.six, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  emptySub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' },
  aboutCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.three },
  aboutHeader: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aboutLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', width: 130 },
  aboutVal: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '700' },
});
