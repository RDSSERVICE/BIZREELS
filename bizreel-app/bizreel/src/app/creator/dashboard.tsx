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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

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
  deliverables?: Array<{ title: string; status: string }>;
  submissionUrls?: Array<{ url: string; type: string }>;
  createdAt?: string;
}

export default function CreatorDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<'invitations' | 'campaigns'>('invitations');

  // Submit Deliverable Modal State
  const [submittingCampaign, setSubmittingCampaign] = useState<Campaign | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableCaption, setDeliverableCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, hiresRes] = await Promise.all([
        api.get('/creator/dashboard').catch(() => ({ data: {} })),
        api.get('/hires?role=creator').catch(() => ({ data: { data: { hireRequests: [] } } })),
      ]);

      const dashData = dashRes.data?.data || dashRes.data || {};
      setStats(dashData);

      const list = hiresRes.data?.data?.hireRequests || hiresRes.data?.hireRequests || hiresRes.data || [];
      setCampaigns(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load creator dashboard data:', err);
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

  const handleAcceptInvite = async (id: string) => {
    try {
      await api.patch(`/hires/${id}`, { status: 'accepted' });
      Alert.alert('Success', 'Campaign proposal accepted!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (id: string) => {
    Alert.alert('Reject Invitation', 'Are you sure you want to reject this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`/hires/${id}`, { status: 'rejected' });
            Alert.alert('Success', 'Invitation rejected');
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
          }
        },
      },
    ]);
  };

  const handleSubmitDeliverable = async () => {
    if (!submittingCampaign) return;
    if (!deliverableUrl.trim()) {
      Alert.alert('Required', 'Please enter a video reel URL or drive link');
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

      Alert.alert('Submitted!', 'Deliverable submitted successfully to vendor');
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
        <ActivityIndicator size="large" color={YELLOW} />
        <Text style={styles.loadingText}>Loading Creator Studio...</Text>
      </View>
    );
  }

  const pendingInvites = campaigns.filter((c) => c.status === 'pending');
  const activeShoots = campaigns.filter((c) => c.status === 'accepted');

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CREATOR STUDIO</Text>
          <Text style={styles.headerSub}>{user?.name || 'Creator Dashboard'}</Text>
        </View>
        <TouchableOpacity style={styles.headerActionBtn} onPress={() => router.push('/creator/settings')}>
          <Ionicons name="settings-outline" size={20} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={YELLOW} />}>
        
        {/* Verification Banner */}
        <TouchableOpacity style={styles.kycCard} onPress={() => router.push('/creator/verification')}>
          <Ionicons name="shield-checkmark" size={24} color={YELLOW} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kycTitle}>Creator Verification Status</Text>
            <Text style={styles.kycSub}>
              {stats?.verificationStatus === 'pro_verified' || stats?.verificationStatus === 'verified_creator'
                ? '✅ Verified Badge Active (5x more brand deals)'
                : 'Complete KYC verification to unlock brand campaign deals'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={YELLOW} />
        </TouchableOpacity>

        {/* Overview Stat Cards Grid */}
        <Text style={styles.sectionHeader}>STUDIO METRICS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color={YELLOW} />
            <Text style={styles.statVal}>₹{(stats?.totalEarnings || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="videocam-outline" size={20} color="#3B82F6" />
            <Text style={styles.statVal}>{activeShoots.length}</Text>
            <Text style={styles.statLabel}>Active Shoots</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.statVal}>{pendingInvites.length}</Text>
            <Text style={styles.statLabel}>Pending Invites</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye-outline" size={20} color="#10B981" />
            <Text style={styles.statVal}>{(stats?.portfolioViews || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Portfolio Views</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={20} color="#EC4899" />
            <Text style={styles.statVal}>{stats?.rating || 5.0} ★</Text>
            <Text style={styles.statLabel}>Client Rating</Text>
          </View>
        </View>

        {/* Quick Studio Action Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/portfolio')}>
            <Ionicons name="film-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/pricing')}>
            <Ionicons name="pricetag-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Rates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/availability')}>
            <Ionicons name="calendar-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Availability</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/orders')}>
            <Ionicons name="briefcase-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/wallet')}>
            <Ionicons name="wallet-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={() => router.push('/creator/subscription')}>
            <Ionicons name="card-outline" size={16} color={YELLOW} />
            <Text style={styles.actionChipText}>Subscription</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Campaign Collaborations Tabs */}
        <View style={styles.tabHeaderRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'invitations' && styles.tabBtnActive]}
            onPress={() => setActiveTab('invitations')}>
            <Text style={[styles.tabBtnText, activeTab === 'invitations' && styles.tabBtnTextActive]}>
              Invitations ({pendingInvites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'campaigns' && styles.tabBtnActive]}
            onPress={() => setActiveTab('campaigns')}>
            <Text style={[styles.tabBtnText, activeTab === 'campaigns' && styles.tabBtnTextActive]}>
              Active Campaigns ({activeShoots.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Items */}
        {(activeTab === 'invitations' ? pendingInvites : activeShoots).length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={32} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>No items in this category</Text>
          </View>
        ) : (
          (activeTab === 'invitations' ? pendingInvites : activeShoots).map((item) => (
            <View key={item._id || item.id} style={styles.campaignCard}>
              <View style={styles.campHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campTitle}>{item.title}</Text>
                  <Text style={styles.campSub}>Client: {item.vendor?.name || 'Vendor Brand'}</Text>
                </View>
                <Text style={styles.campBudget}>₹{item.budget}</Text>
              </View>

              {item.description ? (
                <Text style={styles.campDesc} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}

              {/* Action Row */}
              <View style={styles.campActionRow}>
                {item.status === 'pending' ? (
                  <>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleRejectInvite(item._id || item.id!)}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptInvite(item._id || item.id!)}>
                      <Text style={styles.acceptBtnText}>Accept Proposal</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.submitDeliverableBtn}
                    onPress={() => setSubmittingCampaign(item)}>
                    <Ionicons name="cloud-upload-outline" size={16} color={BLACK} />
                    <Text style={styles.submitDeliverableText}>Submit Deliverable</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Deliverable Submission Dialog Modal */}
      <Modal visible={!!submittingCampaign} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Deliverable Video</Text>
              <TouchableOpacity onPress={() => setSubmittingCampaign(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Video Reel URL / Drive Link *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={deliverableUrl}
              onChangeText={setDeliverableUrl}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Notes / Caption</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Caption updates or submission notes..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={deliverableCaption}
              onChangeText={setDeliverableCaption}
              multiline
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSubmitDeliverable}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={BLACK} />
              ) : (
                <Text style={styles.modalSubmitText}>Submit Video Reel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: { color: '#fff', fontSize: FontSize.xs, marginTop: 10 },
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
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 1 },
  headerSub: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  headerActionBtn: {
    width: 36,
    height: 36,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  kycCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: YELLOW,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  kycTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  kycSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
  sectionHeader: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: Spacing.three,
    gap: 4,
  },
  statVal: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  actionChipText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  tabHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: YELLOW },
  tabBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs, fontWeight: '700' },
  tabBtnTextActive: { color: YELLOW, fontWeight: '900' },
  emptyCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 30, alignItems: 'center', gap: 8 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  campaignCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: Spacing.four, gap: Spacing.two },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  campTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  campSub: { color: YELLOW, fontSize: 10, fontWeight: '700', marginTop: 2 },
  campBudget: { color: '#10B981', fontSize: FontSize.base, fontWeight: '900' },
  campDesc: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, lineHeight: 18 },
  campActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  rejectBtn: { flex: 1, height: 40, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: FontSize.xs, fontWeight: '900' },
  acceptBtn: { flex: 1, height: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  submitDeliverableBtn: { flex: 1, height: 44, backgroundColor: YELLOW, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  submitDeliverableText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.four },
  modalContent: { backgroundColor: DARK_CARD, borderWidth: 2, borderColor: YELLOW, padding: Spacing.five, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: YELLOW, fontSize: FontSize.base, fontWeight: '900' },
  modalLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  modalInput: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, color: '#fff', paddingHorizontal: Spacing.three, height: 44, fontSize: FontSize.xs },
  modalSubmitBtn: { backgroundColor: YELLOW, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  modalSubmitText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900' },
});
