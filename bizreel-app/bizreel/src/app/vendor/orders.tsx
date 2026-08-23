/**
 * Vendor Orders & Fulfillment Screen — Track and fulfill customer orders.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useUpdateOrderStatus, useVendorOrders } from '@/features/vendor-orders/queries';

const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered'] as const;

export default function VendorOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('all');

  const { data: orders = [], isLoading, isRefetching, refetch } = useVendorOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    return o.status?.toLowerCase() === activeTab;
  });

  function handleStatusChange(
    orderId: string,
    nextStatus: string
  ) {
    updateStatusMutation.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => {
          Alert.alert('Status Updated', `Order status updated to ${nextStatus.toUpperCase()}.`);
        },
        onError: (err: any) => Alert.alert('Update Failed', err.message),
      }
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Order Fulfillment</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
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
          renderItem={({ item }) => {
            const customerName = item.customer?.name || (item as any).user?.name || 'Customer';
            const total = item.price || (item as any).totalAmount || 0;
            const itemCount = item.quantity || (item as any).items?.length || 1;

            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderIdText}>Order #{(item as any).orderId || item._id.slice(-6)}</Text>
                    <Text style={styles.customerText}>Customer: {customerName}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PENDING'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsRow}>
                  <Text style={styles.itemCountText}>
                    {itemCount} Item(s) Total
                  </Text>
                  <Text style={styles.totalPrice}>₹{total}</Text>
                </View>

                {/* Status Change Action Buttons */}
                <View style={styles.actionsRow}>
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleStatusChange(item._id, 'accepted')}>
                      <Text style={styles.actionBtnText}>Accept Order</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleStatusChange(item._id, 'completed')}>
                      <Text style={styles.actionBtnText}>Mark Completed</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'completed' && (
                    <TouchableOpacity
                      style={styles.actionBtnSuccess}
                      onPress={() => handleStatusChange(item._id, 'delivered')}>
                      <Text style={styles.actionBtnText}>Mark Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={56} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySub}>
                Incoming customer orders will appear here for fulfillment.
              </Text>
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
  tabsRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  tabsScroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  tabChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  tabChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  tabChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  tabChipTextActive: {
    color: '#fff',
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
  orderCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  customerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(217, 154, 61, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: BrandColors.primaryLight,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#2c2c2e',
    marginVertical: 4,
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
  },
  totalPrice: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionBtnPrimary: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  actionBtnSuccess: {
    backgroundColor: '#22C55E',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
});
