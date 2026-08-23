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
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Video Reels</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => router.push('/vendor/reels/create' as any)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
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
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>Published Video Reels: {reels.length}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.thumbnailUrl || item.mediaUrls?.[0] || item.videoUrl }}
                style={styles.cardThumbnail}
                contentFit="cover"
              />

              <View style={styles.cardInfo}>
                <Text style={styles.cardCaption} numberOfLines={2}>
                  {item.caption || 'Product Highlight Reel'}
                </Text>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBadge}>
                    <Ionicons name="heart" size={12} color="#FF2D55" />
                    <Text style={styles.metricText}>{item.likesCount || 0}</Text>
                  </View>
                  <View style={styles.metricBadge}>
                    <Ionicons name="chatbubble" size={12} color={BrandColors.primaryLight} />
                    <Text style={styles.metricText}>{item.commentsCount || 0}</Text>
                  </View>
                  <View style={styles.metricBadge}>
                    <Ionicons name="eye" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.metricText}>{item.viewsCount || 0}</Text>
                  </View>
                </View>

                {item.isBoosted && (
                  <View style={styles.boostedTag}>
                    <Ionicons name="flame" size={10} color="#fff" />
                    <Text style={styles.boostedText}>Sponsored Boosted</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.boostBtn}
                  onPress={() => handleBoost(item._id)}
                  disabled={boostMutation.isPending}>
                  <Ionicons name="rocket-outline" size={16} color={BrandColors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item._id, item.caption)}>
                  <Ionicons name="trash-outline" size={16} color={BrandColors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={56} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Reels Uploaded</Text>
              <Text style={styles.emptySub}>
                Publish short video reels showcasing your products in action to attract 10x more buyers.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/vendor/reels/create' as any)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.createBtnText}>Upload New Reel</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.three,
  },
  cardThumbnail: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardCaption: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    lineHeight: 16,
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
  },
  metricText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  boostedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  boostedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  cardActions: {
    gap: Spacing.two,
  },
  boostBtn: {
    padding: Spacing.one,
  },
  deleteBtn: {
    padding: Spacing.one,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    gap: 6,
    marginTop: Spacing.two,
  },
  createBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
