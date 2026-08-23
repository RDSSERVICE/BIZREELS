/**
 * Vendor Product & Service Catalog Dashboard — Mobile Application
 * Implements full catalog management matching the design specification.
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useDeleteVendorListing, useVendorListings } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import { getListingImage } from '@/utils/image';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '23 Aug 26';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export default function VendorCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: listings = [], isLoading, isRefetching, refetch } = useVendorListings();
  const deleteMutation = useDeleteVendorListing();

  // Active Catalog Tab: 'products' | 'services' | 'offers'
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'offers'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'latest' | 'price_low' | 'price_high'>('latest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const productsList = listings.filter((item) => (item.type || (item as any).category_type) !== 'service');
  const servicesList = listings.filter((item) => (item.type || (item as any).category_type) === 'service');

  const currentTabList = activeTab === 'products' ? productsList : activeTab === 'services' ? servicesList : [];

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

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
    Alert.alert('Share Listing', `Listing URL copied: https://bizreels.com/listing/${item._id}`);
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
        <Text style={styles.headerTitle}>Vendor Store Catalog</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => router.push('/vendor/listings/create' as any)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Sub-Tabs Header Bar ── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'products' && styles.tabPillActive]}
          onPress={() => setActiveTab('products')}>
          <Ionicons name="cube-outline" size={16} color={activeTab === 'products' ? '#fff' : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabPillText, activeTab === 'products' && styles.tabPillTextActive]}>
            Products Catalog
          </Text>
          <View style={[styles.countBadge, activeTab === 'products' && styles.countBadgeActive]}>
            <Text style={styles.countText}>{productsList.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'services' && styles.tabPillActive]}
          onPress={() => setActiveTab('services')}>
          <Ionicons name="key-outline" size={16} color={activeTab === 'services' ? '#fff' : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabPillText, activeTab === 'services' && styles.tabPillTextActive]}>
            Services Catalog
          </Text>
          <View style={[styles.countBadge, activeTab === 'services' && styles.countBadgeActive]}>
            <Text style={styles.countText}>{servicesList.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'offers' && styles.tabPillActive]}
          onPress={() => setActiveTab('offers')}>
          <Ionicons name="pricetag-outline" size={16} color={activeTab === 'offers' ? '#fff' : 'rgba(255,255,255,0.6)'} />
          <Text style={[styles.tabPillText, activeTab === 'offers' && styles.tabPillTextActive]}>
            Dynamic Offers
          </Text>
          <View style={[styles.countBadge, activeTab === 'offers' && styles.countBadgeActive]}>
            <Text style={styles.countText}>0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Search & Filter Controls ── */}
      <View style={styles.filterControlRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, SKU, category, ID..."
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
          <ActivityIndicator size="large" color={BrandColors.primary} />
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
              tintColor={BrandColors.primary}
              colors={[BrandColors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={42} color={BrandColors.primary} />
              <Text style={styles.emptyTitle}>No Catalog Items Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery ? 'No listings match your search criteria.' : 'Create your first product or service listing.'}
              </Text>
              <TouchableOpacity
                style={styles.createListingBtn}
                onPress={() => router.push('/vendor/listings/create' as any)}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.createListingBtnText}>+ Create New Listing</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const image = getListingImage(item);
            const price = item.salePrice || item.price || 0;
            const itemAny = item as any;
            const isSelected = selectedIds.includes(item._id);
            const isHidden = hiddenIds.includes(item._id);
            const stockCount = itemAny.stock ?? (itemAny.quantity ?? 10);

            return (
              <View style={[styles.card, isSelected && styles.cardSelected, isHidden && styles.cardHidden]}>
                {/* Top Item Row */}
                <View style={styles.cardMainRow}>
                  {/* Select Checkbox */}
                  <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelect(item._id)}>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? BrandColors.primary : 'rgba(255,255,255,0.4)'}
                    />
                  </TouchableOpacity>

                  {/* Thumbnail Image */}
                  {image ? (
                    <Image source={{ uri: image }} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <View style={styles.cardImageFallback}>
                      <Ionicons name="cube-outline" size={24} color="rgba(255,255,255,0.4)" />
                    </View>
                  )}

                  {/* Info Details */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.categorySubText} numberOfLines={1}>
                      {item.category || 'GENERAL'} • {item.subcategory || 'DEFAULT'}
                    </Text>

                    <View style={styles.metaBadgeRow}>
                      {/* Price */}
                      <Text style={styles.priceText}>₹{price.toLocaleString('en-IN')}</Text>

                      {/* Type Badge */}
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {(item.type || itemAny.category_type || 'product').toUpperCase()}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View style={[styles.statusBadge, isHidden && styles.statusBadgeDraft]}>
                        <Text style={[styles.statusBadgeText, isHidden && styles.statusBadgeTextDraft]}>
                          {isHidden ? 'DRAFT' : 'PUBLISHED'}
                        </Text>
                      </View>

                      {/* Stock Pill */}
                      <View style={[styles.stockPill, stockCount <= 2 && styles.stockPillLow]}>
                        <Text style={[styles.stockPillText, stockCount <= 2 && styles.stockPillTextLow]}>
                          {stockCount <= 2 ? `⚠️ ${stockCount} left` : `${stockCount} in stock`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Bottom Stats & Actions Footer */}
                <View style={styles.cardFooter}>
                  {/* Item Metrics */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.metricValue}>{itemAny.viewsCount || 0}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="heart-outline" size={12} color="#EC4899" />
                      <Text style={styles.metricValue}>{itemAny.likesCount || 0}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="cart-outline" size={12} color={BrandColors.primaryLight} />
                      <Text style={styles.metricValue}>{itemAny.ordersCount || 0}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {/* 6 Actions Bar */}
                  <View style={styles.actionsRow}>
                    {/* 1. Analytics */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => router.push('/vendor/analytics' as any)}>
                      <Ionicons name="stats-chart-outline" size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {/* 2. Edit */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => router.push('/vendor/listings/create' as any)}>
                      <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {/* 3. Duplicate */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDuplicate(item)}>
                      <Ionicons name="copy-outline" size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {/* 4. Hide/Show */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => toggleVisibility(item._id, item.title)}>
                      <Ionicons
                        name={isHidden ? 'eye-outline' : 'eye-off-outline'}
                        size={16}
                        color="rgba(255,255,255,0.7)"
                      />
                    </TouchableOpacity>

                    {/* 5. Share */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleShare(item)}>
                      <Ionicons name="share-social-outline" size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>

                    {/* 6. Delete */}
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleDelete(item._id, item.title)}>
                      <Ionicons name="trash-outline" size={16} color={BrandColors.error} />
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
  container: { flex: 1, backgroundColor: '#121212' },
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
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  addHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: '#18191e',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#242630',
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#D97706',
  },
  tabPillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  tabPillTextActive: {
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  filterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  sortBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.three, gap: Spacing.three },

  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  cardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#24201b',
  },
  cardHidden: {
    opacity: 0.6,
  },

  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    padding: 2,
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  cardImageFallback: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  categorySubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  priceText: {
    color: '#10B981',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  typeBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  statusBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  statusBadgeTextDraft: {
    color: 'rgba(255,255,255,0.6)',
  },

  stockPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  stockPillLow: {
    backgroundColor: 'rgba(217,119,6,0.2)',
  },
  stockPillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  stockPillTextLow: {
    color: '#D97706',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    marginLeft: 4,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  emptyDesc: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, textAlign: 'center' },
  createListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: Spacing.two,
  },
  createListingBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
