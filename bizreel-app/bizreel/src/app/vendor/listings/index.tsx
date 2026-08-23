/**
 * Vendor Product & Service Catalog Dashboard.
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
import { useDeleteVendorListing, useVendorListings } from '@/features/vendor-listings/queries';
import { getListingImage } from '@/utils/image';

export default function VendorCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: listings = [], isLoading, isRefetching, refetch } = useVendorListings();
  const deleteMutation = useDeleteVendorListing();

  function handleDelete(id: string, title: string) {
    Alert.alert('Delete Listing', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => Alert.alert('Deleted', 'Listing removed successfully.'),
          });
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product & Service Catalog</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => router.push('/vendor/listings/create')}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={listings}
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
              <Text style={styles.summaryText}>Total Catalog Items: {listings.length}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const image = getListingImage(item);
            const price = item.salePrice || item.price || 0;

            return (
              <View style={styles.card}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={styles.cardImageFallback}>
                    <Ionicons name="cube-outline" size={28} color="rgba(255,255,255,0.4)" />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {(item as any).category_type || item.type || 'product'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                  <Text style={styles.priceText}>₹{price}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item._id, item.title)}>
                  <Ionicons name="trash-outline" size={18} color={BrandColors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={56} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Listings Yet</Text>
              <Text style={styles.emptySub}>
                Start building your store catalog by adding your products and services.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/vendor/listings/create')}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.createBtnText}>Add Product or Service</Text>
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
  cardImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  cardImageFallback: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: BrandColors.primaryLight,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  categoryText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  priceText: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  deleteBtn: {
    padding: Spacing.two,
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
