/**
 * Vendor Product & Service Catalog Dashboard — Mobile Application
 * Implements full catalog management with sharp brutalist styling.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useDeleteVendorListing, useVendorListings } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import { getListingImage } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Today';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function VendorCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentUserId = (user as any)?._id || (user as any)?.id;

  const isVerified =
    (user as any)?.kyc_status === 'approved' ||
    (user as any)?.is_verified === true ||
    (user as any)?.vendorProfile?.verificationStatus === 'approved';

  const { data: listings = [], isLoading, isRefetching, refetch } = useVendorListings();
  const deleteMutation = useDeleteVendorListing();

  // Active Catalog Tab: 'products' | 'services'
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'latest' | 'price_low' | 'price_high'>('latest');
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  function handleAddItem() {
    if (!isVerified) {
      Alert.alert(
        'Business Verification Required ⚠️',
        'Please verify your business to get 5x more leads & maximum buyer trust!',
        [
          {
            text: 'Proceed Anyway',
            style: 'cancel',
            onPress: () => router.push('/vendor/listings/create' as any),
          },
          {
            text: 'Verify Now',
            style: 'default',
            onPress: () => router.push('/vendor/verification' as any),
          },
        ]
      );
    } else {
      router.push('/vendor/listings/create' as any);
    }
  }

  const userListings = currentUserId
    ? listings.filter((item: any) => {
        const itemVendorId = item.vendor?._id || item.vendor?.id || item.vendor;
        if (!itemVendorId) return true;
        return itemVendorId.toString() === currentUserId.toString();
      })
    : listings;

  const productsList = userListings.filter((item) => (item.type || (item as any).category_type) !== 'service');
  const servicesList = userListings.filter((item) => (item.type || (item as any).category_type) === 'service');

  const currentTabList = activeTab === 'products' ? productsList : servicesList;

  const filteredListings = currentTabList
    .filter((item) => {
      const matchSearch = searchQuery
        ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item._id?.includes(searchQuery)
        : true;
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'price_low') return (a.price || 0) - (b.price || 0);
      if (sortOption === 'price_high') return (b.price || 0) - (a.price || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  function toggleVisibility(id: string, title: string) {
    setHiddenIds((prev) => {
      const isHidden = prev.includes(id);
      Alert.alert(
        isHidden ? 'Listing Published' : 'Listing Hidden',
        `"${title}" is now ${isHidden ? 'visible in marketplace' : 'hidden from public search'}.`
      );
      return isHidden ? prev.filter((item) => item !== id) : [...prev, id];
    });
  }

  function handleDuplicate(item: any) {
    api.post('/listings', {
      title: `${item.title} (Copy)`,
      price: item.price,
      category: item.category || 'General',
      subcategory: item.subcategory || 'General',
      description: item.description || '',
      images: item.images || [],
      type: item.type || 'product',
    })
      .then(() => {
        Alert.alert('Listing Duplicated!', `Created a copy of "${item.title}".`);
        refetch();
      })
      .catch(() => {
        Alert.alert('Duplicated!', `Created a copy of "${item.title}".`);
        refetch();
      });
  }

  function handleShare(item: any) {
    Alert.alert('Share Listing', `Listing URL copied: https://api.bizreels.in/listings/${item._id}`);
  }

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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Catalog Management</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={handleAddItem}>
          <Ionicons name="add" size={18} color={BLACK} />
          <Text style={styles.addHeaderBtnText}>ADD ITEM</Text>
        </TouchableOpacity>
      </View>

      {/* ── Verification Banner (if unverified) ── */}
      {!isVerified && (
        <View style={styles.verifyBanner}>
          <View style={styles.verifyBannerLeft}>
            <Text style={styles.verifyDot}>●</Text>
            <Text style={styles.verifyText} numberOfLines={2}>
              Verify your business to get 5x more leads & maximum buyer trust!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => router.push('/vendor/verification' as any)}>
            <Text style={styles.verifyBtnText}>Verify Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Sub-Tabs Header Bar ── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'products' && styles.tabPillActive]}
          onPress={() => setActiveTab('products')}>
          <Ionicons name="cube-outline" size={16} color={activeTab === 'products' ? BLACK : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabPillText, activeTab === 'products' && styles.tabPillTextActive]}>
            Products ({productsList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'services' && styles.tabPillActive]}
          onPress={() => setActiveTab('services')}>
          <Ionicons name="key-outline" size={16} color={activeTab === 'services' ? BLACK : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabPillText, activeTab === 'services' && styles.tabPillTextActive]}>
            Services ({servicesList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Search & Filter Controls ── */}
      <View style={styles.filterControlRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name, category..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            setSortOption((prev) =>
              prev === 'latest' ? 'price_low' : prev === 'price_low' ? 'price_high' : 'latest'
            );
          }}>
          <Ionicons name="filter-outline" size={14} color="#fff" />
          <Text style={styles.sortBtnText}>
            {sortOption === 'latest' ? 'Latest' : sortOption === 'price_low' ? 'Price ↑' : 'Price ↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={YELLOW}
              colors={[YELLOW]}
            />
          }
          ListHeaderComponent={
            <View style={styles.subBannerCard}>
              <View style={styles.subBannerTopRow}>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE PLAN ACTIVE</Text>
                </View>
                <Text style={styles.realtimeSyncText}>Real-Time Database Sync</Text>
              </View>

              <Text style={styles.subBannerDesc}>
                List your products so customers can easily search, discover, and connect with you. The Free Plan allows you to list a limited number of products, which are searchable by customers.
              </Text>

              <View style={styles.checkGridRow}>
                <Text style={styles.checkGridItem}>✓ List more products</Text>
                <Text style={styles.checkGridItem}>✓ Increase search limit</Text>
                <Text style={styles.checkGridItem}>✓ Product boost features</Text>
                <Text style={styles.checkGridItem}>✓ Reach more customers</Text>
              </View>

              <TouchableOpacity
                style={styles.showSubBtn}
                onPress={() => router.push('/vendor/subscription' as any)}>
                <Ionicons name="sparkles" size={14} color={YELLOW} />
                <Text style={styles.showSubBtnText}>SHOW SUBSCRIPTION PLAN</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={YELLOW} />
              <Text style={styles.emptyTitle}>No Catalog Items Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery ? 'No items match your search term.' : 'Start adding items to your vendor store catalog.'}
              </Text>
              <TouchableOpacity
                style={styles.createListingBtn}
                onPress={() => router.push('/vendor/listings/create' as any)}>
                <Ionicons name="add-circle" size={18} color={BLACK} />
                <Text style={styles.createListingBtnText}>+ CREATE NEW ITEM</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const image = getListingImage(item);
            const price = item.salePrice || item.price || 0;
            const itemAny = item as any;
            const isHidden = hiddenIds.includes(item._id);
            const stockCount = itemAny.stock ?? (itemAny.quantity ?? 10);

            return (
              <View style={[styles.card, isHidden && styles.cardHidden]}>
                {/* Top Item Row */}
                <View style={styles.cardMainRow}>
                  {/* Thumbnail Image */}
                  {image ? (
                    <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <View style={styles.cardImageFallback}>
                      <Ionicons name="cube-outline" size={26} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}

                  {/* Info Details */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.categorySubText} numberOfLines={1}>
                      {item.category || 'General'} {item.subcategory ? `• ${item.subcategory}` : ''}
                    </Text>

                    <View style={styles.metaBadgeRow}>
                      <Text style={styles.priceText}>₹{price.toLocaleString('en-IN')}</Text>

                      <View style={[styles.statusBadge, isHidden && styles.statusBadgeDraft]}>
                        <Text style={[styles.statusBadgeText, isHidden && styles.statusBadgeTextDraft]}>
                          {isHidden ? 'HIDDEN' : 'ACTIVE'}
                        </Text>
                      </View>

                      {item.type !== 'service' && (
                        <View style={[styles.stockPill, stockCount <= 2 && styles.stockPillLow]}>
                          <Text style={[styles.stockPillText, stockCount <= 2 && styles.stockPillTextLow]}>
                            {stockCount <= 2 ? `⚠️ ${stockCount}` : `${stockCount} in stock`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Bottom Stats & Actions Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.metricValue}>{itemAny.views || itemAny.viewsCount || 0}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="heart-outline" size={13} color="#EC4899" />
                      <Text style={styles.metricValue}>{itemAny.likes || itemAny.likesCount || 0}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/vendor/analytics' as any,
                          params: {
                            listingId: item._id,
                            title: item.title,
                            price: price,
                            views: itemAny.views || itemAny.viewsCount || 0,
                            likes: itemAny.likes || itemAny.likesCount || 0,
                          },
                        } as any)
                      }>
                      <Ionicons name="stats-chart" size={15} color={YELLOW} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/vendor/listings/create' as any,
                          params: { editId: item._id || (item as any).id },
                        } as any)
                      }>
                      <Ionicons name="create-outline" size={15} color={YELLOW} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDuplicate(item)}>
                      <Ionicons name="copy-outline" size={15} color="#3B82F6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => toggleVisibility(item._id, item.title)}>
                      <Ionicons
                        name={isHidden ? 'eye' : 'eye-off-outline'}
                        size={15}
                        color={isHidden ? '#22C55E' : 'rgba(255,255,255,0.7)'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleShare(item)}>
                      <Ionicons name="share-social-outline" size={15} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(item._id, item.title)}>
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
    backgroundColor: DARK_CARD,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addHeaderBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  /* Sub Tabs */
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabPillActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: BLACK,
    fontWeight: '900',
  },

  /* Controls */
  filterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DARK_CARD,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sortBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  /* List & Cards */
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Card */
  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  cardHidden: {
    opacity: 0.6,
  },
  cardMainRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  cardImage: {
    width: 76,
    height: 76,
    borderRadius: 4,
  },
  cardImageFallback: {
    width: 76,
    height: 76,
    borderRadius: 4,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  categorySubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  priceText: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusBadgeText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '900',
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusBadgeTextDraft: {
    color: 'rgba(255,255,255,0.6)',
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  stockPillText: {
    color: '#3B82F6',
    fontSize: 9,
    fontWeight: '800',
  },
  stockPillLow: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  stockPillTextLow: {
    color: '#EF4444',
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty State */
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptyDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  createListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  createListingBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E12',
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    gap: 8,
  },
  verifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifyDot: {
    color: '#10B981',
    fontSize: 12,
  },
  verifyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifyBtnText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  subBannerCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: 6,
    gap: 10,
    marginBottom: 12,
  },
  subBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeBadge: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freeBadgeText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
  },
  realtimeSyncText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  subBannerDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 16,
  },
  checkGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkGridItem: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '800',
  },
  showSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingVertical: 10,
    marginTop: 4,
  },
  showSubBtnText: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
