import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

type TabKey =
  | 'click-to-called'
  | 'whatsapp-contacted'
  | 'my-orders'
  | 'chat-inquiries'
  | 'saved-reels'
  | 'saved-products'
  | 'saved-services';

const TABS: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'click-to-called', label: 'Call Clicks', icon: 'call-outline' },
  { key: 'whatsapp-contacted', label: 'WhatsApp Clicks', icon: 'logo-whatsapp' },
  { key: 'my-orders', label: 'My Orders', icon: 'cart-outline' },
  { key: 'chat-inquiries', label: 'Inquiries', icon: 'chatbubbles-outline' },
  { key: 'saved-reels', label: 'Saved Reels', icon: 'film-outline' },
  { key: 'saved-products', label: 'Saved Products', icon: 'cube-outline' },
  { key: 'saved-services', label: 'Saved Services', icon: 'construct-outline' },
];

export default function MyActivitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('click-to-called');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityCounts, setActivityCounts] = useState<Record<string, number>>({});

  const fetchActivityCounts = async () => {
    try {
      const res = await api.get('/users/me/activity-counts');
      const data = res.data?.data || res.data || {};
      setActivityCounts(data);
    } catch {}
  };

  const fetchTabContent = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === 'my-orders') {
        const res = await api.get('/orders');
        const list = res.data?.data?.orders || res.data?.orders || res.data?.data || res.data || [];
        setItems(Array.isArray(list) ? list : []);
      } else if (activeTab === 'chat-inquiries') {
        const res = await api.get('/inquiries', { params: { role: 'customer' } });
        const list = res.data?.data?.inquiries || res.data?.inquiries || res.data?.data || res.data || [];
        setItems(Array.isArray(list) ? list : []);
      } else {
        const res = await api.get('/users/me/activities', {
          params: { type: activeTab, page: 1, limit: 30 },
        });
        const list = res.data?.data?.items || res.data?.data || res.data?.items || [];
        setItems(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      console.warn('Failed to load activities for tab:', activeTab, err);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivityCounts();
  }, []);

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const handleCallVendor = (phone?: string) => {
    if (!phone) {
      Alert.alert('Phone Contact', 'Phone number not available for this vendor.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-[#9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsAppVendor = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('WhatsApp Contact', 'WhatsApp number not available for this vendor.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hello ${name || 'Vendor'}! I saw your profile on BizReels.`);
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'click-to-called' || activeTab === 'whatsapp-contacted') {
      const vendor = item.target_user || item.vendor || item.user || {};
      const vendorName = vendor.shopName || vendor.businessName || vendor.name || 'Local Verified Partner';
      const avatar = resolveImageUrl(vendor.avatarUrl || vendor.profile_pic);
      const phone = vendor.phone || vendor.mobile || item.phone;
      const isCall = activeTab === 'click-to-called';

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image
              source={{ uri: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.cardBody}>
              <View style={styles.tagRow}>
                <View style={[styles.typeBadge, isCall ? styles.callBadge : styles.waBadge]}>
                  <Ionicons name={isCall ? 'call' : 'logo-whatsapp'} size={11} color="#fff" />
                  <Text style={styles.typeBadgeText}>{isCall ? 'Call Initiated' : 'WhatsApp Contact'}</Text>
                </View>
                <Text style={styles.timeText}>
                  {item.created_at || item.createdAt ? new Date(item.created_at || item.createdAt).toLocaleDateString() : 'Recently'}
                </Text>
              </View>

              <Text style={styles.vendorName}>{vendorName}</Text>
              {phone && <Text style={styles.subText}>{phone}</Text>}
            </View>
          </View>

          <View style={styles.cardActions}>
            {isCall ? (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => handleCallVendor(phone)}>
                <Ionicons name="call" size={14} color={BLACK} />
                <Text style={styles.primaryActionText}>Call Again</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#22C55E' }]} onPress={() => handleWhatsAppVendor(phone, vendorName)}>
                <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                <Text style={[styles.primaryActionText, { color: '#fff' }]}>Open WhatsApp</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => {
                const recipientId = vendor._id || vendor.id || item.target_user_id;
                if (recipientId) {
                  router.push({
                    pathname: '/messages/[id]' as any,
                    params: { id: `direct_${recipientId}`, recipientId, name: vendorName },
                  } as any);
                }
              }}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#fff" />
              <Text style={styles.secondaryActionText}>Direct Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (activeTab === 'chat-inquiries') {
      const vendor = item.vendor || item.target_user || {};
      const vendorName = vendor.shopName || vendor.businessName || vendor.name || 'Verified Vendor';
      const avatar = resolveImageUrl(vendor.avatarUrl || vendor.profile_pic);
      const isOpen = item.status !== 'closed' && item.status !== 'resolved';

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image
              source={{ uri: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.cardBody}>
              <View style={styles.tagRow}>
                <View style={[styles.typeBadge, isOpen ? styles.activeBadge : styles.closedBadge]}>
                  <Text style={styles.typeBadgeText}>{isOpen ? 'Active Enquiry' : 'Closed'}</Text>
                </View>
                <Text style={styles.timeText}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                </Text>
              </View>

              <Text style={styles.vendorName}>{vendorName}</Text>
              <Text style={styles.messageText} numberOfLines={2}>
                {item.message || 'Product/Service inquiry sent to supplier.'}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                const recipientId = vendor._id || vendor.id || item.vendor;
                if (recipientId) {
                  router.push({
                    pathname: '/messages/[id]' as any,
                    params: { id: `direct_${recipientId}`, recipientId, name: vendorName },
                  } as any);
                }
              }}>
              <Ionicons name="chatbubbles" size={14} color={BLACK} />
              <Text style={styles.primaryActionText}>Open Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (activeTab === 'my-orders') {
      const status = (item.status || 'pending').toLowerCase();
      const price = item.price || item.itemTotal || 0;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/orders' as any)}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIconBox}>
              <Ionicons name="cube-outline" size={24} color={YELLOW} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.tagRow}>
                <View style={[styles.typeBadge, status === 'delivered' ? styles.activeBadge : styles.pendingBadge]}>
                  <Text style={styles.typeBadgeText}>{status.toUpperCase()}</Text>
                </View>
                <Text style={styles.timeText}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                </Text>
              </View>

              <Text style={styles.vendorName} numberOfLines={1}>Order ID: #{item._id ? item._id.toString().slice(-6) : '001'}</Text>
              <Text style={styles.activePrice}>Total: ₹{Number(price).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Default for Saved Reels, Products, Services
    const title = item.title || item.caption || 'Saved Item';
    const image = resolveImageUrl(item.images?.[0]?.url || item.thumbnailUrl || (item.mediaUrls && item.mediaUrls[0]));
    const price = item.price || item.salePrice || item.sellingPrice;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {image ? (
            <Image source={{ uri: image }} style={styles.thumbImage} contentFit="cover" />
          ) : (
            <View style={styles.thumbFallback}>
              <Ionicons name="bookmark-outline" size={22} color="rgba(255,255,255,0.4)" />
            </View>
          )}

          <View style={styles.cardBody}>
            <Text style={styles.vendorName} numberOfLines={2}>{title}</Text>
            {price && <Text style={styles.activePrice}>₹{Number(price).toLocaleString('en-IN')}</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Activities & History</Text>
          <Text style={styles.headerSubtitle}>Call clicks, WhatsApp contacts, orders & saved items</Text>
        </View>
      </View>

      {/* Horizontal Tabs Bar */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(t) => t.key}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item: tab }) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}>
                <Ionicons name={tab.icon} size={15} color={isActive ? BLACK : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item._id || item.id || `act_${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTabContent(true)}
              tintColor={YELLOW}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Activities Found</Text>
              <Text style={styles.emptySub}>
                Your interactions and activity history for {TABS.find((t) => t.key === activeTab)?.label} will appear here.
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
    backgroundColor: BLACK,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },

  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: DARK_CARD,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },

  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },

  card: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
  },
  thumbImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  thumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  callBadge: {
    backgroundColor: '#0284C7',
  },
  waBadge: {
    backgroundColor: '#16A34A',
  },
  activeBadge: {
    backgroundColor: '#16A34A',
  },
  closedBadge: {
    backgroundColor: '#64748B',
  },
  pendingBadge: {
    backgroundColor: '#D97706',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  vendorName: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  subText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  messageText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  activePrice: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },

  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: Spacing.two,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    height: 36,
    borderRadius: 6,
  },
  primaryActionText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    height: 36,
    borderRadius: 6,
  },
  secondaryActionText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
