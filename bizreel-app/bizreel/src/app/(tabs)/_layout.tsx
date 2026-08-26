/**
 * Tabs layout — 5 tabs with custom floating pill tab bar.
 * Left/right swipe anywhere switches tabs via GestureDetector.
 *
 * Tab order: home | index (Reels) | [logo center] | search | profile
 */

import { Tabs, useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { CustomTabBar } from '@/components/custom-tab-bar';

// Tab route names in order — must match file names exactly
const TAB_ORDER = ['home', 'index', 'studio', 'search', 'profile'] as const;
type TabName = typeof TAB_ORDER[number];

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Determine currently active tab index
  const currentTab = (segments[1] as TabName) || 'home';
  const currentIndex = TAB_ORDER.indexOf(currentTab as TabName);

  // Swipe left → next tab, swipe right → previous tab
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(50)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) < Math.abs(e.velocityY)) return; // ignore vertical swipes
      if (e.velocityX < -300) {
        // Swipe left → go to next tab
        const next = TAB_ORDER[Math.min(currentIndex + 1, TAB_ORDER.length - 1)];
        if (next !== currentTab) router.navigate(`/(tabs)/${next === 'index' ? '' : next}`);
      } else if (e.velocityX > 300) {
        // Swipe right → go to previous tab
        const prev = TAB_ORDER[Math.max(currentIndex - 1, 0)];
        if (prev !== currentTab) router.navigate(`/(tabs)/${prev === 'index' ? '' : prev}`);
      }
    });

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.root}>
          <Tabs
            initialRouteName="home"
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="home" options={{ title: 'Home' }} />
            <Tabs.Screen name="index" options={{ title: 'Reels' }} />
            <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
            <Tabs.Screen name="search" options={{ title: 'Search' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
            {/* Hide explore from tab bar but keep it routable */}
            <Tabs.Screen name="explore" options={{ href: null }} />
          </Tabs>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
