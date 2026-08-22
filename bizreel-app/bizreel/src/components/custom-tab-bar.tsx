/**
 * CustomTabBar — bottom nav with four evenly spaced tabs.
 *
 * Layout: Home | Reels | Search | Profile
 */

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';

// Tab definitions in display order
const TABS = [
  {
    name: 'home',
    label: 'Home',
    icon: { ios: 'house', android: 'home', web: 'home' },
  },
  {
    name: 'index',
    label: 'Reels',
    icon: { ios: 'play.rectangle.fill', android: 'play_circle', web: 'play_circle' },
  },
  {
    name: 'search',
    label: 'Search',
    icon: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: { ios: 'person', android: 'person', web: 'person' },
  },
] as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Map route name → index in state.routes
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
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || Spacing.two }]}>
      {TABS.map((tab) => (
        <TabButton
          key={tab.name}
          label={tab.label}
          icon={tab.icon}
          active={isActive(tab.name)}
          onPress={() => handlePress(tab.name)}
        />
      ))}
    </View>
  );
}

// ── Individual tab button ──────────────────────────────────────
interface TabButtonProps {
  label: string;
  icon: { ios: string; android: string; web: string };
  active: boolean;
  onPress: () => void;
}

function TabButton({ label, icon, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tabBtn, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <SymbolView
        name={icon}
        size={24}
        tintColor={active ? BrandColors.primary : '#999'}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#F5EFE6',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD0',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.two,
    gap: 3,
    minWidth: 52,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#999',
  },
  tabLabelActive: {
    color: BrandColors.primary,
    fontWeight: FontWeight.semibold,
  },

});
