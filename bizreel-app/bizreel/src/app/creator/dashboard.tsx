import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

interface DashboardStats {
  totalProjects: number;
  pendingRequests: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
  portfolioViews: number;
  activeClients: number;
  portfolioReels: number;
  portfolioImages: number;
  monthlyEarnings: number;
  verificationStatus: string;
}

interface Campaign {
  _id: string;
  id?: string;
  title: string;
  category?: string;
  description?: string;
  budget: number;
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled';
  vendor?: {
    _id?: string;
    name?: string;
    profile_pic?: string;
  };
  vendorName?: string;
  packageName?: string;
  totalAmount?: number;
  notes?: string;
  requirements?: string;
  deliverables?: Array<{ title: string; status: string }>;
  submissionUrls?: Array<{ url: string; type: string }>;
  createdAt?: string;
}

interface ReelItemData {
  _id: string;
  id?: string;
  caption?: string;
  video_url?: string;
  videoUrl?: string;
  thumbnail_url?: string;
  likes_count?: number;
  views_count?: number;
  creator_name?: string;
  creator?: { name?: string; profile_pic?: string };
  vendor?: { storeName?: string; name?: string };
}

export default function CreatorDashboardScreen({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [trendingReels, setTrendingReels] = useState<ReelItemData[]>([]);
  const [activeTab, setActiveTab] = useState<'invitations' | 'campaigns'>('invitations');

  // Submit Deliverable Modal State
  const [submittingCampaign, setSubmittingCampaign] = useState<Campaign | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableCaption, setDeliverableCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, hiresRes, reelsRes] = await Promise.all([
        api.get('/creator/me/dashboard').catch(() => ({ data: {} })),
        api.get('/hires?role=creator').catch(() => ({ data: { items: [] } })),
        api.get('/reels', { params: { limit: 10 } }).catch(() => ({ data: { items: [] } })),
      ]);

      const dData = dashRes.data?.data || dashRes.data || {};
      setStats(dData);

      const hItems = hiresRes.data?.data?.items || hiresRes.data?.items || hiresRes.data || [];
      setCampaigns(Array.isArray(hItems) ? hItems : []);

      const rItems = reelsRes.data?.data?.reels || reelsRes.data?.reels || reelsRes.data?.items || reelsRes.data || [];
      setTrendingReels(Array.isArray(rItems) ? rItems.slice(0, 10) : []);
    } catch (err) {
      console.warn('Failed to load creator dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcceptDecline = async (campaignId: string, action: 'accept' | 'decline') => {
    try {
      await api.post(`/hires/campaign/${campaignId}/${action}`);
      Alert.alert('Success', `Campaign ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || `Failed to ${action} campaign`);
    }
  };

  const handleSubmitDeliverable = async () => {
    if (!submittingCampaign || !deliverableUrl.trim()) {
      Alert.alert('Required', 'Please enter a valid video deliverable URL');
      return;
    }

    setSubmitting(true);
    try {
      const campaignId = submittingCampaign._id || submittingCampaign.id;
      await api.post(`/hires/campaign/${campaignId}/deliverable`, {
        url: deliverableUrl.trim(),
        type: 'reel',
        caption: deliverableCaption.trim(),
      });

      Alert.alert('Success', 'Deliverable video submitted to brand successfully!');
      setSubmittingCampaign(null);
      setDeliverableUrl('');
      setDeliverableCaption('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  const pendingInvites = campaigns.filter((c) => c.status === 'pending');
  const activeShoots = campaigns.filter((c) => c.status === 'accepted');

  const content = (
    <View style={embedded ? styles.embeddedContent : styles.standaloneContent}>
      {/* Creator Studio Profile Header Card */}
      <View style={styles.creatorHeaderCard}>
        <View style={styles.creatorHeaderRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/creator/profile')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.creatorName}>
                {(user as any)?.creatorProfile?.displayName || user?.name || 'Content Creator'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#0F172A" />
                <Text style={styles.verifiedBadgeText}>CREATOR</Text>
              </View>
            </View>
            <Text style={styles.creatorSub} numberOfLines={2}>
              {(user as any)?.creatorProfile?.category || (user as any)?.creatorProfile?.bio || 'Short-Form Video Reel Specialist'} • Tap to edit rates & bio ›
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/creator/profile')}>
            <Ionicons name="create-outline" size={14} color="#0F172A" />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Status Alert */}
        <TouchableOpacity
          style={styles.kycBanner}
          onPress={() => router.push('/creator/verification')}>
          <Ionicons name="shield-checkmark" size={16} color={GOLD} />
          <Text style={styles.kycBannerText} numberOfLines={1}>
            {stats?.verificationStatus === 'pro_verified' || stats?.verificationStatus === 'verified_creator'
              ? '✅ Verified Creator Badge Active'
              : 'Complete KYC verification to unlock brand campaign deals ›'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Overview Stat Cards Grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>STUDIO METRICS</Text>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cash-outline" size={16} color="#059669" />
            </View>
          </View>
          <Text style={styles.statVal}>₹{(stats?.totalEarnings || 0).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>Active Shoots</Text>
            <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="videocam-outline" size={16} color="#2563EB" />
            </View>
          </View>
          <Text style={styles.statVal}>{activeShoots.length}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>Pending Invites</Text>
            <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={16} color={GOLD} />
            </View>
          </View>
          <Text style={styles.statVal}>{pendingInvites.length}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeaderRow}>
            <Text style={styles.statLabel}>Portfolio Views</Text>
            <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="eye-outline" size={16} color="#7C3AED" />
            </View>
          </View>
          <Text style={styles.statVal}>{(stats?.portfolioViews || 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Quick Studio Action Buttons */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>CREATOR STUDIO TOOLS</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/portfolio')}>
          <Ionicons name="film-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/pricing')}>
          <Ionicons name="pricetag-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Rates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/availability')}>
          <Ionicons name="calendar-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Availability</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/orders')}>
          <Ionicons name="briefcase-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/wallet')}>
          <Ionicons name="wallet-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/subscription')}>
          <Ionicons name="card-outline" size={16} color={ESPRESSO} />
          <Text style={styles.actionChipText}>Subscription</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Trending Reels & Creator Inspiration Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionHeader}>🔥 TRENDING REELS & INSPIRATION</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
            <Text style={{ color: GOLD, fontSize: 11, fontWeight: '900' }}>Watch Feed ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {trendingReels.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reelsScrollRow}>
          {trendingReels.map((reel) => (
            <TouchableOpacity
              key={reel._id || reel.id}
              style={styles.reelCard}
              onPress={() => router.push(`/reel/${reel._id || reel.id}` as any)}>
              <View style={styles.reelThumbnailBox}>
                <Ionicons name="play-circle" size={32} color={GOLD} style={{ zIndex: 2 }} />
                <View style={styles.reelBadgeOverlay}>
                  <Ionicons name="eye" size={10} color="#FFFFFF" />
                  <Text style={styles.reelBadgeText}>{(reel.views_count || 1400).toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.reelMetaBox}>
                <Text style={styles.reelCreatorName} numberOfLines={1}>
                  @{reel.creator?.name || reel.vendor?.storeName || 'featured_creator'}
                </Text>
                <Text style={styles.reelCaption} numberOfLines={2}>
                  {reel.caption || 'Trending Short Product Video Reel Demonstration'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyReelsCard}>
          <Text style={{ color: TEXT_MAIN, fontSize: 12, fontWeight: '800' }}>No trending reels currently available.</Text>
          <TouchableOpacity style={styles.watchFeedBtn} onPress={() => router.push('/(tabs)' as any)}>
            <Text style={styles.watchFeedBtnText}>Browse Video Reel Feed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Campaign Invites & Active Hires Tabs */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>BRAND CAMPAIGNS & HIRES</Text>
      </View>

      <View style={styles.tabHeaderRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'invitations' && styles.tabBtnActive]}
          onPress={() => setActiveTab('invitations')}>
          <Text style={[styles.tabBtnText, activeTab === 'invitations' && styles.tabBtnTextActive]}>
            Pending Invites ({pendingInvites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'campaigns' && styles.tabBtnActive]}
          onPress={() => setActiveTab('campaigns')}>
          <Text style={[styles.tabBtnText, activeTab === 'campaigns' && styles.tabBtnTextActive]}>
            Active Shoots ({activeShoots.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'invitations' ? (
        pendingInvites.length > 0 ? (
          <View style={{ gap: 12 }}>
            {pendingInvites.map((c) => (
              <View key={c._id || c.id} style={styles.campaignCard}>
                <View style={styles.campaignHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.campaignVendor}>Brand: {c.vendorName || c.vendor?.name || 'Local Vendor'}</Text>
                    <Text style={styles.campaignTitle}>{c.title || c.packageName || 'Reel Shoot Project'}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>₹{(c.budget || c.totalAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                {c.notes || c.requirements ? (
                  <Text style={styles.campDesc} numberOfLines={2}>
                    {c.notes || c.requirements}
                  </Text>
                ) : null}
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.declineBtn]}
                    onPress={() => handleAcceptDecline(c._id || c.id!, 'decline')}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.deliverBtn]}
                    onPress={() => handleAcceptDecline(c._id || c.id!, 'accept')}>
                    <Text style={styles.deliverBtnText}>Accept Offer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="mail-open-outline" size={32} color={TEXT_MUTED} />
            <Text style={styles.emptyTitle}>No Pending Campaign Invites</Text>
            <Text style={styles.emptySub}>Share your profile link with vendors to receive direct shoot requests!</Text>
          </View>
        )
      ) : activeShoots.length > 0 ? (
        <View style={{ gap: 12 }}>
          {activeShoots.map((c) => (
            <View key={c._id || c.id} style={styles.campaignCard}>
              <View style={styles.campaignHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campaignVendor}>Brand: {c.vendorName || c.vendor?.name || 'Local Vendor'}</Text>
                  <Text style={styles.campaignTitle}>{c.title || c.packageName || 'Reel Shoot Project'}</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>₹{(c.budget || c.totalAmount || 0).toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View style={styles.campaignFooterRow}>
                <Text style={styles.statusText}>STATUS: ACCEPTED • READY FOR SUBMISSION</Text>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.deliverBtn]}
                  onPress={() => setSubmittingCampaign(c)}>
                  <Ionicons name="cloud-upload-outline" size={14} color="#0F172A" />
                  <Text style={styles.deliverBtnText}>Submit Deliverable</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="videocam-outline" size={32} color={TEXT_MUTED} />
          <Text style={styles.emptyTitle}>No Active Shoot Campaigns</Text>
          <Text style={styles.emptySub}>Accept pending invites to start creating video deliverables.</Text>
        </View>
      )}

      {/* Deliverable Submission Modal */}
      <Modal visible={!!submittingCampaign} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Submit Campaign Video</Text>
            <Text style={styles.label}>Video URL / Link (Google Drive, DropBox, or Reel Link):</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={TEXT_MUTED}
              value={deliverableUrl}
              onChangeText={setDeliverableUrl}
            />
            <Text style={styles.label}>Caption / Notes for Brand:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Here is the final reel draft..."
              placeholderTextColor={TEXT_MUTED}
              value={deliverableCaption}
              onChangeText={setDeliverableCaption}
            />
            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={[styles.smallBtn, styles.declineBtn, { flex: 1 }]}
                onPress={() => setSubmittingCampaign(null)}>
                <Text style={styles.declineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallBtn, styles.deliverBtn, { flex: 1 }]}
                onPress={handleSubmitDeliverable}
                disabled={submitting}>
                <Text style={styles.deliverBtnText}>{submitting ? 'Submitting...' : 'Submit to Brand'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (embedded) return content;

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR DASHBOARD</Text>
          <Text style={styles.headerSub}>Portfolio & Brand Deals</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} colors={[GOLD]} />}>
        {content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: BG_COLOR, alignItems: 'center', justifyContent: 'center' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    backgroundColor: ESPRESSO,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    gap: Spacing.three,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: GOLD, fontSize: FontSize.xs, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  standaloneContent: { gap: Spacing.four },
  embeddedContent: { gap: Spacing.four },

  creatorHeaderCard: {
    backgroundColor: ESPRESSO,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    gap: 12,
    ...Shadows.md,
  },
  creatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  creatorName: { color: '#FFFFFF', fontSize: FontSize.base, fontWeight: '900' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    gap: 4,
  },
  verifiedBadgeText: { color: '#0F172A', fontSize: 9, fontWeight: '900' },
  creatorSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginTop: 4 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 4,
  },
  editProfileBtnText: { color: '#0F172A', fontSize: 10, fontWeight: '900' },

  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    gap: 8,
  },
  kycBannerText: { flex: 1, color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  sectionHeaderRow: { marginTop: 4 },
  sectionHeader: { color: ESPRESSO, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 1 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48.5%',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    gap: 6,
    ...Shadows.sm,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: { color: TEXT_MAIN, fontSize: FontSize.lg, fontWeight: '900' },
  statLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', marginVertical: 4 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    marginRight: 8,
    ...Shadows.sm,
  },
  actionChipText: { color: TEXT_MAIN, fontSize: FontSize.xs, fontWeight: '800' },

  reelsScrollRow: { flexDirection: 'row', marginVertical: 4 },
  reelCard: {
    width: 150,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginRight: 10,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  reelThumbnailBox: {
    width: '100%',
    height: 160,
    backgroundColor: ESPRESSO,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reelBadgeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reelBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  reelMetaBox: { padding: 8, gap: 2 },
  reelCreatorName: { color: GOLD, fontSize: 10, fontWeight: '900' },
  reelCaption: { color: TEXT_MAIN, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  emptyReelsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.sm,
  },
  watchFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESPRESSO,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 6,
  },
  watchFeedBtnText: { color: GOLD, fontSize: FontSize.xs, fontWeight: '900' },

  tabHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: GOLD },
  tabBtnText: { color: TEXT_MUTED, fontSize: FontSize.xs, fontWeight: '700' },
  tabBtnTextActive: { color: ESPRESSO, fontWeight: '900' },

  emptyCard: { backgroundColor: CARD_BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER_COLOR, padding: 30, alignItems: 'center', gap: 8, ...Shadows.sm },
  emptyTitle: { color: TEXT_MAIN, fontSize: FontSize.sm, fontWeight: '900' },
  emptySub: { color: TEXT_MUTED, fontSize: FontSize.xs, textAlign: 'center' },

  campaignCard: { backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER_COLOR, padding: Spacing.four, gap: Spacing.two, ...Shadows.sm },
  campaignHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  campaignVendor: { color: GOLD, fontSize: 10, fontWeight: '900' },
  campaignTitle: { color: TEXT_MAIN, fontSize: FontSize.sm, fontWeight: '900', marginTop: 2 },
  campDesc: { color: TEXT_MUTED, fontSize: FontSize.xs, lineHeight: 18 },
  priceTag: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  priceTagText: { color: '#059669', fontSize: FontSize.xs, fontWeight: '900' },
  campaignFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusText: { color: TEXT_MUTED, fontSize: 10, fontWeight: '700' },

  btnGroup: { flexDirection: 'row', gap: 8 },
  smallBtn: { height: 38, paddingHorizontal: 14, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#EF4444' },
  declineBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '900' },
  deliverBtn: { backgroundColor: GOLD, flexDirection: 'row', gap: 6 },
  deliverBtnText: { color: '#0F172A', fontSize: 11, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: Spacing.four },
  modalContainer: { backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1.5, borderColor: GOLD, padding: Spacing.five, gap: Spacing.three, ...Shadows.lg },
  modalTitle: { color: TEXT_MAIN, fontSize: FontSize.base, fontWeight: '900' },
  label: { color: TEXT_MAIN, fontSize: FontSize.xs, fontWeight: '700' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 10, color: TEXT_MAIN, paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
});
