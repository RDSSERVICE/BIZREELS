import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCancelOrder, useMyOrders } from '@/features/orders/queries';
import type { Order } from '@/features/orders/types';

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const { data, isLoading, refetch } = useMyOrders(activeFilter === 'all' ? undefined : activeFilter);
  const cancelOrderMutation = useCancelOrder();

  const orders = data?.data || [];

  const handleCancelOrder = (order: Order) => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel your order for "${order.listing?.title || 'Item'}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelOrderMutation.mutate(
              { orderId: order._id, reason: 'Customer requested cancellation from app' },
              {
                onSuccess: (res) => {
                  Alert.alert('Order Cancelled', res.message);
                },
                onError: (err: any) => {
                  Alert.alert('Error', err.message || 'Could not cancel order.');
                },
              }
            );
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return BrandColors.success;
      case 'pending':
      case 'active':
        return BrandColors.warning;
      case 'cancelled':
      case 'rejected':
        return BrandColors.error;
      default:
        return BrandColors.primary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <SymbolView name="chevron.left" size={22} tintColor="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => refetch()}>
          <SymbolView name="arrow.clockwise" size={20} tintColor="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}>
            <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: order }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderIdText}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '25' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.vendorName}>{order.vendor?.businessName || order.vendor?.name || 'Vendor'}</Text>

              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listingTitle}>{order.listing?.title || 'Product / Service'}</Text>
                  <Text style={styles.itemMeta}>Qty: {order.quantity} | Total: ₹{order.price}</Text>
                </View>
              </View>

              <Text style={styles.addressText} numberOfLines={1}>
                📍 {order.address || 'Standard Delivery Address'}
              </Text>

              <View style={styles.orderCardFooter}>
                {['pending', 'active'].includes(order.status) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelOrder(order)}
                    disabled={cancelOrderMutation.isPending}>
                    <Text style={styles.cancelBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SymbolView name="doc.plaintext" size={48} tintColor="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySub}>You haven't placed any orders matching this status filter yet.</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  iconBtn: {
    padding: Spacing.two,
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  filterChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: FontWeight.bold,
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
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  vendorName: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  itemMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  addressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#2c2c2e',
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: BrandColors.error,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: BrandColors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five * 2,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
