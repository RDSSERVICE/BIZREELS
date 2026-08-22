/**
 * CustomTabBar — Full-width standard native bottom navigation bar.
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
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
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
            <View style={styles.iconContainer}>
              <SymbolView
                name={iconName as any}
                size={25}
                tintColor={active ? BrandColors.primary : 'rgba(255, 255, 255, 0.65)'}
              />

              {tab.name === 'search' && cartTotalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartTotalItems > 99 ? '99+' : cartTotalItems}
                  </Text>
                </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 10,
    paddingHorizontal: Spacing.two,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  tabLabelActive: {
    color: BrandColors.primary,
    fontWeight: FontWeight.bold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: BrandColors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#121212',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
});
