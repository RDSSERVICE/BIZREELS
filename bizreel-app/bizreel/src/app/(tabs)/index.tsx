/**
 * Reels Feed — TikTok-style full-screen vertical scroll.
 *
 * Pagination strategy:
 * - useInfiniteQuery fetches 3 reels per page
 * - When the user reaches the last reel of the current page,
 *   the next page is prefetched automatically (always 3 ahead)
 * - FlatList with pagingEnabled snaps each reel to full-screen
 */

import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { flattenReels, usePrefetchNextReelsPage, useReelsFeed } from '@/features/reels/queries';
import { ReelItem } from '@/features/reels/reel-item';
import type { Reel } from '@/features/reels/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsFeedScreen() {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  // Each reel fills exactly the visible area: full screen minus tab bar and safe area bottom
  const reelHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT - insets.bottom;
  // Track whether this tab is focused — passed to ReelItem to gate playback
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false); // runs when tab loses focus
    }, [])
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useReelsFeed();

  const prefetchNext = usePrefetchNextReelsPage();
  const reels = flattenReels(data?.pages);

  // Track which reel is currently visible
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const index = viewableItems[0].index ?? 0;
      setActiveIndex(index);

      // Calculate which page this reel belongs to and prefetch next
      const currentPage = Math.floor(index / 3) + 1;
      const totalPages = data?.pages[data.pages.length - 1]?.meta.totalPages ?? 1;
      const isNearEnd = index >= reels.length - 2;

      // Prefetch next page when user is near the end of current page
      if (isNearEnd && hasNextPage) {
        fetchNextPage();
      }
      // Always keep next page prefetched 3 reels ahead
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
    [activeIndex, reelHeight, isScreenFocused]
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

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.center}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }}
          size={48}
          tintColor={BrandColors.warning}
        />
        <Text style={styles.errorText}>Failed to load reels</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty state
  if (reels.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No reels available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logout button — top right over the feed */}
      <Pressable
        style={[styles.logoutBtn, { top: insets.top + 12 }]}
        onPress={handleLogout}
        accessibilityLabel="Log out"
        accessibilityRole="button">
        <SymbolView
          name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
          size={22}
          tintColor="#fff"
        />
      </Pressable>

      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        snapToInterval={reelHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        ListFooterComponent={ListFooter}
        // Performance tuning
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: reelHeight,
          offset: reelHeight * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSize.base,
  },
  errorText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.base,
  },
  retryBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: {
    color: '#fff',
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.base,
  },
  footerLoader: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
