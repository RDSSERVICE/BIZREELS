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

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

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
      return ['system', 'admin', 'kyc', 'verification', 'wallet', 'payment', 'hire', 'campaign'].includes(t);
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
    Alert.alert('Remove Notification', 'Are you sure you want to delete this notification?', [
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
    if (['quote', 'bid', 'requirement', 'proposal'].includes(t)) return <Ionicons name="pricetag" size={18} color={YELLOW} />;
    if (['order', 'order_status', 'lead'].includes(t)) return <Ionicons name="cart" size={18} color="#8B5CF6" />;
    if (['wallet', 'payment'].includes(t)) return <Ionicons name="wallet" size={18} color="#10B981" />;
    if (['kyc', 'verification', 'system'].includes(t)) return <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />;
    return <Ionicons name="notifications" size={18} color={YELLOW} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllReadMutation.mutate(activeRole)}>
            <Ionicons name="checkmark-done" size={14} color={BLACK} />
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
                onPress={() => setActiveTab(item.id)}>
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? BLACK : 'rgba(255,255,255,0.7)'}
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
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>Fetching updates...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>No Notifications Found</Text>
          <Text style={styles.emptySub}>
            You have no updates under this filter. Likes, bids, comments, and orders will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={YELLOW} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const senderName = item.sender?.name || item.title;
            const senderAvatar = item.sender?.avatarUrl || item.sender?.profile_pic;

            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
                onPress={() => handleNotificationPress(item)}>
                {/* Icon or Sender Avatar */}
                <View style={styles.iconWrapper}>
                  {senderAvatar ? (
                    <Image
                      source={{ uri: resolveImageUrl(senderAvatar) || '' }}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.iconCircle}>{renderIcon(item.type)}</View>
                  )}
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                {/* Content Details */}
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.notifTime}>{formatTimestamp(item.createdAt)}</Text>
                  </View>

                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.message || item.body || 'New notification update.'}
                  </Text>
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item._id || item.id || '')}
                  hitSlop={8}>
                  <Ionicons name="trash-outline" size={14} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  headerSubtitle: { color: YELLOW, fontSize: 10, fontWeight: '700' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllBtnText: { color: BLACK, fontSize: 11, fontWeight: '900' },
  tabsRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: DARK_CARD,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabChipActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  tabChipText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  tabChipTextActive: { color: BLACK, fontWeight: '900' },
  tabBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeActive: { backgroundColor: BLACK },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  tabBadgeTextActive: { color: YELLOW },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  listContent: { padding: Spacing.four, gap: 10 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    gap: 12,
  },
  notifCardUnread: {
    borderColor: YELLOW,
    backgroundColor: '#1E1B13',
  },
  iconWrapper: { position: 'relative' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: YELLOW },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: YELLOW,
    borderWidth: 1,
    borderColor: BLACK,
  },
  notifTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', flex: 1 },
  notifTitleUnread: { color: '#fff', fontWeight: '900' },
  notifTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginLeft: 6 },
  notifBody: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 16 },
  deleteBtn: { padding: 4 },
});
