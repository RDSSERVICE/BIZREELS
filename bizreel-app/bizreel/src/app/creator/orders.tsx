import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

interface CreatorOrder {
  _id: string;
  id: string;
  title: string;
  vendor_name: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
}

export default function CreatorOrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<CreatorOrder[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/creator/orders');
      const list = res.data?.data || res.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load creator orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/creator/orders/${id}/status`, { status: newStatus });
      Alert.alert('Updated', `Order status set to "${newStatus}"`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>MY ORDERS & PROJECTS</Text>
          <Text style={styles.headerSub}>Manage Shoot Collaborations</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No orders or projects found</Text>
          </View>
        ) : (
          orders.map((item) => (
            <View key={item._id || item.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{item.title}</Text>
                  <Text style={styles.orderVendor}>Vendor Client: {item.vendor_name}</Text>
                </View>
                <Text style={styles.orderAmount}>₹{item.amount}</Text>
              </View>

              <View style={styles.orderBadgeRow}>
                <View style={styles.typeBadge}><Text style={styles.typeText}>{item.type}</Text></View>
                <View style={[styles.statusBadge, item.status === 'completed' && styles.statusCompleted]}>
                  <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
                </View>
              </View>

              {item.status !== 'completed' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleUpdateStatus(item._id || item.id, 'completed')}>
                    <Text style={styles.completeBtnText}>Mark Completed</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  loadingContainer: { flex: 1, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: Spacing.three,
  },
  backBtn: { width: 36, height: 36, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  orderCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.two },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  orderVendor: { color: YELLOW, fontSize: 10, fontWeight: '700', marginTop: 2 },
  orderAmount: { color: '#10B981', fontSize: FontSize.base, fontWeight: '900' },
  orderBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  typeBadge: { backgroundColor: BLACK, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: BORDER },
  typeText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700' },
  statusBadge: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: YELLOW },
  statusCompleted: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  actionRow: { marginTop: 8 },
  completeBtn: { height: 38, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  completeBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
});
