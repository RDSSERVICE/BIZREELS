/**
 * Chat & Messages Inbox Screen — Mobile Application
 * Displays customer and creator conversation threads matching Frontend Chat Page.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useConversations } from '@/features/chat/queries';

export default function ChatInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, status: authStatus } = useAuth();
  const currentUserId = user?._id || (user as any)?.id;

  const [activeTab, setActiveTab] = useState<'customers' | 'creators'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: conversations = [], isLoading, isRefetching, refetch } = useConversations();

  // Process threads for active view
  const processedThreads = conversations.map((c) => {
    const participants = c.participants || [];
    const other: any = participants.find((p: any) => (p._id || p.id || p) !== currentUserId) || {};
    const recipientId = other._id || other.id || (typeof other === 'string' ? other : '');
    const name = other.name || other.shopName || other.businessName || 'BizReels User';
    const avatar = other.avatarUrl || other.profile_pic || other.vendorProfile?.logo || null;
    const isCreator = other.roles?.includes('creator') || false;

    const timeStr = c.updatedAt
      ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recently';

    return {
      id: c._id || c.id || Math.random().toString(),
      name,
      avatar,
      lastMessage: c.lastMessage?.text || c.lastMessage?.content || 'Tap to view conversation...',
      time: timeStr,
      unread: c.unreadCount || 0,
      recipientId,
      role: isCreator ? 'creators' : 'customers',
    };
  });

  const filteredThreads = processedThreads.filter((t) => {
    const matchesTab = t.role === activeTab;
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (authStatus === 'unauthed' || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats & Messages Inbox</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={64} color={BrandColors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16 }}>Sign In to View Messages</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginHorizontal: 32, marginTop: 8, marginBottom: 20 }}>
            Please sign in to your BizReels account to send and receive messages with sellers and creators.
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
      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats & Messages Inbox</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Filter Sub-Tabs ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'customers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('customers')}>
          <Ionicons
            name="person"
            size={16}
            color={activeTab === 'customers' ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
            Customer Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'creators' && styles.tabBtnActive]}
          onPress={() => setActiveTab('creators')}>
          <Ionicons
            name="videocam"
            size={16}
            color={activeTab === 'creators' ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
          <Text style={[styles.tabText, activeTab === 'creators' && styles.tabTextActive]}>
            Creator Chats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by participant name..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.id}
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
              <Ionicons name="chatbubbles-outline" size={48} color={BrandColors.primary} />
              <Text style={styles.emptyTitle}>No Messages Found</Text>
              <Text style={styles.emptyDesc}>
                {searchTerm ? 'No chat threads match your search.' : 'Start a new inquiry or customer conversation!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.threadCard}
              onPress={() =>
                router.push({
                  pathname: '/messages/[id]' as any,
                  params: {
                    id: item.id,
                    recipientId: item.recipientId,
                    name: item.name,
                    avatar: item.avatar || '',
                  },
                } as any)
              }>
              {/* Avatar Icon */}
              <View style={styles.avatarContainer}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>

              {/* Details */}
              <View style={styles.threadDetails}>
                <View style={styles.threadTopRow}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <View style={styles.threadBottomRow}>
                  <Text style={styles.lastMessageText} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  container: { flex: 1, backgroundColor: BLACK },
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
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: BLACK,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  tabTextActive: {
    color: BLACK,
    fontWeight: '900',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 0,
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.three, gap: 8 },

  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderRadius: 0,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 0,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: YELLOW,
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 0,
    backgroundColor: YELLOW,
    borderWidth: 1,
    borderColor: BLACK,
  },

  threadDetails: {
    flex: 1,
    gap: 4,
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    flex: 1,
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  threadBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 0,
  },
  unreadText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  emptyDesc: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, textAlign: 'center' },
});
