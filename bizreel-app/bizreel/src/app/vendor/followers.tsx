/**
 * Vendor Followers Screen — Mobile Application
 * Displays live store followers list with search and direct chat option.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

interface FollowerUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  profile_pic?: string;
  roles?: string[];
  role?: string;
  location?: string;
}

export default function VendorFollowersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [initiatingChatId, setInitiatingChatId] = useState<string | null>(null);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const res = await api
        .get('/v1/follow/me/followers')
        .catch(() => api.get('/follow/me/followers'));
      const items =
        res.data?.items ||
        res.data?.data?.items ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);
      setFollowers(Array.isArray(items) ? items : []);
    } catch (e) {
      console.log('Followers fetch error:', e);
      Alert.alert('Notice', 'Unable to fetch followers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, []);

  const filteredFollowers = followers.filter((f) =>
    (f.name || f.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatWithFollower = async (follower: FollowerUser) => {
    const followerId = (follower._id || follower.id)?.toString();
    if (!followerId) return;

    setInitiatingChatId(followerId);
    try {
      // 1. Post initial message or query conversation
      const res = await api.post('/v1/chat/messages', {
        recipientId: followerId,
        text: 'Hello! Thanks for following our store.',
      }).catch(() => api.post('/chat/messages', { recipientId: followerId, text: 'Hello! Thanks for following our store.' }));

      const conversationData = res.data?.data?.conversation || res.data?.conversation || res.data?.data || {};
      const conversationId = conversationData._id || conversationData.id || `direct_${followerId}`;

      const avatar = resolveImageUrl(follower.profile_pic || follower.avatarUrl) || '';

      // 2. Navigate directly to message thread screen
      router.push({
        pathname: '/messages/[id]' as any,
        params: {
          id: conversationId,
          recipientId: followerId,
          name: follower.name || 'Customer',
          avatar,
        },
      } as any);
    } catch (e: any) {
      console.log('Chat initiation error:', e);
      // Even if endpoint fails or already exists, navigate to direct thread
      const avatar = resolveImageUrl(follower.profile_pic || follower.avatarUrl) || '';
      router.push({
        pathname: '/messages/[id]' as any,
        params: {
          id: `direct_${followerId}`,
          recipientId: followerId,
          name: follower.name || 'Customer',
          avatar,
        },
      } as any);
    } finally {
      setInitiatingChatId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Audience ({followers.length})</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchFollowers}>
          <Ionicons name="refresh-outline" size={18} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredFollowers}
        keyExtractor={(item, index) => (item._id || item.id || `${index}`).toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Stats Overview Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>TOTAL FOLLOWERS</Text>
                  <View style={styles.statIconBox}>
                    <Ionicons name="people" size={16} color="#F59E0B" />
                  </View>
                </View>
                <Text style={styles.statValue}>{followers.length.toLocaleString('en-IN')}</Text>
                <Text style={styles.statSub}>Active Store Audience</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>AUDIENCE REACH</Text>
                  <View style={[styles.statIconBox, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="trending-up" size={16} color="#10B981" />
                  </View>
                </View>
                <Text style={[styles.statValue, { color: '#10B981' }]}>100% Direct</Text>
                <Text style={styles.statSub}>Direct Customer Chat</Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search followers by name..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm ? (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>ALL FOLLOWERS ({filteredFollowers.length})</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#F59E0B" />
              <Text style={styles.loadingText}>Loading store followers...</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={36} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>
                {searchTerm
                  ? 'No followers match your search criteria.'
                  : 'You do not have any followers yet. Post engaging video reels to build your store audience!'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const followerId = (item._id || item.id)?.toString();
          const avatarUri = resolveImageUrl(item.profile_pic || item.avatarUrl);
          const displayName = item.name || 'Store Follower';
          const isProcessing = initiatingChatId === followerId;
          const roleBadge = Array.isArray(item.roles) && item.roles.length > 0 ? item.roles[0] : item.role || 'CUSTOMER';

          return (
            <View style={styles.followerCard}>
              <View style={styles.avatarBox}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{roleBadge.toUpperCase()}</Text>
                </View>
              </View>

              {/* Chat Option Button */}
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => handleChatWithFollower(item)}
                disabled={isProcessing}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#0F0F12" />
                ) : (
                  <>
                    <Ionicons name="chatbubbles-outline" size={14} color="#0F0F12" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
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

  listContent: { padding: Spacing.four, gap: Spacing.two },
  headerSection: { gap: Spacing.three, marginBottom: Spacing.two },

  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCard: {
    flex: 1,
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    gap: 2,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '900', marginTop: 4 },
  statSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },

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

  sectionTitle: { color: '#F59E0B', fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1, marginTop: 4 },

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
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  followerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#2D2D36',
    marginBottom: Spacing.two,
  },
  avatarBox: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0F0F12', fontWeight: FontWeight.bold, fontSize: FontSize.md },

  infoCol: { flex: 1, gap: 4 },
  nameText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#26262E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  roleBadgeText: { color: '#F59E0B', fontSize: 8, fontWeight: FontWeight.bold },

  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  chatBtnText: { color: '#0F0F12', fontSize: 11, fontWeight: FontWeight.bold },
});
