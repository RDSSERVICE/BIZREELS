import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcher } from '@/components/role-switcher';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import VendorReelsScreen from '../vendor/reels/index';

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
            <Ionicons name="videocam" size={32} color={YELLOW} />
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
          <Ionicons name="arrow-back" size={14} color={YELLOW} />
          <Text style={styles.homeBtnText}>RETURN TO MARKETPLACE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <VendorReelsScreen />;
}

const YELLOW = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_MATTE = '#F6F4EE';
const CARD_MATTE = '#FBF9F5';
const BORDER_MATTE = '#E5E0D4';
const TEXT_MAIN = '#1E1B18';
const TEXT_MUTED = '#6E675F';

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: BG_MATTE,
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
    borderRadius: 36,
    backgroundColor: ESPRESSO,
    borderWidth: 2,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    color: TEXT_MAIN,
    fontSize: FontSize.xl || 24,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 9999,
    backgroundColor: YELLOW,
  },
  subtitle: {
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  switcherWrapper: {
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.two,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    backgroundColor: CARD_MATTE,
    padding: Spacing.three,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  switchLabel: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ESPRESSO,
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: YELLOW,
  },
  homeBtnText: {
    color: YELLOW,
    fontWeight: '900',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
});
