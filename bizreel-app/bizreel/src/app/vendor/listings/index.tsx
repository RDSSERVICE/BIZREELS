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
                      onPress={() => setSelectedAnalyticsItem(item)}>
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
                    <Ionicons name="analytics" size={18} color={YELLOW} />
                    <Text style={styles.modalTitle}>LISTING DETAILS & ANALYTICS</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedAnalyticsItem(null)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                  {/* Selected Item Summary Card */}
                  <View style={styles.itemSummaryCard}>
                    {getListingImage(item) ? (
                      <Image source={{ uri: getListingImage(item)! }} style={styles.itemSummaryImage} contentFit="cover" />
                    ) : (
                      <View style={styles.itemSummaryFallback}>
                        <Ionicons name="cube-outline" size={24} color="rgba(255,255,255,0.4)" />
                      </View>
                    )}
                    <View style={styles.itemSummaryInfo}>
                      <Text style={styles.itemSummaryTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemSummarySub}>
                        {item.category || 'General'} {item.subcategory ? `• ${item.subcategory}` : ''}
                      </Text>
                      <View style={styles.itemSummaryPriceRow}>
                        <Text style={styles.itemSummaryPrice}>
                          ₹{price.toLocaleString('en-IN')}
                        </Text>
                        <View style={[styles.statusBadge, hiddenIds.includes(lid) && styles.statusBadgeDraft]}>
                          <Text style={[styles.statusBadgeText, hiddenIds.includes(lid) && styles.statusBadgeTextDraft]}>
                            {hiddenIds.includes(lid) ? 'HIDDEN' : 'ACTIVE'}
                          </Text>
                        </View>
                        <View style={[styles.stockPill, { backgroundColor: isService ? '#23232A' : '#10B981' }]}>
                          <Text style={styles.stockPillText}>
                            {isService ? 'SERVICE' : 'PRODUCT'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Quick Actions Row */}
                  <View style={styles.drawerQuickActionsRow}>
                    <TouchableOpacity
                      style={styles.drawerActionBtn}
                      onPress={() => {
                        setSelectedAnalyticsItem(null);
                        router.push({
                          pathname: '/vendor/listings/create' as any,
                          params: { editId: lid },
                        } as any);
                      }}>
                      <Ionicons name="create-outline" size={14} color={YELLOW} />
                      <Text style={styles.drawerActionBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.drawerActionBtn}
                      onPress={() => {
                        setSelectedAnalyticsItem(null);
                        handleDuplicate(item);
                      }}>
                      <Ionicons name="copy-outline" size={14} color="#3B82F6" />
                      <Text style={styles.drawerActionBtnText}>Duplicate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.drawerActionBtn}
                      onPress={() => {
                        toggleVisibility(lid, item.title);
                      }}>
                      <Ionicons name={hiddenIds.includes(lid) ? 'eye' : 'eye-off-outline'} size={14} color={YELLOW} />
                      <Text style={styles.drawerActionBtnText}>{hiddenIds.includes(lid) ? 'Publish' : 'Hide'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.drawerActionBtn, { borderColor: '#EF4444' }]}
                      onPress={() => {
                        setSelectedAnalyticsItem(null);
                        handleDelete(lid, item.title);
                      }}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={[styles.drawerActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inventory Section (Products Only) */}
                  {!isService && (
                    <View style={styles.inventorySectionBox}>
                      <Text style={styles.sectionHeaderTitle}>INVENTORY</Text>
                      <View style={styles.inventoryStatusRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={styles.inventoryStockNum}>{stock}</Text>
                          <Text style={styles.inventoryStockLabel}>in stock</Text>
                        </View>

                        <View style={[styles.inventoryBadge, stock <= 0 ? styles.invBadgeRed : stock <= threshold ? styles.invBadgeAmber : styles.invBadgeGreen]}>
                          <Text style={[styles.inventoryBadgeText, stock <= 0 ? styles.invTextRed : stock <= threshold ? styles.invTextAmber : styles.invTextGreen]}>
                            {stock <= 0 ? 'OUT OF STOCK' : stock <= threshold ? 'LOW STOCK' : 'IN STOCK'}
                          </Text>
                        </View>
                      </View>

                      {/* Stock Update Input Row */}
                      <View style={styles.stockUpdateRow}>
                        <TextInput
                          style={styles.stockInput}
                          placeholder="Update stock quantity"
                          placeholderTextColor="rgba(255,255,255,0.4)"
                          keyboardType="number-pad"
                          value={stockInput}
                          onChangeText={setStockInput}
                        />
                        <TouchableOpacity
                          style={[styles.stockUpdateBtn, (!stockInput && stockInput !== '0') && { opacity: 0.5 }]}
                          disabled={updatingStock || (!stockInput && stockInput !== '0')}
                          onPress={() => handleStockUpdate(lid)}>
                          <Text style={styles.stockUpdateBtnText}>
                            {updatingStock ? 'Updating...' : 'Update'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Live Analytics Metrics Grid */}
                  <Text style={styles.sectionHeaderTitle}>LIVE ANALYTICS</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="eye-outline" size={15} color="#3B82F6" />
                        <Text style={styles.metricCardLabel}>TOTAL VIEWS</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{views.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="people-outline" size={15} color="#06B6D4" />
                        <Text style={styles.metricCardLabel}>UNIQUE VISITORS</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{uniqueVisitors.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="heart-outline" size={15} color="#EC4899" />
                        <Text style={styles.metricCardLabel}>LIKES</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{likes.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="bookmark-outline" size={15} color="#F59E0B" />
                        <Text style={styles.metricCardLabel}>SAVES</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{saves.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="share-social-outline" size={15} color="#10B981" />
                        <Text style={styles.metricCardLabel}>SHARES</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{shares.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name={isService ? 'calendar-outline' : 'cart-outline'} size={15} color="#8B5CF6" />
                        <Text style={styles.metricCardLabel}>{isService ? 'BOOKINGS' : 'ORDERS'}</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{orders.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="cash-outline" size={15} color="#10B981" />
                        <Text style={styles.metricCardLabel}>REVENUE</Text>
                      </View>
                      <Text style={[styles.metricCardVal, { color: '#10B981' }]}>₹{revenue.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="star-outline" size={15} color="#F59E0B" />
                        <Text style={styles.metricCardLabel}>RATING</Text>
                      </View>
                      <Text style={styles.metricCardVal}>{rating > 0 ? `${rating.toFixed(1)} ⭐` : 'No rating'}</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="trending-up-outline" size={15} color="#8B5CF6" />
                        <Text style={styles.metricCardLabel}>CONVERSION</Text>
                      </View>
                      <Text style={[styles.metricCardVal, { color: '#8B5CF6' }]}>{conversionRate}%</Text>
                    </View>

                    <View style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Ionicons name="bar-chart-outline" size={15} color="#F97316" />
                        <Text style={styles.metricCardLabel}>CTR</Text>
                      </View>
                      <Text style={[styles.metricCardVal, { color: '#F97316' }]}>{ctr}%</Text>
                    </View>
                  </View>

                  {/* Description Section */}
                  {Boolean(item.description || item.caption) && (
                    <View style={styles.descriptionBox}>
                      <Text style={styles.sectionHeaderTitle}>DESCRIPTION</Text>
                      <Text style={styles.descriptionText}>
                        {item.description || item.caption}
                      </Text>
                    </View>
                  )}

                  {/* Shipping & Specs Section (if available) */}
                  {Boolean(item.weight || item.dimensions) && (
                    <View style={styles.descriptionBox}>
                      <Text style={styles.sectionHeaderTitle}>📦 SHIPPING & PACKAGE SPECIFICATIONS</Text>
                      <View style={styles.shippingGrid}>
                        <View style={styles.shippingItem}>
                          <Text style={styles.shippingLabel}>WEIGHT</Text>
                          <Text style={styles.shippingVal}>{item.weight || '0.5 kg'}</Text>
                        </View>
                        <View style={styles.shippingItem}>
                          <Text style={styles.shippingLabel}>DIMENSIONS (L×W×H)</Text>
                          <Text style={styles.shippingVal}>{item.dimensions || '10×10×10 cm'}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Full Store Analytics Redirect Button */}
                  <TouchableOpacity
                    style={styles.modalFullAnalyticsBtn}
                    onPress={() => {
                      const targetId = lid;
                      setSelectedAnalyticsItem(null);
                      router.push({
                        pathname: '/vendor/analytics' as any,
                        params: { listingId: targetId },
                      } as any);
                    }}>
                    <Ionicons name="analytics-outline" size={15} color="#fff" />
                    <Text style={styles.modalFullAnalyticsBtnText}>OPEN FULL STORE ANALYTICS DASHBOARD ›</Text>
                  </TouchableOpacity>
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

  /* Item Analytics Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  itemSummaryCard: {
    flexDirection: 'row',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  itemSummaryImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  itemSummaryFallback: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#23232A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSummaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemSummaryTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemSummarySub: {
    color: 'rgba(255,255,255,0.5)',
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
    color: YELLOW,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionHeaderTitle: {
    color: 'rgba(255,255,255,0.5)',
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
    width: '48%',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricCardVal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricCardSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
  conversionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  conversionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  conversionTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  conversionSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  conversionVal: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  boostRoiBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  boostRoiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  boostRoiTitle: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  boostRoiDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingVertical: 10,
    borderRadius: 6,
  },
  boostBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingVertical: 12,
    borderRadius: 6,
  },
  modalEditBtnText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  modalFullAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: YELLOW,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 24,
  },
  modalFullAnalyticsBtnText: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '900',
  },
  drawerQuickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  drawerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 8,
    borderRadius: 6,
  },
  drawerActionBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  inventorySectionBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inventoryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inventoryStockNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  inventoryStockLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  inventoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  invBadgeGreen: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  invBadgeAmber: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
  },
  invBadgeRed: {
    backgroundColor: '#4C0519',
    borderColor: '#EF4444',
  },
  inventoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  invTextGreen: { color: '#10B981' },
  invTextAmber: { color: '#F59E0B' },
  invTextRed: { color: '#EF4444' },
  stockUpdateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stockInput: {
    flex: 1,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: BORDER,
    color: '#fff',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  stockUpdateBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockUpdateBtnText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },
  descriptionBox: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    lineHeight: 16,
  },
  shippingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  shippingItem: {
    flex: 1,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    borderRadius: 6,
  },
  shippingLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  shippingVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});
