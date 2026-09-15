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
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import {
  NotificationItem,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/queries';
import { resolveImageUrl } from '@/utils/image';

const GOLD = '#D99A3D';
const GOLD_ACCENT = '#F59E0B';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const UNREAD_BG = '#FFFDF5';
const BORDER = '#E2E8F0';
const BORDER_UNREAD = '#FDE68A';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';
const TEXT_DARK = '#334155';

const TABS = [
  { id: 'all', label: 'All', icon: 'notifications-outline' },
  { id: 'orders', label: 'Orders & Bids', icon: 'cart-outline' },
  { id: 'social', label: 'Likes & Comments', icon: 'heart-outline' },
  { id: 'offers', label: 'Offers', icon: 'pricetag-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

function formatTimestamp(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const activeRole = (user as any)?.activeRole || (user as any)?.current_role || 'customer';
  const [activeTab, setActiveTab] = useState('all');

  const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications(activeRole);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const matchesTab = (n: NotificationItem, tab: string) => {
    if (tab === 'all') return true;
    const t = (n.type || '').toLowerCase();
    if (tab === 'orders') {
      return ['order', 'order_status', 'lead', 'inquiry', 'quote', 'proposal', 'requirement', 'bid'].includes(t);
    }
    if (tab === 'social') {
      return ['like', 'follow', 'comment', 'reply', 'chat', 'message'].includes(t);
    }
    if (tab === 'offers') {
      return ['offer', 'offers', 'deal', 'deals', 'price', 'discount'].includes(t);
    }
    if (tab === 'system') {
      return ['system', 'admin', 'kyc', 'verification', 'wallet', 'payment', 'hire', 'campaign', 'support'].includes(t);
    }
    return t === tab;
  };

  const filteredList = notifications.filter((n) => matchesTab(n, activeTab));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = async (n: NotificationItem) => {
    if (!n.isRead) {
      markReadMutation.mutate(n._id || n.id || '');
    }

    const targetUrl = n.actionUrl || n.action_url;
    if (targetUrl) {
      const lower = targetUrl.toLowerCase();
      if (lower.includes('/post-requirement') || lower.includes('/requirements')) {
        router.push('/post-requirement' as any);
      } else if (lower.includes('/orders') || lower.includes('/order')) {
        router.push('/orders' as any);
      } else if (lower.includes('/messages') || lower.includes('/chat')) {
        router.push('/messages' as any);
      } else if (lower.includes('/saved') || lower.includes('/bookmarks')) {
        router.push('/saved-reels' as any);
      } else if (lower.includes('/reels') || lower.includes('/reel')) {
        router.push('/(tabs)/index' as any);
      } else if (lower.includes('/vendor/')) {
        const parts = targetUrl.split('/');
        const vId = parts[parts.length - 1];
        if (vId) router.push({ pathname: '/vendor/[id]', params: { id: vId } } as any);
      } else {
        router.push('/(tabs)/home' as any);
      }
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Notification', 'Are you sure you want to delete this notification alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const renderIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (['like'].includes(t)) return <Ionicons name="heart" size={18} color="#EF4444" />;
    if (['follow'].includes(t)) return <Ionicons name="person-add" size={18} color="#3B82F6" />;
    if (['comment', 'reply'].includes(t)) return <Ionicons name="chatbubble-ellipses" size={18} color="#10B981" />;
    if (['quote', 'bid', 'requirement', 'proposal'].includes(t)) return <Ionicons name="pricetag" size={18} color="#D97706" />;
    if (['order', 'order_status', 'lead'].includes(t)) return <Ionicons name="cart" size={18} color="#8B5CF6" />;
    if (['wallet', 'payment'].includes(t)) return <Ionicons name="wallet" size={18} color="#10B981" />;
    if (['kyc', 'verification', 'system', 'support'].includes(t)) return <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />;
    return <Ionicons name="notifications" size={18} color="#D97706" />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={TEXT_MAIN} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllReadMutation.mutate(activeRole)}
            activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={14} color={GOLD_ACCENT} />
            <Text style={styles.markAllBtnText}>Read All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.four }}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.id;
            const tabUnread = notifications.filter((n) => matchesTab(n, item.id) && !n.isRead).length;
            return (
              <TouchableOpacity
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.8}>
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? GOLD_ACCENT : TEXT_MUTED}
                />
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {item.label}
                </Text>
                {tabUnread > 0 && (
                  <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                      {tabUnread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notifications Body List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD_ACCENT} />
          <Text style={styles.loadingText}>Fetching updates...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>You're All Caught Up!</Text>
          <Text style={styles.emptySub}>
            You have no notification alerts under this filter. Inquiries, bids, comments, and order updates will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={GOLD_ACCENT} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const senderName = item.sender?.name || item.title;
            const senderAvatar = item.sender?.avatarUrl || item.sender?.profile_pic;
            const messageBody =
              item.message ||
              item.body ||
              item.data?.message ||
              item.data?.body ||
              (item as any).content ||
              'Click to view details.';
            const targetUrl = item.actionUrl || item.action_url;

            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.85}>
                {/* Icon or Sender Avatar */}
                <View style={styles.iconWrapper}>
                  {senderAvatar ? (
                    <Image
                      source={{ uri: resolveImageUrl(senderAvatar) || '' }}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.iconCircle, !item.isRead && styles.iconCircleUnread]}>
                      {renderIcon(item.type)}
                    </View>
                  )}
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                {/* Content Details */}
                <View style={styles.cardMainContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={2}>
                      {item.title || 'System Notification'}
                    </Text>
                    <Text style={styles.notifTime}>{formatTimestamp(item.createdAt)}</Text>
                  </View>

                  <Text style={[styles.notifBody, !item.isRead && styles.notifBodyUnread]} numberOfLines={3}>
                    {messageBody}
                  </Text>

                  {/* Card Footer Actions */}
                  <View style={styles.cardFooterRow}>
                    {targetUrl ? (
                      <View style={styles.actionBadge}>
                        <Text style={styles.actionBadgeText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={12} color="#B45309" />
                      </View>
                    ) : (
                      <View />
                    )}

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDelete(item._id || item.id || '');
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD_BG,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: TEXT_MAIN, fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  headerSubtitle: { color: '#B45309', fontSize: 11, fontWeight: '700', marginTop: 1 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ESPRESSO,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  markAllBtnText: { color: GOLD_ACCENT, fontSize: 11, fontWeight: '900' },

  tabsRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD_BG,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabChipActive: { backgroundColor: ESPRESSO, borderColor: ESPRESSO },
  tabChipText: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  tabChipTextActive: { color: GOLD_ACCENT, fontWeight: '900' },
  tabBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: { backgroundColor: '#FEF3C7', borderColor: GOLD_ACCENT },
  tabBadgeText: { color: '#B45309', fontSize: 10, fontWeight: '900' },
  tabBadgeTextActive: { color: '#B45309' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { color: TEXT_MAIN, fontSize: 16, fontWeight: '900' },
  emptySub: { color: TEXT_MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 280 },

  listContent: { padding: Spacing.four, gap: 12 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: {
    borderColor: BORDER_UNREAD,
    backgroundColor: UNREAD_BG,
  },
  iconWrapper: { position: 'relative', marginTop: 2 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUnread: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  avatarImg: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: GOLD_ACCENT },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD_ACCENT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardMainContent: { flex: 1, gap: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle: { color: TEXT_DARK, fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  notifTitleUnread: { color: TEXT_MAIN, fontWeight: '900' },
  notifTime: { color: '#94A3B8', fontSize: 10, fontWeight: '600', marginLeft: 8, marginTop: 1 },
  notifBody: { color: TEXT_MUTED, fontSize: 12, lineHeight: 18, marginTop: 1 },
  notifBodyUnread: { color: '#334155', fontWeight: '500' },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  actionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBadgeText: { color: '#B45309', fontSize: 11, fontWeight: '900' },
  deleteBtn: { padding: 4, borderRadius: 6 },
});
