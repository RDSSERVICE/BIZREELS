/**
 * Reels Feed — TikTok / Instagram style full-screen vertical scroll with e-commerce integration.
 * Supports direct deep-linking / navigation to specific reels via `reelId` param.
 * Features side search overlay with live API querying and trending topic pills.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { flattenReels, usePrefetchNextReelsPage, useReelsFeed } from '@/features/reels/queries';
import { useCart } from '@/features/cart/queries';
import { useUnreadNotificationCount } from '@/features/notifications/queries';
import { ReelItem } from '@/features/reels/reel-item';
import type { Reel } from '@/features/reels/types';
import { api } from '@/lib/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TRENDING_TAGS = ['Fashion', 'Electronics', 'LocalDeals', 'Trending', 'Offers', 'Services'];

export default function ReelsFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reelId?: string }>();
  const { user, signOut } = useAuth();

  const isVendor = user?.activeRole === 'vendor' || user?.current_role === 'vendor';
  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Reel>>(null);

  const { data: unreadNotifsCount = 0 } = useUnreadNotificationCount(activeRole);
  const { data: cart } = useCart();
  const cartTotalItems = cart?.total_items || 0;

  // Full screen height so reel fills 100% of the screen
  const reelHeight = SCREEN_HEIGHT;

  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Search & Filter state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [reelTypeFilter, setReelTypeFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('trending');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const activeFilterCount = (reelTypeFilter !== 'all' ? 1 : 0) + (durationFilter !== 'all' ? 1 : 0) + (sortFilter !== 'trending' ? 1 : 0);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (err) {
        // Location detection fallback
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, [])
  );

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(() => {
    const pObj: any = {};
    if (activeQuery) pObj.q = activeQuery;
    if (reelTypeFilter !== 'all') pObj.type = reelTypeFilter;
    if (durationFilter !== 'all') pObj.duration = durationFilter;
    if (sortFilter !== 'trending') pObj.sort = sortFilter;
    if (userCoords) {
      pObj.lat = userCoords.lat;
      pObj.lng = userCoords.lng;
    }
    return Object.keys(pObj).length > 0 ? pObj : undefined;
  }, [activeQuery, reelTypeFilter, durationFilter, sortFilter, userCoords]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useReelsFeed(queryParams);

  const prefetchNext = usePrefetchNextReelsPage();
  const reels = flattenReels(data?.pages);

  // Single featured/selected reel state — used when reelId param points to a reel not in the current feed page
  const [featuredReel, setFeaturedReel] = useState<Reel | null>(null);
  const scrolledReelIdRef = useRef<string | null>(null);

  // Helper to match target reelId cleanly (handles _id / id / reel_id differences)
  const matchesTargetReel = useCallback((r: Reel, targetId?: string) => {
    if (!targetId || !r) return false;
    const strTarget = String(targetId);
    const rId = r._id ? String(r._id) : '';
    const rAltId = (r as any).id ? String((r as any).id) : '';
    const rReelId = (r as any).reel_id ? String((r as any).reel_id) : '';
    return rId === strTarget || rAltId === strTarget || rReelId === strTarget;
  }, []);

  useEffect(() => {
    if (!params?.reelId) {
      setFeaturedReel(null);
      scrolledReelIdRef.current = null;
      return;
    }
    const exists = reels.some((r) => matchesTargetReel(r, params.reelId));
    if (!exists) {
      api
        .get(`/reels/${params.reelId}`)
        .catch(() => api.get(`/reels/public/${params.reelId}`))
        .then((res) => {
          const fetched = res?.data?.data?.reel || res?.data?.data || res?.data?.reel || res?.data;
          if (fetched && (fetched._id || fetched.id)) {
            const enriched: Reel = {
              ...fetched,
              isLiked: Boolean(fetched.isLiked || fetched.is_liked || fetched.hasLiked || fetched.viewer_state?.liked),
              isSaved: Boolean(fetched.isSaved || fetched.is_saved || fetched.hasSaved || fetched.viewer_state?.saved),
              isFollowing: Boolean(fetched.isFollowing || fetched.is_following || fetched.viewer_following || fetched.viewer_state?.following),
            };
            setFeaturedReel(enriched);
          }
        })
        .catch(() => {});
    }
  }, [params?.reelId, reels, matchesTargetReel]);

  const displayReels = useMemo(() => {
    if (featuredReel && !reels.some((r) => matchesTargetReel(r, featuredReel._id || (featuredReel as any).id))) {
      return [featuredReel, ...reels];
    }
    return reels;
  }, [featuredReel, reels, matchesTargetReel]);

  // Reset scroll ref when screen gains focus with a new reelId
  useFocusEffect(
    useCallback(() => {
      if (params?.reelId && scrolledReelIdRef.current !== params.reelId) {
        scrolledReelIdRef.current = null;
      }
    }, [params?.reelId])
  );

  // Scroll to specific reel when navigated with reelId parameter ONCE
  useEffect(() => {
    if (!params?.reelId || displayReels.length === 0) return;
    if (scrolledReelIdRef.current === params.reelId) return;

    const targetIndex = displayReels.findIndex((r) => matchesTargetReel(r, params.reelId));
    if (targetIndex !== -1) {
      scrolledReelIdRef.current = params.reelId;
      setActiveIndex(targetIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
      }, 100);
    }
  }, [params?.reelId, displayReels, matchesTargetReel]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const index = viewableItems[0].index ?? 0;
      setActiveIndex(index);

      const currentPage = Math.floor(index / 3) + 1;
      const totalPages = data?.pages[data.pages.length - 1]?.meta.totalPages ?? 1;
      const isNearEnd = index >= displayReels.length - 2;

      if (isNearEnd && hasNextPage) {
        fetchNextPage();
      }
      if (hasNextPage && currentPage <= totalPages) {
        prefetchNext(currentPage, hasNextPage);
      }
    },
    [data, displayReels.length, hasNextPage, fetchNextPage, prefetchNext]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  });

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem
        reel={item}
        isActive={index === activeIndex && isScreenFocused}
        height={reelHeight}
        userLat={userCoords?.lat}
        userLng={userCoords?.lng}
      />
    ),
    [activeIndex, isScreenFocused, reelHeight, userCoords]
  );

  const keyExtractor = useCallback((item: Reel, index: number) => (item?._id ? `${item._id}_${index}` : `reel_${index}`), []);

  const ListFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={BrandColors.primary} />
      </View>
    );
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
    setSearchOpen(false);
    setActiveIndex(0);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      refetch();
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Top Overlay Actions: Search, Cart, Logout */}
      {!searchOpen ? (
        <View style={[styles.headerActions, { top: insets.top + 12 }]}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => setSearchOpen(true)}
            accessibilityLabel="Search Reels">
            <Ionicons name="search" size={18} color={YELLOW} />
          </Pressable>

          <Pressable
            style={styles.headerBtn}
            onPress={() => setFilterModalOpen(true)}
            accessibilityLabel="Filter Feed">
            <Ionicons
              name="options-outline"
              size={18}
              color={reelTypeFilter !== 'all' || durationFilter !== 'all' || sortFilter !== 'trending' ? YELLOW : '#fff'}
            />
          </Pressable>

          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={18} color="#fff" />
            {unreadNotifsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.headerBtn, cartTotalItems > 0 && styles.headerBtnActive]}
            onPress={() => router.push('/cart')}
            accessibilityLabel="Shopping Cart">
            <Ionicons name="cart-outline" size={18} color={cartTotalItems > 0 ? YELLOW : '#fff'} />
            {cartTotalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartTotalItems > 99 ? '99+' : cartTotalItems}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.headerBtn}
            onPress={handleLogout}
            accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        /* Expanded Side Search Bar Overlay */
        <View style={[styles.searchOverlay, { top: insets.top + 8 }]}>
          <View style={styles.searchBarRow}>
            <Ionicons name="search" size={16} color={YELLOW} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reels, #hashtags, products..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleClearSearch} style={styles.closeSearchBtn}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Quick Hashtag Topic Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagChipsContainer}>
            {TRENDING_TAGS.map((tag) => {
              const isSelected = searchQuery.toLowerCase().includes(tag.toLowerCase());
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => setSearchQuery(isSelected ? '' : `#${tag}`)}>
                  <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Active Search Results Indicator Pill */}
      {!!activeQuery && !searchOpen && (
        <View style={[styles.activeSearchPill, { top: insets.top + 60 }]}>
          <Ionicons name="funnel" size={12} color={BLACK} />
          <Text style={styles.activeSearchPillText} numberOfLines={1}>
            Results: "{activeQuery}"
          </Text>
          <TouchableOpacity onPress={handleClearSearch} style={styles.activeSearchPillClose}>
            <Ionicons name="close" size={14} color={BLACK} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Loading reels...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={BrandColors.warning} />
          <Text style={styles.errorText}>Failed to load reels</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : displayReels.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyTitle}>
            {activeQuery ? `No reels found for "${activeQuery}"` : 'No reels available'}
          </Text>
          {!!activeQuery && (
            <Pressable style={styles.retryBtn} onPress={handleClearSearch}>
              <Text style={styles.retryText}>Clear Search Filter</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayReels}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          snapToInterval={reelHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          ListFooterComponent={ListFooter}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 300);
          }}
          getItemLayout={(_, index) => ({
            length: reelHeight,
            offset: reelHeight * index,
            index,
          })}
        />
      )}

      {/* ── REELS FEED FILTER BOTTOM SHEET MODAL ── */}
      <Modal
        visible={filterModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setFilterModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalOpen(false)} />
          
          <View style={styles.modalContent}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandleBox}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconBox}>
                  <Ionicons name="options-outline" size={20} color={GOLD} />
                </View>
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.modalTitle}>Filter Reels & Feed</Text>
                  <Text style={styles.modalSubtitle}>
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`
                      : 'Tune your video feed preferences'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color="#A1998E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 20, paddingVertical: 12 }}>
                {/* 1. REEL TYPE */}
                <View style={styles.filterGroup}>
                  <View style={styles.filterGroupHeader}>
                    <Ionicons name="film-outline" size={14} color={GOLD} />
                    <Text style={styles.filterSectionTitle}>REEL CONTENT TYPE</Text>
                  </View>
                  <View style={styles.chipsWrap}>
                    {[
                      { id: 'all', label: 'All Types' },
                      { id: 'Product Reel', label: 'Product Reel' },
                      { id: 'Service Reel', label: 'Service Reel' },
                      { id: 'Offer Reel', label: 'Offer Reel' },
                      { id: 'Shop promotion', label: 'Shop Promotion' },
                      { id: 'Announcement', label: 'Announcement' },
                    ].map((t) => {
                      const isSelected = reelTypeFilter === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => setReelTypeFilter(t.id)}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. DURATION */}
                <View style={styles.filterGroup}>
                  <View style={styles.filterGroupHeader}>
                    <Ionicons name="time-outline" size={14} color={GOLD} />
                    <Text style={styles.filterSectionTitle}>VIDEO DURATION</Text>
                  </View>
                  <View style={styles.chipsWrap}>
                    {[
                      { id: 'all', label: 'All Durations' },
                      { id: 'under15', label: 'Under 15 sec' },
                      { id: 'under30', label: 'Under 30 sec' },
                    ].map((d) => {
                      const isSelected = durationFilter === d.id;
                      return (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => setDurationFilter(d.id)}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. SORTING */}
                <View style={styles.filterGroup}>
                  <View style={styles.filterGroupHeader}>
                    <Ionicons name="flame-outline" size={14} color={GOLD} />
                    <Text style={styles.filterSectionTitle}>POPULARITY & SORT</Text>
                  </View>
                  <View style={styles.chipsWrap}>
                    {[
                      { id: 'trending', label: '🔥 Trending' },
                      { id: 'most_viewed', label: '👁️ Most Viewed' },
                      { id: 'most_liked', label: '❤️ Most Liked' },
                    ].map((s) => {
                      const isSelected = sortFilter === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.presetChip, isSelected && styles.presetChipActive]}
                          onPress={() => setSortFilter(s.id)}>
                          <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.resetModalBtn}
                onPress={() => {
                  setReelTypeFilter('all');
                  setDurationFilter('all');
                  setSortFilter('trending');
                  setFilterModalOpen(false);
                }}>
                <Text style={styles.resetModalBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyModalBtn} onPress={() => setFilterModalOpen(false)}>
                <Text style={styles.applyModalBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const GOLD = '#D99A3D';
const YELLOW = GOLD;
const BLACK = '#0F0F12';
const SHEET_BG = '#161311';
const BORDER = 'rgba(255, 255, 255, 0.1)';
const TEXT_MUTED = '#A1998E';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLACK,
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  errorText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#161311',
    fontWeight: '900',
    fontSize: FontSize.base,
  },
  footerLoader: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(24, 24, 28, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.4)',
  },
  headerBtnActive: {
    borderColor: YELLOW,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
    backgroundColor: 'rgba(22, 19, 17, 0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.4)',
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '600',
    height: '100%',
  },
  closeSearchBtn: { padding: 4 },
  tagChipsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagChipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  tagChipText: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  tagChipTextActive: {
    color: '#161311',
    fontWeight: '900',
  },
  activeSearchPill: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activeSearchPillText: {
    color: '#161311',
    fontSize: 11,
    fontWeight: '900',
    maxWidth: 200,
  },
  activeSearchPillClose: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 154, 61, 0.25)',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  sheetHandleBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 154, 61, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 154, 61, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    gap: 2,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGroup: {
    gap: 10,
  },
  filterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterSectionTitle: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetChipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  presetChipText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#161311',
    fontWeight: '900',
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  resetModalBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalBtnText: {
    color: '#D4CEC5',
    fontSize: 13,
    fontWeight: '700',
  },
  applyModalBtn: {
    flex: 2,
    backgroundColor: GOLD,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyModalBtnText: {
    color: '#161311',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: YELLOW,
    paddingHorizontal: 4,
    height: 15,
    minWidth: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0F0F12',
  },
  cartBadgeText: { color: '#0F0F12', fontSize: 8, fontWeight: '900' },
});
