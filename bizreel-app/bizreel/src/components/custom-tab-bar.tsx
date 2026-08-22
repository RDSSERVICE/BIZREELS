/**
 * CustomTabBar — Pure icon symbols bottom navigation bar (Instagram / TikTok style).
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, Spacing } from '@/constants/theme';
import { useCart } from '@/features/cart/queries';

const TABS = [
  {
    name: 'home',
    label: 'Home',
    icon: 'house',
    activeIcon: 'house.fill',
  },
  {
    name: 'index',
    label: 'Reels',
    icon: 'play.rectangle',
    activeIcon: 'play.rectangle.fill',
  },
  {
    name: 'search',
    label: 'Search',
    icon: 'magnifyingglass',
    activeIcon: 'magnifyingglass',
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person',
    activeIcon: 'person.fill',
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
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
              <SymbolView
                name={iconName as any}
                size={26}
                tintColor={active ? BrandColors.primary : 'rgba(255, 255, 255, 0.65)'}
              />

              {tab.name === 'search' && cartTotalItems > 0 && (
                <View style={styles.badge} />
              )}
            </View>
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
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 38,
    borderRadius: 19,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 6,
    backgroundColor: BrandColors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#121212',
  },
});
