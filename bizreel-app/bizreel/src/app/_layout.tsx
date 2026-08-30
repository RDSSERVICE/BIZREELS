import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BrandColors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/features/auth/context';
import { queryClient } from '@/lib/query-client';
import { hydrateTokenCache } from '@/lib/storage';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { status, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';
    if (status === 'unauthed' && !inAuthGroup) {
      router.replace('/(auth)/register');
    } else if (status === 'authed') {
      const activeRole = user?.activeRole || user?.current_role || 'customer';
      const isVendor = activeRole === 'vendor';
      const isCreator = activeRole === 'creator';

      const isVendorIncomplete = isVendor && (!user?.vendorProfile || (!(user as any)?.vendorProfile?.shopName && !(user as any)?.vendorProfile?.businessName));
      const isCreatorIncomplete = isCreator && (!user?.creatorProfile || (!(user as any)?.creatorProfile?.displayName && !(user as any)?.creatorProfile?.name));

      if (isVendorIncomplete) {
        router.replace('/vendor/onboarding');
      } else if (isCreatorIncomplete) {
        router.replace('/creator/onboarding');
      } else if (inAuthGroup) {
        router.replace(isVendor || isCreator ? '/(tabs)/home' : '/(tabs)');
      }
    }
  }, [status, segments, user]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.warmBackground }}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateTokenCache().finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BrandColors.warmBackground }}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Animated splash runs once on top of everything, then fades out */}
        <AnimatedSplashOverlay />
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
