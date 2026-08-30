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

import { useAuth } from '@/features/auth/context';

const CUSTOMER_TAB_ORDER = ['home', 'index', 'search', 'profile'] as const;
const VENDOR_TAB_ORDER = ['home', 'studio', 'profile'] as const;
const CREATOR_TAB_ORDER = ['home', 'studio', 'profile'] as const;

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();

  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const isVendor = activeRole === 'vendor';
  const isCreator = activeRole === 'creator';

  const isVendorIncomplete = isVendor && (!user?.vendorProfile || (!(user as any)?.vendorProfile?.shopName && !(user as any)?.vendorProfile?.businessName));
  if (isVendorIncomplete) {
    router.replace('/vendor/onboarding');
  }

  const isCreatorIncomplete = isCreator && (!user?.creatorProfile || (!(user as any)?.creatorProfile?.displayName && !(user as any)?.creatorProfile?.name));
  if (isCreatorIncomplete) {
    router.replace('/creator/onboarding');
  }

  const tabOrder = isVendor ? VENDOR_TAB_ORDER : isCreator ? CREATOR_TAB_ORDER : CUSTOMER_TAB_ORDER;

  // Determine currently active tab index
  const currentTab = (segments[1] as string) || (isVendor || isCreator ? 'home' : 'index');

  // Route guard: if vendor or creator is on index (reels) or search, redirect to home
  if ((isVendor || isCreator) && (currentTab === 'index' || currentTab === 'search')) {
    router.replace('/(tabs)/home');
  }

  const currentIndex = tabOrder.indexOf(currentTab as any);

  // Swipe left → next tab, swipe right → previous tab
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(50)
    .onEnd((e) => {
      if (Math.abs(e.velocityX) < Math.abs(e.velocityY)) return; // ignore vertical swipes
      const validIndex = currentIndex === -1 ? 0 : currentIndex;
      if (e.velocityX < -300) {
        // Swipe left → go to next tab
        const next = tabOrder[Math.min(validIndex + 1, tabOrder.length - 1)];
        if (next !== currentTab) router.navigate(`/(tabs)/${next === 'index' ? '' : next}` as any);
      } else if (e.velocityX > 300) {
        // Swipe right → go to previous tab
        const prev = tabOrder[Math.max(validIndex - 1, 0)];
        if (prev !== currentTab) router.navigate(`/(tabs)/${prev === 'index' ? '' : prev}` as any);
      }
    });

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.root}>
          <Tabs
            initialRouteName={isVendor || isCreator ? 'home' : 'index'}
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="home" options={{ title: 'Home' }} />
            <Tabs.Screen name="index" options={{ title: 'Reels' }} />
            <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
            <Tabs.Screen name="post-requirement" options={{ href: null }} />
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
