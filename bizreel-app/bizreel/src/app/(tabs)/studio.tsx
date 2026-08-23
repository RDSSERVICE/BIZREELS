import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcher } from '@/components/role-switcher';
import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import VendorReelsScreen from '../vendor/reels/index';

export default function StudioTabScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const isVendor = user?.activeRole === 'vendor' || user?.current_role === 'vendor';

  if (!isVendor) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="videocam-off-outline" size={56} color={BrandColors.primary} />
        <Text style={styles.title}>Reel Studio is Exclusive to Sellers</Text>
        <Text style={styles.subtitle}>
          Switch to Vendor Mode to create, upload, and manage your video reels and catalog.
        </Text>
        <View style={styles.switcherWrapper}>
          <RoleSwitcher />
        </View>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.homeBtnText}>Return to Home Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <VendorReelsScreen />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  switcherWrapper: {
    marginVertical: Spacing.two,
  },
  homeBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 999,
  },
  homeBtnText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
