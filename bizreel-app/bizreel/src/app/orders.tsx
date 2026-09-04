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
import { useAuth } from '@/features/auth/context';

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuth();

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

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <SymbolView name="chevron.left" size={22} tintColor="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.center}>
          <SymbolView name="bag.badge.questionmark" size={64} tintColor={BrandColors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16 }}>Sign In to View Orders</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 20 }}>
            Please sign in to your BizReels account to view your past orders, active shipments, and track deliveries.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: BrandColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => router.push('/(auth)/login')}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>Log In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
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
    borderBottomColor: BORDER,
    backgroundColor: BLACK,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  filterChip: {
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  filterChipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  orderCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
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
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 0,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  vendorName: {
    color: YELLOW,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingTitle: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
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
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: FontSize.xs,
    fontWeight: '900',
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
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
