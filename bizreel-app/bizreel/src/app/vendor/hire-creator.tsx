import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

import { BrandColors, FontSize, FontWeight, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const GOLD = '#D99A3D';
const ESPRESSO = '#241B15';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT_MAIN = '#0F172A';
const TEXT_MUTED = '#64748B';

const CATEGORIES = [
  'All Categories',
  'Tech & Electronics',
  'Fashion & Lifestyle',
  'Food & Dining',
  'Beauty & Wellness',
  'Real Estate',
  'Fitness & Health',
  'Automobile',
];

const CITIES = ['All Cities', 'Phagwara', 'Kapurthala', 'Jalandhar', 'Delhi', 'Mumbai', 'Bangalore'];

export default function VendorHireCreatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Hire Modal State
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [reelsCount, setReelsCount] = useState('1');
  const [requirements, setRequirements] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const fetchCreators = async () => {
    try {
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedCity !== 'All Cities') params.city = selectedCity;

      let list: any[] = [];
      try {
        const res = await api.get('/creator-marketplace/discover', { params });
        const items = res.data?.data || res.data?.creators || res.data?.items || [];
        list = Array.isArray(items) ? items : [];
      } catch (e) {
        const res = await api.get('/creators/public', { params });
        const items = res.data?.data || res.data?.creators || res.data?.items || [];
        list = Array.isArray(items) ? items : [];
      }

      setCreators(list);
    } catch (err) {
      console.error('Error fetching registered creators:', err);
      setCreators([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [selectedCategory, selectedCity]);

  const handleSearchSubmit = () => {
    setLoading(true);
    fetchCreators();
  };

  const handleOpenHireModal = (creator: any) => {
    setSelectedCreator(creator);
    setCampaignTitle(`Reel Promotion — ${creator.name}`);
    const rateVal = creator.rate || creator.creatorProfile?.pricing?.reel1 || 1500;
    setOfferedRate(String(rateVal));
    setReelsCount('1');
    setRequirements('');
    setHireModalVisible(true);
  };

  const handleSendProposal = async () => {
    if (!campaignTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a campaign proposal title.');
      return;
    }

    const rate = parseFloat(offeredRate);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid rate budget (₹).');
      return;
    }

    setSubmittingProposal(true);
    try {
      await api.post('/inquiries', {
        creatorId: selectedCreator?._id || selectedCreator?.id,
        title: campaignTitle.trim(),
        budget: rate,
        reelsCount: parseInt(reelsCount || '1', 10),
        requirements: requirements.trim() || undefined,
        type: 'hire_creator',
      });

      Alert.alert(
        '🚀 Proposal Sent!',
        `Your hire proposal has been delivered to ${selectedCreator?.name || 'the creator'}!`
      );
      setHireModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        'Proposal Sent!',
        `Your project proposal has been delivered to ${selectedCreator?.name || 'the creator'}!`
      );
      setHireModalVisible(false);
    } finally {
      setSubmittingProposal(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT_MAIN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hire Content Creators</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Search Bar & Filters Section ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creator name, category, city..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat)}>
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* City Filter Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
          {CITIES.map((c) => {
            const isSelected = selectedCity === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, isSelected && styles.cityChipActive]}
                onPress={() => setSelectedCity(c)}>
                <Ionicons name="location-outline" size={12} color={isSelected ? '#fff' : GOLD} />
                <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Creators Directory List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={creators}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCreators();
              }}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
          renderItem={({ item }) => {
            const avatar =
              item.avatarUrl ||
              item.profile_pic ||
              item.creatorProfile?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
            const cat = item.category || item.creatorProfile?.category || item.occupation || 'Creator';
            const city = item.city || item.creatorProfile?.location?.city || item.creatorProfile?.city || 'India';
            const rating = (item.rating_avg ?? item.rating ?? item.creatorProfile?.rating ?? 5.0).toFixed(1);
            const reelsCount = item.totalReels ?? item.reelsCount ?? item.creatorProfile?.reelsCount ?? 0;
            const rate = item.rate || item.pricing?.reel1 || item.creatorProfile?.pricing?.reel1 || 1000;
            const bioText = item.bio || item.creatorProfile?.bio;
            const isVerified = Boolean(item.isVerified || item.is_verified || item.kyc_status === 'approved');

            const creatorId = item._id || item.id;
            const handleNavigateProfile = () => {
              if (creatorId) {
                router.push({ pathname: '/creator/[id]', params: { id: creatorId.toString() } } as any);
              }
            };

            return (
              <View style={styles.creatorCard}>
                <TouchableOpacity activeOpacity={0.8} onPress={handleNavigateProfile}>
                  <View style={styles.cardHeaderRow}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    
                    <View style={styles.cardMainInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.creatorName} numberOfLines={1}>{item.name}</Text>
                        {isVerified && <Ionicons name="checkmark-circle" size={16} color={GOLD} />}
                      </View>

                      <Text style={styles.handleText}>@{item.handle || item.username || 'creator'}</Text>

                      <View style={styles.metaBadgeRow}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={11} color="#fff" />
                          <Text style={styles.ratingText}>{rating}</Text>
                        </View>

                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{cat}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {Boolean(bioText) && (
                  <Text style={styles.bioText} numberOfLines={2}>
                    {bioText}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.rateGroup}>
                    <Text style={styles.rateLabel}>Per Reel Rate</Text>
                    <Text style={styles.rateValue}>₹{rate.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.actionBtnGroup}>
                    <TouchableOpacity
                      style={styles.viewProfileBtn}
                      onPress={handleNavigateProfile}>
                      <Ionicons name="person-outline" size={14} color={TEXT_MAIN} />
                      <Text style={styles.viewProfileBtnText}>PROFILE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.hireBtn}
                      onPress={() => handleOpenHireModal(item)}>
                      <Ionicons name="flash" size={14} color={GOLD} />
                      <Text style={styles.hireBtnText}>HIRE NOW</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color={TEXT_MUTED} />
              <Text style={styles.emptyTitle}>No Creators Found</Text>
              <Text style={styles.emptySub}>
                No registered creators match your criteria. New creators will appear here automatically as soon as they sign up!
              </Text>
            </View>
          }
        />
      )}

      {/* ── HIRE PROPOSAL MODAL ── */}
      <Modal visible={hireModalVisible} animationType="slide" transparent onRequestClose={() => setHireModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 20 }]}>
            {/* Modal Header Bar */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Campaign Proposal</Text>
                <Text style={styles.modalSub}>Target Creator: {selectedCreator?.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHireModalVisible(false)}>
                <Ionicons name="close" size={20} color={TEXT_MAIN} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Creator Summary Box */}
              <View style={styles.creatorSummaryBox}>
                <Image
                  source={{
                    uri:
                      selectedCreator?.avatarUrl ||
                      selectedCreator?.profile_pic ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                  }}
                  style={styles.modalAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalCreatorName}>{selectedCreator?.name}</Text>
                  <Text style={styles.modalCreatorSub}>
                    {selectedCreator?.category || 'Content Creator'} • {selectedCreator?.city || 'Punjab'}
                  </Text>
                  <Text style={styles.modalCreatorRate}>
                    Standard Rate: ₹{(selectedCreator?.rate || 1500).toLocaleString('en-IN')}/reel
                  </Text>
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CAMPAIGN / PROJECT TITLE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Diwali Collection Video Reel Showcase"
                  placeholderTextColor={TEXT_MUTED}
                  value={campaignTitle}
                  onChangeText={setCampaignTitle}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>PROPOSED RATE BUDGET (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1500"
                    placeholderTextColor={TEXT_MUTED}
                    value={offeredRate}
                    onChangeText={setOfferedRate}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>NUMBER OF REELS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={TEXT_MUTED}
                    value={reelsCount}
                    onChangeText={setReelsCount}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PROJECT REQUIREMENTS & DELIVERABLES</Text>
                <TextInput
                  style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  placeholder="Describe your product specs, key talking points, and delivery deadline..."
                  placeholderTextColor={TEXT_MUTED}
                  value={requirements}
                  onChangeText={setRequirements}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.submitProposalBtn}
                onPress={handleSendProposal}
                disabled={submittingProposal}>
                {submittingProposal ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitProposalBtnText}>🚀 SEND PROPOSAL REQUEST NOW</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchSection: {
    backgroundColor: CARD_BG,
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
  },
  filterScroll: {
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterPillActive: {
    backgroundColor: ESPRESSO,
    borderColor: ESPRESSO,
  },
  filterPillText: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: GOLD,
    fontWeight: '900',
  },
  cityScroll: {
    gap: 6,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cityChipActive: {
    backgroundColor: ESPRESSO,
    borderColor: ESPRESSO,
  },
  cityChipText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
  },
  cityChipTextActive: {
    color: '#fff',
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.four,
    gap: 12,
  },
  creatorCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: GOLD,
  },
  cardMainInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creatorName: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  handleText: {
    color: TEXT_MUTED,
    fontSize: 10,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ESPRESSO,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
  },
  catBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
  },
  bioText: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    marginTop: 4,
  },
  rateGroup: {},
  rateLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
  },
  rateValue: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProfileBtnText: {
    color: TEXT_MAIN,
    fontSize: 10,
    fontWeight: '800',
  },
  hireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ESPRESSO,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hireBtnText: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptySub: {
    color: TEXT_MUTED,
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 3,
    borderTopColor: GOLD,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    color: TEXT_MAIN,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalSub: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: Spacing.four,
    gap: 14,
  },
  creatorSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalCreatorName: {
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalCreatorSub: {
    color: TEXT_MUTED,
    fontSize: 10,
  },
  modalCreatorRate: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    color: TEXT_MAIN,
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  submitProposalBtn: {
    backgroundColor: ESPRESSO,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitProposalBtnText: {
    color: GOLD,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
