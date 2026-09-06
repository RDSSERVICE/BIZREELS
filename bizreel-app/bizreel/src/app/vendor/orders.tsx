/**
 * Vendor Order Requests Management Screen — Mobile Application
 * Implements complete order tracking, status management, payment confirmation, and dispatch modal.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useUpdateOrderStatus, useVendorOrders } from '@/features/vendor-orders/queries';

type TabKey = 'pending' | 'accepted' | 'completed' | 'cancelled';

export default function VendorOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingModalOrder, setShippingModalOrder] = useState<any | null>(null);
  const [courierInput, setCourierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  const { data: orders = [], isLoading, isRefetching, refetch } = useVendorOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  // Tab count metrics
  const pendingCount = orders.filter((o: any) => (o.status || 'pending') === 'pending').length;
  const acceptedCount = orders.filter((o: any) =>
    ['accepted', 'processing', 'shipped', 'out_for_delivery'].includes(o.status)
  ).length;
  const completedCount = orders.filter((o: any) =>
    ['completed', 'delivered'].includes(o.status)
  ).length;
  const cancelledCount = orders.filter((o: any) =>
    ['cancelled', 'rejected', 'refunded'].includes(o.status)
  ).length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'New Orders', count: pendingCount },
    { key: 'accepted', label: 'In Progress / Shipped', count: acceptedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'cancelled', label: 'Cancelled / Rejected', count: cancelledCount },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const s = (o.status || 'pending').toLowerCase();
      let matchesTab = false;

      if (activeTab === 'pending') matchesTab = s === 'pending';
      else if (activeTab === 'accepted')
        matchesTab = ['accepted', 'processing', 'shipped', 'out_for_delivery'].includes(s);
      else if (activeTab === 'completed') matchesTab = ['completed', 'delivered'].includes(s);
      else if (activeTab === 'cancelled')
        matchesTab = ['cancelled', 'rejected', 'refunded'].includes(s);

      if (!matchesTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idStr = String(o._id || o.id || '').toLowerCase();
        const customerName = (o.customer?.name || (o as any).user?.name || '').toLowerCase();
        const customerPhone = (o.customer?.phone || '').toLowerCase();
        const title = (o.itemSnapshot?.title || o.listing?.title || '').toLowerCase();
        return (
          idStr.includes(q) ||
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          title.includes(q)
        );
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const handleStatusChange = (orderId: string, status: string, extraPayload: any = {}) => {
    updateStatusMutation.mutate(
      { orderId, status, ...extraPayload },
      {
        onSuccess: () => {
          Alert.alert('Status Updated', `Order marked as ${status.toUpperCase()}.`);
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to update order status');
        },
      }
    );
  };

  const handleConfirmPayment = (orderId: string) => {
    Alert.alert(
      'Confirm Payment',
      'Confirm that you have received payment from the customer via UPI/Cash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Paid',
          onPress: () => {
            updateStatusMutation.mutate(
              { orderId, paymentStatus: 'paid' },
              {
                onSuccess: () =>
                  Alert.alert('Success', 'Payment status updated to PAID.'),
                onError: (err: any) =>
                  Alert.alert('Error', err?.message || 'Failed to update payment status'),
              }
            );
          },
        },
      ]
    );
  };

  const handleShipSubmit = () => {
    if (!shippingModalOrder) return;
    const orderId = String(shippingModalOrder._id || shippingModalOrder.id);
    handleStatusChange(orderId, 'shipped', {
      trackingNumber: trackingInput.trim() || undefined,
      shippingDetails: courierInput.trim()
        ? { courierName: courierInput.trim(), trackingNumber: trackingInput.trim() }
        : undefined,
    });
    setShippingModalOrder(null);
    setCourierInput('');
    setTrackingInput('');
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Unable to dial phone number.')
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Requests</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item: any, index) => (item._id || item.id || `${index}`).toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#F59E0B" />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Main Title Banner Box */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerIconBox}>
                <Ionicons name="cart" size={22} color="#F59E0B" />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.bannerTitle}>ORDER REQUESTS MANAGEMENT</Text>
                <Text style={styles.bannerSubtitle}>
                  Accept, track, ship, and complete online customer order requests in real time
                </Text>
              </View>
            </View>

            {/* Filter Tabs ScrollView */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabChip, isActive && styles.tabChipActive]}
                    onPress={() => setActiveTab(tab.key)}>
                    <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                      {tab.label}
                    </Text>
                    <View style={[styles.badgePill, isActive && styles.badgePillActive]}>
                      <Text style={[styles.badgePillText, isActive && styles.badgePillTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Input Bar */}
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search-outline"
                size={16}
                color="rgba(255,255,255,0.4)"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customer, phone, item, #ID..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading order requests...</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="receipt-outline" size={36} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No order requests match your search query.'
                  : `No ${activeTab} order requests found.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }: { item: any }) => {
          const orderId = String(item._id || item.id || '');
          const shortId = orderId.slice(-8).toUpperCase();
          const isService =
            Boolean(item.scheduledVisitTime) ||
            Boolean(item.bookingDate) ||
            item.itemSnapshot?.listingType === 'service' ||
            item.listing?.type === 'service';

          const itemTitle = item.itemSnapshot?.title || item.listing?.title || 'Order Item';
          const orderStatus = (item.status || 'pending').toLowerCase();
          const isPaid = item.paymentStatus === 'paid';
          const customerName = item.customer?.name || (item as any).user?.name || 'Customer';
          const customerPhone = item.customer?.phone || (item as any).user?.phone;
          const priceTotal = item.price || (item as any).totalAmount || 0;
          const quantity = item.quantity || 1;

          return (
            <View style={styles.orderCard}>
              {/* Top Row: #ID, Date, Order Type, Status */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.idGroup}>
                  <Text style={styles.orderIdText}>#{shortId}</Text>
                  <Text style={styles.dateText}>
                    •{' '}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : item.date || 'Today'}
                  </Text>
                </View>

                <View style={styles.badgesGroup}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: isService
                          ? 'rgba(168,85,247,0.15)'
                          : 'rgba(59,130,246,0.15)',
                        borderColor: isService ? '#A855F7' : '#3B82F6',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isService ? '#A855F7' : '#3B82F6' },
                      ]}>
                      {isService ? '🛠️ SERVICE' : '📦 PRODUCT'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      orderStatus === 'pending'
                        ? { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: '#F59E0B' }
                        : ['accepted', 'processing', 'shipped'].includes(orderStatus)
                        ? { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3B82F6' }
                        : ['completed', 'delivered'].includes(orderStatus)
                        ? { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' }
                        : { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#EF4444' },
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        orderStatus === 'pending'
                          ? { color: '#F59E0B' }
                          : ['accepted', 'processing', 'shipped'].includes(orderStatus)
                          ? { color: '#3B82F6' }
                          : ['completed', 'delivered'].includes(orderStatus)
                          ? { color: '#10B981' }
                          : { color: '#EF4444' },
                      ]}>
                      {orderStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>
                  Customer: <Text style={styles.customerValue}>{customerName}</Text>
                </Text>

                {customerPhone ? (
                  <TouchableOpacity
                    style={styles.phoneBtn}
                    onPress={() => handleCallCustomer(customerPhone)}>
                    <Ionicons name="call-outline" size={12} color="#818CF8" />
                    <Text style={styles.phoneBtnText}>+{customerPhone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Item Details */}
              <Text style={styles.itemDetailText}>
                Item: <Text style={styles.itemTitleVal}>{itemTitle}</Text>{' '}
                {!isService ? (
                  <Text style={styles.itemQtyVal}>(x{quantity})</Text>
                ) : null}
              </Text>

              {/* Delivery Address if present */}
              {item.address ? (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.addressText} numberOfLines={2}>
                    Delivery Address: {item.address}{' '}
                    {item.pincode ? `(${item.pincode})` : ''}
                  </Text>
                </View>
              ) : null}

              {/* Scheduled Visit if service */}
              {item.bookingDate || item.scheduledVisitTime ? (
                <View style={styles.scheduledRow}>
                  <Ionicons name="calendar-outline" size={13} color="#F59E0B" />
                  <Text style={styles.scheduledText}>
                    Scheduled Visit:{' '}
                    {item.bookingDate ||
                      (item.scheduledVisitTime
                        ? new Date(item.scheduledVisitTime).toLocaleDateString()
                        : '')}{' '}
                    {item.bookingTime ? `at ${item.bookingTime}` : ''}
                  </Text>
                </View>
              ) : null}

              {/* Tracking info if shipped */}
              {item.trackingNumber ? (
                <View style={styles.trackingRow}>
                  <Ionicons name="bus-outline" size={13} color="#818CF8" />
                  <Text style={styles.trackingText}>
                    Tracking #: {item.trackingNumber}{' '}
                    {item.shippingDetails?.courierName
                      ? `(${item.shippingDetails.courierName})`
                      : ''}
                  </Text>
                </View>
              ) : null}

              {/* Pricing & Payment Info Row */}
              <View style={styles.pricingRow}>
                <Text style={styles.totalPriceText}>Total: ₹{priceTotal.toLocaleString('en-IN')}</Text>

                <View style={styles.payMethodBadge}>
                  <Text style={styles.payMethodText}>
                    {item.paymentMethod
                      ? item.paymentMethod.replace(/_/g, ' ').toUpperCase()
                      : 'VENDOR UPI'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.paidStatusBadge,
                    {
                      backgroundColor: isPaid
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(245,158,11,0.15)',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.paidStatusText,
                      { color: isPaid ? '#10B981' : '#F59E0B' },
                    ]}>
                    {isPaid ? '✓ PAID' : '⏳ UNPAID'}
                  </Text>
                </View>
              </View>

              {/* Cancellation Reason / Refund info if cancelled */}
              {orderStatus === 'cancelled' ? (
                <View style={styles.cancellationBox}>
                  <Text style={styles.cancellationText}>
                    Refunded: ₹{(item.refundAmount ?? priceTotal).toLocaleString()} (
                    {item.refundPercentage ?? 100}%)
                  </Text>
                  {item.cancellationReason ? (
                    <Text style={styles.cancellationReasonText}>
                      Reason: {item.cancellationReason}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                {/* Confirm Payment Button (if unpaid and not cancelled) */}
                {!isPaid && !['cancelled', 'rejected', 'refunded'].includes(orderStatus) ? (
                  <TouchableOpacity
                    style={styles.confirmPayBtn}
                    onPress={() => handleConfirmPayment(orderId)}>
                    <Ionicons name="cash-outline" size={13} color="#0F0F12" />
                    <Text style={styles.confirmPayBtnText}>$ Confirm Payment</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Pending Tab Actions */}
                {activeTab === 'pending' ? (
                  <>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleStatusChange(orderId, 'accepted')}>
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                      <Text style={styles.acceptBtnText}>
                        {isService ? 'Accept Booking' : 'Accept Order'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleStatusChange(orderId, 'cancelled')}>
                      <Ionicons name="close" size={14} color="#EF4444" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                {/* Accepted / In Progress Tab Actions */}
                {activeTab === 'accepted' ? (
                  <>
                    {!isService && orderStatus === 'accepted' ? (
                      <TouchableOpacity
                        style={styles.shipBtn}
                        onPress={() => setShippingModalOrder(item)}>
                        <Ionicons name="bus-outline" size={14} color="#FFF" />
                        <Text style={styles.shipBtnText}>Mark Shipped</Text>
                      </TouchableOpacity>
                    ) : null}

                    {isService && orderStatus === 'accepted' ? (
                      <TouchableOpacity
                        style={styles.shipBtn}
                        onPress={() => handleStatusChange(orderId, 'processing')}>
                        <Ionicons name="time-outline" size={14} color="#FFF" />
                        <Text style={styles.shipBtnText}>Start Service</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleStatusChange(orderId, 'completed')}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#FFF" />
                      <Text style={styles.completeBtnText}>Mark Completed</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {/* Shipping / Dispatch Tracking Modal */}
      <Modal
        visible={Boolean(shippingModalOrder)}
        animationType="fade"
        transparent
        onRequestClose={() => setShippingModalOrder(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="bus" size={18} color="#818CF8" />
                <Text style={styles.modalTitle}>Dispatch / Ship Order</Text>
              </View>
              <TouchableOpacity onPress={() => setShippingModalOrder(null)}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Enter shipping courier and tracking info to notify customer:
            </Text>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Courier / Shipping Partner (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. BlueDart, Delhivery, SpeedPost"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={courierInput}
                  onChangeText={setCourierInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tracking / AWB Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. TRACK12345678IN"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={trackingInput}
                  onChangeText={setTrackingInput}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShippingModalOrder(null)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleShipSubmit}>
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                  <Text style={styles.modalSubmitBtnText}>Confirm Dispatch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D36',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: '#2D2D36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: '#2D2D36',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: { padding: Spacing.four, gap: Spacing.three },
  headerSection: { gap: Spacing.three, marginBottom: Spacing.two },

  /* Banner Box */
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#26262E',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: { flex: 1, gap: 2 },
  bannerTitle: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    lineHeight: 14,
  },

  /* Tabs Bar */
  tabsRow: { gap: Spacing.two, paddingVertical: 2 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: '#26262E',
    borderColor: '#F59E0B',
  },
  tabChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  tabChipTextActive: { color: '#F59E0B' },
  badgePill: {
    backgroundColor: '#26262E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillActive: { backgroundColor: '#F59E0B' },
  badgePillText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900' },
  badgePillTextActive: { color: '#0F0F12' },

  /* Search Bar */
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D36',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 12 },

  /* Empty & Loading */
  loadingBox: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  emptyBox: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2D2D36',
    marginVertical: Spacing.two,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Order Item Card */
  orderCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#2D2D36',
    marginBottom: Spacing.two,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  idGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderIdText: { color: '#F59E0B', fontSize: FontSize.xs, fontWeight: '900' },
  dateText: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  badgesGroup: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 8, fontWeight: '900' },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 8, fontWeight: '900' },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  customerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  customerValue: { color: '#FFF', fontWeight: FontWeight.bold },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(129,140,248,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phoneBtnText: { color: '#818CF8', fontSize: 11, fontWeight: FontWeight.bold },

  itemDetailText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  itemTitleVal: { color: '#FFF', fontWeight: FontWeight.bold },
  itemQtyVal: { color: 'rgba(255,255,255,0.5)' },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  addressText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, flex: 1, lineHeight: 14 },

  scheduledRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduledText: { color: '#F59E0B', fontSize: 10, fontWeight: FontWeight.bold },

  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackingText: { color: '#818CF8', fontSize: 10, fontWeight: FontWeight.bold },

  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    flexWrap: 'wrap',
  },
  totalPriceText: { color: '#10B981', fontSize: FontSize.xs, fontWeight: '900' },
  payMethodBadge: {
    backgroundColor: '#26262E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payMethodText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: FontWeight.bold },
  paidStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  paidStatusText: { fontSize: 9, fontWeight: '900' },

  cancellationBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: 2,
  },
  cancellationText: { color: '#EF4444', fontSize: 10, fontWeight: FontWeight.bold },
  cancellationReasonText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontStyle: 'italic' },

  /* Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  confirmPayBtnText: { color: '#0F0F12', fontSize: 10, fontWeight: '900' },

  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtnText: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },

  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  rejectBtnText: { color: '#EF4444', fontSize: 11, fontWeight: FontWeight.bold },

  shipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  shipBtnText: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },

  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  completeBtnText: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },

  /* Modal Styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  modalSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 15 },
  modalForm: { gap: Spacing.three },
  inputGroup: { gap: 4 },
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: FontWeight.bold },
  modalInput: {
    backgroundColor: '#26262E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3F3F46',
    paddingHorizontal: 10,
    height: 38,
    color: '#FFF',
    fontSize: 11,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCancelBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  modalSubmitBtnText: { color: '#FFF', fontSize: 11, fontWeight: FontWeight.bold },
});
