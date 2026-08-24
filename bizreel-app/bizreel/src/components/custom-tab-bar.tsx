/**
 * CustomTabBar — Classic Brutalist Yellow & Black Bottom Navigation.
 * Sharp edges, thick borders, solid block active state. No pill/rounded softness.
 */

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCart } from '@/features/cart/queries';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_BG = '#18181C';
const BORDER = '#2D2D36';

const TABS = [
  { name: 'home',    label: 'HOME',    icon: 'home-outline',         activeIcon: 'home' },
  { name: 'index',   label: 'REELS',   icon: 'play-circle-outline',  activeIcon: 'play-circle' },
  { name: 'studio',  label: 'STUDIO',  icon: 'videocam-outline',     activeIcon: 'videocam' },
  { name: 'search',  label: 'SEARCH',  icon: 'search-outline',       activeIcon: 'search' },
  { name: 'profile', label: 'ME',      icon: 'person-outline',       activeIcon: 'person' },
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
    <View style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.tabBarRow}>
        {visibleTabs.map((tab, i) => {
          const active = isActive(tab.name);
          const iconName = active ? tab.activeIcon : tab.icon;
          const isLast = i === visibleTabs.length - 1;

          return (
            <Pressable
              key={tab.name}
              android_ripple={null}
              style={({ pressed }) => [
                styles.tabItem,
                active && styles.tabItemActive,
                !isLast && styles.tabItemBorderRight,
                pressed && !active && { opacity: 0.6 },
              ]}
              onPress={() => handlePress(tab.name)}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>

              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconName as any}
                  size={20}
                  color={active ? BLACK : 'rgba(255,255,255,0.45)'}
                />

                {tab.name === 'search' && cartTotalItems > 0 && (
                  <View style={[styles.badge, active && styles.badgeActive]} />
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
    backgroundColor: DARK_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
    backgroundColor: DARK_BG,
  },
  tabItemActive: {
    backgroundColor: YELLOW,
  },
  tabItemBorderRight: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 24,
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    color: BLACK,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: YELLOW,
    width: 7,
    height: 7,
    borderRadius: 0, // brutalist — square badge
    borderWidth: 1,
    borderColor: DARK_BG,
  },
  badgeActive: {
    backgroundColor: BLACK,
    borderColor: YELLOW,
  },
});
