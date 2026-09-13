/**
 * CustomTabBar — Bottom Navigation with illuminated selected icon.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCart } from '@/features/cart/queries';

export interface BottomTabBarProps {
  state: any;
  navigation: any;
  descriptors?: any;
  insets?: any;
}

const ACCENT_GOLD = '#D99A3D';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#94A3B8';
const BG_WHITE = '#FFFFFF';
const BORDER = '#E2E8F0';

const TABS = [
  { name: 'home',             label: 'Home',     icon: 'home-outline',         activeIcon: 'home',             forRole: 'all' },
  { name: 'index',            label: 'Reels',    icon: 'play-circle-outline',  activeIcon: 'play-circle',      forRole: 'customer' },
  { name: 'studio',           label: 'Studio',   icon: 'videocam-outline',     activeIcon: 'videocam',         forRole: 'vendor' },
  { name: 'search',           label: 'Search',   icon: 'search-outline',       activeIcon: 'search',           forRole: 'customer' },
  { name: 'profile',          label: 'Profile',  icon: 'person-outline',       activeIcon: 'person',           forRole: 'all' },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: cart } = useCart();
  const cartTotalItems = cart?.total_items || 0;

  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const isVendor = activeRole === 'vendor';
  const isCreator = activeRole === 'creator';

  const visibleTabs = TABS.filter((tab) => {
    if (tab.forRole === 'vendor') return isVendor || isCreator;
    if (tab.forRole === 'customer') return !isVendor && !isCreator;
    return true;
  });

  function getRouteIndex(name: string) {
    return state.routes.findIndex((r: { name: string }) => r.name === name);
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

  const bottomInset = Math.max(insets.bottom, 6);

  return (
    <View style={[styles.outerContainer, { paddingBottom: bottomInset }]} pointerEvents="box-none">
      <View style={styles.tabBarRow}>
        {visibleTabs.map((tab) => {
          const active = isActive(tab.name);
          const iconName = active ? tab.activeIcon : tab.icon;

          return (
            <Pressable
              key={tab.name}
              android_ripple={null}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && !active && { opacity: 0.7 },
              ]}
              onPress={() => handlePress(tab.name)}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>

              {/* Illuminated Icon Container */}
              <View style={[styles.iconWrapper, active && styles.iconWrapperIlluminated]}>
                <Ionicons
                  name={iconName as any}
                  size={active ? 20 : 18}
                  color={active ? ACCENT_GOLD : TEXT_MUTED}
                />

                {/* Illuminated Top Indicator Bar */}
                {active && <View style={styles.illuminatedBar} />}

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

const BG_MATTE = '#FBF9F5';
const BORDER_MATTE = '#E5E0D4';

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG_MATTE,
    borderTopWidth: 1,
    borderTopColor: BORDER_MATTE,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 6,
  },
  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    paddingHorizontal: 8,
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
    width: 42,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconWrapperIlluminated: {
    backgroundColor: '#241B15',
    borderColor: ACCENT_GOLD,
    shadowColor: ACCENT_GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  illuminatedBar: {
    position: 'absolute',
    top: -2,
    width: 13,
    height: 2,
    borderRadius: Radius.full,
    backgroundColor: ACCENT_GOLD,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabLabelActive: {
    color: '#1E1B18',
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 3,
    backgroundColor: '#EF4444',
    width: 7.5,
    height: 7.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BG_MATTE,
  },
});

