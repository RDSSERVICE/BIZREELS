/**
 * CustomTabBar — Floating reduced-width bottom navigation bar using Ionicons.
 * Clean active selection without square background selectors.
 */

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCart } from '@/features/cart/queries';

const TABS = [
  {
    name: 'home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'index',
    label: 'Reels',
    icon: 'play-circle-outline',
    activeIcon: 'play-circle',
  },
  {
    name: 'studio',
    label: 'Studio',
    icon: 'videocam-outline',
    activeIcon: 'videocam',
  },
  {
    name: 'search',
    label: 'Search',
    icon: 'search-outline',
    activeIcon: 'search',
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
] as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: cart } = useCart();
  const cartTotalItems = cart?.total_items || 0;

  const isVendor = user?.activeRole === 'vendor' || user?.current_role === 'vendor';
  const visibleTabs = TABS.filter((tab) => isVendor || tab.name !== 'studio');

  function getRouteIndex(name: string) {
    return state.routes.findIndex((r) => r.name === name);
  }

  function handlePress(routeName: string) {
    const idx = getRouteIndex(routeName);
    if (idx === -1) return;
    const isFocused = state.index === idx;
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[idx].key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(state.routes[idx].name);
    }
  }

  function isActive(routeName: string) {
    return state.routes[state.index]?.name === routeName;
  }

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.floatingCapsule}>
        {visibleTabs.map((tab) => {
          const active = isActive(tab.name);
          const iconName = active ? tab.activeIcon : tab.icon;

          return (
            <Pressable
              key={tab.name}
              android_ripple={null}
              style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.6 }]}
              onPress={() => handlePress(tab.name)}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName as any}
                  size={22}
                  color={active ? BrandColors.primary : '#9CA3AF'}
                />

                {tab.name === 'search' && cartTotalItems > 0 && (
                  <View style={styles.badge} />
                )}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  floatingCapsule: {
    width: '84%',
    maxWidth: 340,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingVertical: 8,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 26,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: BrandColors.primary,
    fontWeight: FontWeight.bold,
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 2,
    backgroundColor: BrandColors.primary,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: '#18181B',
  },
});
