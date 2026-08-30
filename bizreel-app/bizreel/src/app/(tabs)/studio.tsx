import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcher } from '@/components/role-switcher';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import VendorReelsScreen from '../vendor/reels/index';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

import CreatorDashboardScreen from '../creator/dashboard';

export default function StudioTabScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const isVendor = activeRole === 'vendor';
  const isCreator = activeRole === 'creator';

  if (isCreator) {
    return <CreatorDashboardScreen />;
  }

  if (!isVendor) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.lockHeader}>
          <View style={styles.lockIconBox}>
            <Ionicons name="videocam-outline" size={32} color={YELLOW} />
          </View>
        </View>

        <Text style={styles.title}>CREATOR & REEL STUDIO</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>
          Exclusive to Creator & Vendor modes. Switch mode to access Creator Studio or Vendor Reels Manager.
        </Text>

        <View style={styles.switcherWrapper}>
          <Text style={styles.switchLabel}>CURRENT MODE</Text>
          <RoleSwitcher />
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={14} color={BLACK} />
          <Text style={styles.homeBtnText}>RETURN TO MARKETPLACE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <VendorReelsScreen />;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  lockHeader: {
    marginBottom: Spacing.two,
  },
  lockIconBox: {
    width: 72,
    height: 72,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 2,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: FontSize.xl || 24,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: YELLOW,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  switcherWrapper: {
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.two,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
  },
  switchLabel: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 0,
  },
  homeBtnText: {
    color: BLACK,
    fontWeight: '900',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
});
