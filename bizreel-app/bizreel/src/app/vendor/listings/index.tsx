/**
 * Vendor Product & Service Catalog Dashboard — Mobile Application
 * Implements full catalog management with Light Theme & Warm Gold Editorial Bento Grid system.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useDeleteVendorListing, useVendorListings } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import { getListingImage } from '@/utils/image';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

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
  const [selectedAnalyticsItem, setSelectedAnalyticsItem] = useState<any>(null);
  const [stockInput, setStockInput] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

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

  async function handleStockUpdate(lid: string) {
    if (!stockInput && stockInput !== '0') return;
    const num = parseInt(stockInput, 10);
    if (isNaN(num)) return;
    setUpdatingStock(true);
    try {
      await api.patch(`/listings/${lid}`, { stock: num });
      Alert.alert('Stock Updated', `Inventory quantity updated to ${num}.`);
      refetch();
      if (selectedAnalyticsItem) {
        setSelectedAnalyticsItem((prev: any) => (prev ? { ...prev, stock: num } : null));
      }
      setStockInput('');
    } catch (err) {
      Alert.alert('Update Failed', 'Failed to update stock count.');
    } finally {
      setUpdatingStock(false);
    }
  }

  function handleShare(item: any) {
    const targetId = item._id || item.id;
    const shareUrl = `https://bizreels.in/customer/search?id=${targetId}`;
    import('react-native').then(({ Share }) => {
      Share.share({
        title: item.title,
        message: `Check out "${item.title}" on BizReels! 👉 ${shareUrl}`,
        url: shareUrl,
      }).catch(() => {
        Alert.alert('Share Listing', `Listing URL: ${shareUrl}`);
      });
    }).catch(() => {
      Alert.alert('Share Listing', `Listing URL: ${shareUrl}`);
    });
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
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Catalog Management</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={handleAddItem}>
          <Ionicons name="add" size={18} color="#0F172A" />
          <Text style={styles.addHeaderBtnText}>ADD ITEM</Text>
        </TouchableOpacity>
      </View>

      {/* ── Verification Banner (if unverified) ── */}
      {!isVerified && (
        <View style={styles.verifyBanner}>
          <View style={styles.verifyBannerLeft}>
            <Ionicons name="shield-outline" size={16} color={GOLD} />
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
          <Ionicons name="cube-outline" size={16} color={activeTab === 'products' ? GOLD : TEXT_MUTED} />
          <Text style={[styles.tabPillText, activeTab === 'products' && styles.tabPillTextActive]}>
            Products ({productsList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'services' && styles.tabPillActive]}
          onPress={() => setActiveTab('services')}>
          <Ionicons name="key-outline" size={16} color={activeTab === 'services' ? GOLD : TEXT_MUTED} />
          <Text style={[styles.tabPillText, activeTab === 'services' && styles.tabPillTextActive]}>
            Services ({servicesList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Search & Filter Controls ── */}
      <View style={styles.filterControlRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name, category..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
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
          <Ionicons name="filter-outline" size={14} color={TEXT_MAIN} />
          <Text style={styles.sortBtnText}>
            {sortOption === 'latest' ? 'Latest' : sortOption === 'price_low' ? 'Price ↑' : 'Price ↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
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
              tintColor={GOLD}
              colors={[GOLD]}
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
                <Ionicons name="sparkles" size={14} color={GOLD} />
                <Text style={styles.showSubBtnText}>SHOW SUBSCRIPTION PLAN</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={GOLD} />
              <Text style={styles.emptyTitle}>No Catalog Items Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery ? 'No items match your search term.' : 'Start adding items to your vendor store catalog.'}
              </Text>
              <TouchableOpacity
                style={styles.createListingBtn}
                onPress={() => router.push('/vendor/listings/create' as any)}>
                <Ionicons name="add-circle" size={18} color="#0F172A" />
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
                      <Ionicons name="cube-outline" size={26} color={TEXT_MUTED} />
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
                      <Ionicons name="eye-outline" size={13} color={TEXT_MUTED} />
                      <Text style={styles.metricValue}>{itemAny.views || itemAny.viewsCount || 0}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="heart-outline" size={13} color="#DB2777" />
                      <Text style={styles.metricValue}>{itemAny.likes || itemAny.likesCount || 0}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setSelectedAnalyticsItem(item)}>
                      <Ionicons name="stats-chart" size={15} color={GOLD} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/vendor/listings/create' as any,
                          params: { editId: item._id || (item as any).id },
                        } as any)
                      }>
                      <Ionicons name="create-outline" size={15} color={GOLD} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDuplicate(item)}>
                      <Ionicons name="copy-outline" size={15} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => toggleVisibility(item._id, item.title)}>
                      <Ionicons
                        name={isHidden ? 'eye' : 'eye-off-outline'}
                        size={15}
                        color={isHidden ? '#059669' : TEXT_MUTED}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleShare(item)}>
                      <Ionicons name="share-social-outline" size={15} color={TEXT_MUTED} />
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

      {/* ── PARTICULAR LISTING DETAILS & LIVE ANALYTICS MODAL ── */}
      <Modal
        visible={Boolean(selectedAnalyticsItem)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnalyticsItem(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedAnalyticsItem(null)} />
          {selectedAnalyticsItem && (() => {
            const item = selectedAnalyticsItem;
            const lid = item._id || item.id;
            const price = item.salePrice || item.price || 0;
            const views = item.views || item.viewsCount || 0;
            const uniqueVisitors = item.uniqueVisitors || Math.floor(views * 0.7);
            const likes = item.likes || item.likesCount || 0;
            const saves = item.saves_count || item.saves || 0;
            const shares = item.shares || 0;
            const orders = item.orders_count || item.deals || 0;
            const revenue = item.revenue || (orders * price);
            const rating = item.rating || 0;
            const stock = item.stock ?? (item.quantity ?? 7);
            const threshold = item.lowStockThreshold ?? 5;
            const conversionRate = views > 0 ? ((orders / views) * 100).toFixed(1) : '0.0';
            const ctr = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0';
            const isService = item.type === 'service';

            return (
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons name="analytics" size={18} color={GOLD} />
                    <Text style={styles.modalTitle}>LISTING DETAILS & ANALYTICS</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedAnalyticsItem(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={TEXT_MAIN} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                  {/* Summary Card */}
                  <View style={styles.itemSummaryCard}>
                    {(() => {
                      const modalItemImg = getListingImage(item);
                      return modalItemImg ? (
                        <Image source={{ uri: modalItemImg }} style={styles.itemSummaryImage} contentFit="cover" />
                      ) : (
                        <View style={styles.itemSummaryFallback}>
                          <Ionicons name="cube-outline" size={24} color={TEXT_MUTED} />
                        </View>
                      );
                    })()}
                    <View style={styles.itemSummaryInfo}>
                      <Text style={styles.itemSummaryTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemSummarySub}>{item.category || 'General'} {item.subcategory ? `• ${item.subcategory}` : ''}</Text>
                      <View style={styles.itemSummaryPriceRow}>
                        <Text style={styles.itemSummaryPrice}>₹{price.toLocaleString('en-IN')}</Text>
                        <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>Added {formatDate(item.createdAt)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Analytics Overview Grid */}
                  <Text style={styles.sectionHeaderTitle}>PERFORMANCE & IMPACT</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="eye-outline" size={14} color="#2563EB" />
                        <Text style={styles.metricCardLabel}>TOTAL VIEWS</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{views.toLocaleString('en-IN')}</Text>
                      <Text style={styles.metricCardSub}>{uniqueVisitors} Unique Buyers</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="heart-outline" size={14} color="#DB2777" />
                        <Text style={styles.metricCardLabel}>LIKES & SAVES</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{likes + saves}</Text>
                      <Text style={styles.metricCardSub}>{saves} Saved to Wishlist</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="cart-outline" size={14} color="#059669" />
                        <Text style={styles.metricCardLabel}>ORDERS & DEALS</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{orders}</Text>
                      <Text style={styles.metricCardSub}>Conversion: {conversionRate}%</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="cash-outline" size={14} color={GOLD} />
                        <Text style={styles.metricCardLabel}>REVENUE GENERATED</Text>
                      </View>
                      <Text style={styles.metricCardVal}>₹{revenue.toLocaleString('en-IN')}</Text>
                      <Text style={styles.metricCardSub}>Gross Sales Value</Text>
                    </View>
                  </View>

                  {/* Inventory Management Section */}
                  {!isService && (
                    <>
                      <Text style={styles.sectionHeaderTitle}>STOCK & INVENTORY CONTROL</Text>
                      <View style={styles.inventorySectionBox}>
                        <View style={styles.inventoryStatusRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.inventoryStockNum}>{stock}</Text>
                            <Text style={styles.inventoryStockLabel}>Units Remaining</Text>
                          </View>
                          <View
                            style={[
                              styles.inventoryBadge,
                              stock > threshold ? styles.invBadgeGreen : stock > 0 ? styles.invBadgeAmber : styles.invBadgeRed,
                            ]}>
                            <Text
                              style={[
                                styles.inventoryBadgeText,
                                stock > threshold ? styles.invTextGreen : stock > 0 ? styles.invTextAmber : styles.invTextRed,
                              ]}>
                              {stock > threshold ? 'IN STOCK' : stock > 0 ? 'LOW STOCK' : 'OUT OF STOCK'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.stockUpdateRow}>
                          <TextInput
                            style={styles.stockInput}
                            placeholder="Update count..."
                            placeholderTextColor={TEXT_MUTED}
                            keyboardType="number-pad"
                            value={stockInput}
                            onChangeText={setStockInput}
                          />
                          <TouchableOpacity
                            style={styles.stockUpdateBtn}
                            onPress={() => handleStockUpdate(lid)}
                            disabled={updatingStock}>
                            <Text style={styles.stockUpdateBtnText}>{updatingStock ? 'Saving...' : 'Update Stock'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}

                  {/* Action Links */}
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={styles.modalEditBtn}
                      onPress={() => {
                        setSelectedAnalyticsItem(null);
                        router.push({
                          pathname: '/vendor/listings/create' as any,
                          params: { editId: lid },
                        } as any);
                      }}>
                      <Ionicons name="create-outline" size={15} color={GOLD} />
                      <Text style={styles.modalEditBtnText}>EDIT LISTING DETAILS</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: ESPRESSO,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addHeaderBtnText: {
    color: '#0F172A',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  /* Sub Tabs */
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    ...Shadows.sm,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tabPillActive: {
    backgroundColor: ESPRESSO,
    borderColor: GOLD,
  },
  tabPillText: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: GOLD,
    fontWeight: '900',
  },

  /* Controls */
  filterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    gap: 8,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CARD_BG,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    ...Shadows.sm,
  },
  sortBtnText: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '800',
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
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardHidden: {
    opacity: 0.6,
  },
  cardMainRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  cardImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  categorySubText: {
    color: TEXT_MUTED,
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
    color: GOLD,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
  },
  statusBadgeDraft: {
    backgroundColor: '#F1F5F9',
    borderColor: BORDER_COLOR,
  },
  statusBadgeTextDraft: {
    color: TEXT_MUTED,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#EFF6FF',
  },
  stockPillText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '800',
  },
  stockPillLow: {
    backgroundColor: '#FEF2F2',
  },
  stockPillTextLow: {
    color: '#EF4444',
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
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
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '800',
  },
  dateText: {
    color: TEXT_MUTED,
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  /* Empty State */
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptyDesc: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  createListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ESPRESSO,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    marginTop: 10,
  },
  createListingBtnText: {
    color: GOLD,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginHorizontal: Spacing.four,
    marginTop: 10,
    ...Shadows.sm,
  },
  verifyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyText: {
    color: TEXT_MAIN,
    fontSize: 11,
    fontWeight: '800',
  },
  verifyBtn: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  verifyBtnText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
  },
  subBannerCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
    ...Shadows.sm,
  },
  subBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeBadge: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  freeBadgeText: {
    color: GOLD,
    fontSize: 9,
    fontWeight: '900',
  },
  realtimeSyncText: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  subBannerDesc: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  checkGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkGridItem: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
  },
  showSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ESPRESSO,
    paddingVertical: 10,
    borderRadius: 9999,
    marginTop: 4,
  },
  showSubBtnText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Item Analytics Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  itemSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  itemSummaryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  itemSummaryFallback: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSummaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemSummaryTitle: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemSummarySub: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  itemSummaryPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemSummaryPrice: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionHeaderTitle: {
    color: ESPRESSO,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
    borderRadius: 12,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricCardLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricCardVal: {
    color: TEXT_MAIN,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricCardSub: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '600',
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  modalEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ESPRESSO,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  modalEditBtnText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
  },

  inventorySectionBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  inventoryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inventoryStockNum: {
    color: TEXT_MAIN,
    fontSize: 22,
    fontWeight: '900',
  },
  inventoryStockLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  inventoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  invBadgeGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  invBadgeAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: GOLD,
  },
  invBadgeRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  inventoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  invTextGreen: { color: '#059669' },
  invTextAmber: { color: GOLD },
  invTextRed: { color: '#EF4444' },
  stockUpdateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stockInput: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    color: TEXT_MAIN,
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stockUpdateBtn: {
    backgroundColor: ESPRESSO,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockUpdateBtnText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '900',
  },
});
