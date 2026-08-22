/**
 * CustomTabBar — Cross-platform bottom navigation bar using Ionicons.
 * Guarantees 100% visibility on Android, iOS & Web.
 */

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
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
  const { data: cart } = useCart();
  const cartTotalItems = cart?.total_items || 0;

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
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = isActive(tab.name);
        const iconName = active ? tab.activeIcon : tab.icon;

        return (
          <Pressable
            key={tab.name}
            style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.7 }]}
            onPress={() => handlePress(tab.name)}
            accessibilityLabel={tab.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <View style={[styles.iconWrapper, active && styles.iconWrapperActive]}>
              <Ionicons
                name={iconName as any}
                size={24}
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
  );
}

const styles = StyleSheet.create({
  barContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181B',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: BrandColors.primary,
    fontWeight: FontWeight.bold,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 8,
    backgroundColor: BrandColors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#18181B',
  },
});
