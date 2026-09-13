/**
 * Vendor Video Reels Management Dashboard — View & Manage published reels.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useBoostReel, useDeleteReel, useMyReels } from '@/features/reels/queries';

export default function VendorReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: reels = [], isLoading, isRefetching, refetch } = useMyReels();
  const deleteMutation = useDeleteReel();
  const boostMutation = useBoostReel();

  function handleDelete(id: string, caption?: string) {
    Alert.alert('Delete Reel', `Are you sure you want to delete this reel?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => Alert.alert('Deleted', 'Reel removed successfully.'),
          });
        },
      },
    ]);
  }

  function handleBoost(id: string) {
    boostMutation.mutate(id, {
      onSuccess: () => Alert.alert('Boosted!', 'Reel has been boosted for higher visibility.'),
      onError: (err: any) => Alert.alert('Boost Failed', err.message),
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#1E1B18" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Reels Studio</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.analyticsHeaderBtn}
            onPress={() => router.push('/vendor/dashboard' as any)}>
            <Ionicons name="bar-chart" size={18} color="#D99A3D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => router.push('/vendor/reels/create' as any)}>
            <Ionicons name="add" size={20} color="#D99A3D" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D99A3D" />
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#D99A3D"
              colors={['#D99A3D']}
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>Published Video Reels: {reels.length}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMainTouch}
                onPress={() =>
                  router.push({
                    pathname: '/reel/[id]',
                    params: { id: item._id, videoUrl: item.videoUrl || item.mediaUrls?.[0] || '' },
                  } as any)
                }>
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: item.thumbnailUrl || item.mediaUrls?.[0] || item.videoUrl }}
                    style={styles.cardThumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.playOverlayIcon}>
                    <Ionicons name="play" size={14} color="#fff" />
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardCaption} numberOfLines={2}>
                    {item.caption || 'Product Highlight Reel'}
                  </Text>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricBadge}>
                      <Ionicons name="heart" size={11} color="#FF2D55" />
                      <Text style={styles.metricText}>{item.likesCount || 0}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Ionicons name="chatbubble" size={11} color="#D99A3D" />
                      <Text style={styles.metricText}>{item.commentsCount || 0}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <Ionicons name="eye" size={11} color="#6E675F" />
                      <Text style={styles.metricText}>{(item as any).views ?? item.viewsCount ?? (item as any).views_count ?? 0}</Text>
                    </View>
                  </View>

                  {item.isBoosted && (
                    <View style={styles.boostedTag}>
                      <Ionicons name="flame" size={10} color="#1E1B18" />
                      <Text style={styles.boostedText}>Sponsored Boosted</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.playActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/reel/[id]',
                      params: { id: item._id, videoUrl: item.videoUrl || item.mediaUrls?.[0] || '' },
                    } as any)
                  }>
                  <Ionicons name="play-circle" size={15} color="#D99A3D" />
                  <Text style={styles.playActionBtnText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.boostBtn}
                  onPress={() => handleBoost(item._id)}
                  disabled={boostMutation.isPending}>
                  <Ionicons name="rocket-outline" size={15} color="#D99A3D" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item._id, item.caption)}>
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={56} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Reels Uploaded</Text>
              <Text style={styles.emptySub}>
                Publish short video reels showcasing your products in action to attract 10x more buyers.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/vendor/reels/create' as any)}>
                <Ionicons name="add" size={16} color="#D99A3D" />
                <Text style={styles.createBtnText}>Upload New Reel</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_MATTE = '#F6F4EE';
const CARD_MATTE = '#FBF9F5';
const INSET_MATTE = '#F0EDE4';
const BORDER_MATTE = '#E5E0D4';
const TEXT_MAIN = '#1E1B18';
const TEXT_MUTED = '#6E675F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_MATTE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: CARD_MATTE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_MATTE,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  analyticsHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: INSET_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ESPRESSO,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  summaryBar: {
    marginBottom: Spacing.two,
  },
  summaryText: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_MATTE,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    gap: Spacing.three,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 60,
    height: 90,
  },
  cardThumbnail: {
    width: 60,
    height: 90,
    borderRadius: 10,
    backgroundColor: INSET_MATTE,
  },
  playOverlayIcon: {
    position: 'absolute',
    top: 33,
    left: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(36,27,21,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardCaption: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '800',
    lineHeight: 17,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 4,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: INSET_MATTE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricText: {
    color: TEXT_MAIN,
    fontSize: 10,
    fontWeight: '800',
  },
  boostedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 3,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  boostedText: {
    color: '#1E1B18',
    fontSize: 9.5,
    fontWeight: '900',
  },
  cardActions: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  playActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ESPRESSO,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: GOLD,
  },
  playActionBtnText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
  },
  boostBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: INSET_MATTE,
    borderWidth: 1,
    borderColor: BORDER_MATTE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  emptySub: {
    color: TEXT_MUTED,
    fontSize: FontSize.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESPRESSO,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: GOLD,
    gap: 6,
    marginTop: Spacing.two,
  },
  createBtnText: {
    color: GOLD,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
});
