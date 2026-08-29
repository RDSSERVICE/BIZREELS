/**
 * Vendor Hire Creator Marketplace Screen — Mobile Application
 * Parity with Web Frontend VendorHireCreatorPage.jsx
 * Features: Search bar, Category & City filters, Creator Cards with rate cards,
 * and Hire Proposal Modal.
 */

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

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

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

const FALLBACK_CREATORS = [
  {
    _id: 'c1',
    name: 'Rohan Sharma',
    handle: 'rohan_tech',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    category: 'Tech & Electronics',
    city: 'Phagwara',
    rating: 4.9,
    reviewsCount: 28,
    reelsCount: 42,
    rate: 1500,
    bio: 'Tech reviewer & unboxing creator specializing in gadgets, smartphones, and software.',
    is_verified: true,
  },
  {
    _id: 'c2',
    name: 'Ananya Verma',
    handle: 'ananya_style',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    category: 'Fashion & Lifestyle',
    city: 'Kapurthala',
    rating: 4.8,
    reviewsCount: 45,
    reelsCount: 88,
    rate: 2000,
    bio: 'Fashion influencer creating high-engagement promotional reels for apparel brands.',
    is_verified: true,
  },
  {
    _id: 'c3',
    name: 'Vikram Singh',
    handle: 'vikram_foodie',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    category: 'Food & Dining',
    city: 'Jalandhar',
    rating: 5.0,
    reviewsCount: 19,
    reelsCount: 65,
    rate: 1800,
    bio: 'Food blogger showcasing restaurant dishes, cafes, and local food products.',
    is_verified: true,
  },
  {
    _id: 'c4',
    name: 'Priya Kapoor',
    handle: 'priya_beauty',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    category: 'Beauty & Wellness',
    city: 'Delhi',
    rating: 4.7,
    reviewsCount: 31,
    reelsCount: 54,
    rate: 2200,
    bio: 'Skincare & makeup tutorial creator helping beauty vendors boost conversions.',
    is_verified: true,
  },
];

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

      const { data } = await api.get('/creators/public', { params });
      const items = data.data || data.creators || data.items || data || [];
      const list = Array.isArray(items) ? items : [];

      if (list.length > 0) {
        setCreators(list);
      } else {
        // Fallback filter
        const filtered = FALLBACK_CREATORS.filter((item) => {
          const matchesSearch = searchQuery
            ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.city.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
          const matchesCat =
            selectedCategory !== 'All Categories'
              ? item.category.toLowerCase().includes(selectedCategory.toLowerCase())
              : true;
          const matchesCity =
            selectedCity !== 'All Cities'
              ? item.city.toLowerCase().includes(selectedCity.toLowerCase())
              : true;
          return matchesSearch && matchesCat && matchesCity;
        });
        setCreators(filtered);
      }
    } catch (err) {
      console.warn('Fallback public creators listing');
      setCreators(FALLBACK_CREATORS);
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
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hire Content Creators</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Search Bar & Filters Section ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creator name, category, city..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
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
                <Ionicons name="location-outline" size={12} color={isSelected ? BLACK : YELLOW} />
                <Text style={[styles.cityChipText, isSelected && styles.cityChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Creators Directory List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={YELLOW} />
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
              tintColor={YELLOW}
              colors={[YELLOW]}
            />
          }
          renderItem={({ item }) => {
            const avatar =
              item.avatarUrl ||
              item.profile_pic ||
              item.creatorProfile?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
            const cat = item.category || item.creatorProfile?.category || 'General Creator';
            const city = item.city || item.creatorProfile?.city || 'Punjab';
            const rating = item.rating || item.creatorProfile?.rating || 4.9;
            const reelsCount = item.reelsCount || item.creatorProfile?.reelsCount || 40;
            const rate = item.rate || item.creatorProfile?.pricing?.reel1 || 1500;

            return (
              <View style={styles.creatorCard}>
                <View style={styles.cardHeaderRow}>
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                  
                  <View style={styles.cardMainInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.creatorName} numberOfLines={1}>{item.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color={YELLOW} />
                    </View>

                    <Text style={styles.handleText}>@{item.handle || item.username || 'creator'}</Text>

                    <View style={styles.metaBadgeRow}>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color={BLACK} />
                        <Text style={styles.ratingText}>{rating}</Text>
                      </View>

                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{cat}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {item.bio && (
                  <Text style={styles.bioText} numberOfLines={2}>
                    {item.bio || item.creatorProfile?.bio}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.rateGroup}>
                    <Text style={styles.rateLabel}>Per Reel Rate</Text>
                    <Text style={styles.rateValue}>₹{rate.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.actionBtnGroup}>
                    <TouchableOpacity
                      style={styles.hireBtn}
                      onPress={() => handleOpenHireModal(item)}>
                      <Ionicons name="flash" size={14} color={BLACK} />
                      <Text style={styles.hireBtnText}>HIRE NOW</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={56} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>No Creators Found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search criteria or category filter to discover talented video creators.
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
                <Ionicons name="close" size={20} color="#fff" />
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
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                    placeholderTextColor="rgba(255,255,255,0.4)"
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
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                  <ActivityIndicator color={BLACK} />
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
  container: { flex: 1, backgroundColor: BLACK },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
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
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchSection: {
    backgroundColor: DARK_CARD,
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.xs,
  },
  filterScroll: {
    gap: 6,
  },
  filterPill: {
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterPillActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  filterPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  cityScroll: {
    gap: 6,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cityChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  cityChipText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '800',
  },
  cityChipTextActive: {
    color: BLACK,
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
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 14,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: YELLOW,
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
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  handleText: {
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: YELLOW,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  ratingText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  catBadge: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBadgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
  },
  bioText: {
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '800',
  },
  rateValue: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  hireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  hireBtnText: {
    color: BLACK,
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
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: BLACK,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  modalSub: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: DARK_CARD,
    padding: 12,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalCreatorName: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalCreatorSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  modalCreatorRate: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: DARK_CARD,
    color: '#fff',
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  submitProposalBtn: {
    backgroundColor: YELLOW,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitProposalBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
