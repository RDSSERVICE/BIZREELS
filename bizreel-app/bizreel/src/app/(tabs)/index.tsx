/**
 * Reels Feed — TikTok / Instagram style full-screen vertical scroll with e-commerce integration.
 * Supports direct deep-linking / navigation to specific reels via `reelId` param.
 * Features side search overlay with live API querying and trending topic pills.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
import { ReelItem } from '@/features/reels/reel-item';
import type { Reel } from '@/features/reels/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TRENDING_TAGS = ['Fashion', 'Electronics', 'LocalDeals', 'Trending', 'Offers', 'Services'];

export default function ReelsFeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reelId?: string }>();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Reel>>(null);

  // Full screen height so reel fills 100% of the screen
  const reelHeight = SCREEN_HEIGHT;

  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useReelsFeed(activeQuery ? { q: activeQuery } : undefined);

  const prefetchNext = usePrefetchNextReelsPage();
  const reels = flattenReels(data?.pages);

  // Scroll to specific reel when navigated with reelId parameter
  useEffect(() => {
    if (!params?.reelId || reels.length === 0) return;
    const targetIndex = reels.findIndex((r) => r._id === params.reelId);
    if (targetIndex !== -1 && targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
      }, 100);
    }
  }, [params?.reelId, reels]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const index = viewableItems[0].index ?? 0;
      setActiveIndex(index);

      const currentPage = Math.floor(index / 3) + 1;
      const totalPages = data?.pages[data.pages.length - 1]?.meta.totalPages ?? 1;
      const isNearEnd = index >= reels.length - 2;

      if (isNearEnd && hasNextPage) {
        fetchNextPage();
      }
      if (hasNextPage && currentPage <= totalPages) {
        prefetchNext(currentPage, hasNextPage);
      }
    },
    [data, reels.length, hasNextPage, fetchNextPage, prefetchNext]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  });

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem
        reel={item}
        isActive={index === activeIndex && isScreenFocused}
        height={reelHeight}
      />
    ),
    [activeIndex, isScreenFocused, reelHeight]
  );

  const keyExtractor = useCallback((item: Reel) => item._id, []);

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
            onPress={() => router.push('/cart')}
            accessibilityLabel="Shopping Cart">
            <Ionicons name="cart" size={18} color="#fff" />
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
      ) : reels.length === 0 ? (
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
          data={reels}
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
    </View>
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
    backgroundColor: YELLOW,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: {
    color: BLACK,
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
    borderRadius: 0,
    backgroundColor: 'rgba(24, 24, 28, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: YELLOW,
  },
  searchOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
    backgroundColor: 'rgba(24, 24, 28, 0.95)',
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 8,
    gap: 8,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    height: 40,
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
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tagChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  tagChipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  activeSearchPill: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeSearchPillText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
    maxWidth: 200,
  },
  activeSearchPillClose: {
    padding: 2,
  },
});
