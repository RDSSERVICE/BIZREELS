/**
 * Reels Feed — TikTok / Instagram style full-screen vertical scroll with e-commerce integration.
 * Each reel fills 100% of the screen height.
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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

import { BrandColors, FontSize, FontWeight } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { flattenReels, usePrefetchNextReelsPage, useReelsFeed } from '@/features/reels/queries';
import { ReelItem } from '@/features/reels/reel-item';
import type { Reel } from '@/features/reels/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsFeedScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // Full screen height so reel fills 100% of the screen
  const reelHeight = SCREEN_HEIGHT;

  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, [])
  );

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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color={BrandColors.warning} />
        <Text style={styles.errorText}>Failed to load reels</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No reels available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Buttons */}
      <View style={[styles.headerActions, { top: insets.top + 12 }]}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.push('/cart')}
          accessibilityLabel="Shopping Cart">
          <Ionicons name="cart" size={20} color="#fff" />
        </Pressable>

        <Pressable
          style={styles.headerBtn}
          onPress={handleLogout}
          accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </Pressable>
      </View>

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
  headerActions: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
