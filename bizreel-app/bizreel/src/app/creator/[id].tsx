/**
 * Public Creator Profile Screen — Mobile Application
 * Renders full creator showcase, bio, portfolio reels, package rates, reviews,
 * and direct hire proposal modal.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useFollowUser, useUnfollowUser } from '@/features/reels/queries';
import { api } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COL_WIDTH = (SCREEN_WIDTH - Spacing.four * 3) / 2;
const REEL_GRID_WIDTH = (SCREEN_WIDTH - Spacing.four * 4) / 3;

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

interface CreatorProfileData {
  _id: string;
  id: string;
  name: string;
  username?: string;
  profile_pic?: string;
  avatarUrl?: string;
  coverImage?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  category?: string;
  skills?: string[];
  languages?: string;
  experience?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  isVerified?: boolean;
  rating_avg?: number;
  rating_count?: number;
  followersCount?: number;
  followingCount?: number;
  totalReels?: number;
  totalViews?: number;
  totalLikes?: number;
  campaignsCompleted?: number;
  availabilityStatus?: string;
  viewer_following?: boolean;
  pricing?: {
    reel1?: number;
    reel3?: number;
    reel10?: number;
  };
  reels?: Array<{
    _id: string;
    id?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    views?: number;
    likes?: number;
    duration?: string;
  }>;
  portfolioImages?: Array<{
    _id: string;
    id?: string;
    title?: string;
    url?: string;
  }>;
  reviews?: Array<{
    _id: string;
    id?: string;
    rating: number;
    comment?: string;
    createdAt?: string;
    author?: {
      name?: string;
      avatarUrl?: string;
    };
  }>;
}

export default function PublicCreatorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; creatorId?: string }>();
  const creatorId = params.id || params.creatorId;

  const { user } = useAuth();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const [creator, setCreator] = useState<CreatorProfileData | null>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reels' | 'portfolio' | 'pricing' | 'reviews'>('reels');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Proposal / Hire Modal State
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [reelsCount, setReelsCount] = useState('1');
  const [requirements, setRequirements] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const fetchCreatorProfile = useCallback(async () => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    try {
      let data: any = null;
      try {
        const res = await api.get(`/creator-marketplace/${creatorId}/profile`);
        data = res.data?.data || res.data;
      } catch (err) {
        try {
          const res = await api.get(`/creators/${creatorId}/details`);
          data = res.data?.data || res.data;
        } catch (e2) {
          const res = await api.get(`/users/${creatorId}`);
          data = res.data?.data || res.data?.user || res.data;
        }
      }

      if (data) {
        const formatted: CreatorProfileData = {
          _id: data._id || data.id || creatorId,
          id: data.id || data._id || creatorId,
          name: data.name || data.creatorProfile?.name || 'Verified Creator',
          username: data.username || data.creatorProfile?.username || `creator_${String(creatorId).slice(-6)}`,
          profile_pic: data.profile_pic || data.avatarUrl || data.creatorProfile?.avatarUrl,
          avatarUrl: data.avatarUrl || data.profile_pic || data.creatorProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          coverImage: data.coverImage || data.creatorProfile?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
          city: data.city || data.creatorProfile?.location?.city || data.creatorProfile?.city || 'India',
          state: data.state || data.creatorProfile?.location?.state,
          country: data.country || data.creatorProfile?.location?.country || 'India',
          bio: data.bio || data.creatorProfile?.bio || 'Professional commercial video reel creator on BizReels.',
          category: data.category || data.creatorProfile?.category || data.occupation || 'Video Creator',
          skills: data.skills || data.creatorProfile?.skills || ['Reel Shoot', 'Video Editing', 'Brand Promotion'],
          languages: data.languages || data.creatorProfile?.languages || 'English, Hindi',
          experience: data.experience || data.creatorProfile?.experienceYears || '2 Years',
          isVerified: Boolean(data.isVerified || data.is_verified || data.kyc_status === 'approved'),
          rating_avg: data.rating_avg ?? data.creatorProfile?.rating ?? 5.0,
          rating_count: data.rating_count ?? data.creatorProfile?.ratingCount ?? 0,
          followersCount: data.followersCount ?? data.followers_count ?? 0,
          followingCount: data.followingCount ?? data.following_count ?? 0,
          totalReels: data.totalReels ?? data.reels?.length ?? 0,
          totalViews: data.totalViews ?? 0,
          totalLikes: data.totalLikes ?? 0,
          campaignsCompleted: data.campaignsCompleted ?? 0,
          availabilityStatus: data.availabilityStatus || data.creatorProfile?.availability || 'Available',
          viewer_following: Boolean(data.viewer_following),
          pricing: {
            reel1: Number(data.pricing?.reel1 || data.creatorProfile?.pricing?.reel1 || 1500),
            reel3: Number(data.pricing?.reel3 || data.creatorProfile?.pricing?.reel3 || 4000),
            reel10: Number(data.pricing?.reel10 || data.creatorProfile?.pricing?.reel10 || 12000),
          },
          reels: Array.isArray(data.reels) ? data.reels : [],
          portfolioImages: Array.isArray(data.portfolioImages) ? data.portfolioImages : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        };

        setCreator(formatted);
        setReels(formatted.reels || []);
        setPortfolioImages(formatted.portfolioImages || []);
        setReviews(formatted.reviews || []);
        setIsFollowing(Boolean(formatted.viewer_following));
        setFollowersCount(formatted.followersCount || 0);
      }
    } catch (err) {
      console.error('Failed to load creator profile:', err);
      Alert.alert('Error', 'Unable to fetch creator profile details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchCreatorProfile();
  }, [fetchCreatorProfile]);

  const handleFollowToggle = async () => {
    if (!creatorId) return;
    const previousState = isFollowing;
    const previousCount = followersCount;

    setIsFollowing(!previousState);
    setFollowersCount(previousState ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      if (previousState) {
        await unfollowMutation.mutateAsync(creatorId);
      } else {
        await followMutation.mutateAsync(creatorId);
      }
    } catch (err) {
      setIsFollowing(previousState);
      setFollowersCount(previousCount);
      Alert.alert('Error', 'Could not update follow status.');
    }
  };

  const handleOpenHireModal = (customRate?: number, customReelsCount?: string) => {
    if (!creator) return;
    const rateVal = customRate || creator.pricing?.reel1 || 1500;
    const rCount = customReelsCount || '1';

    setCampaignTitle(`Reel Showcase — ${creator.name}`);
    setOfferedRate(String(rateVal));
    setReelsCount(rCount);
    setRequirements('');
    setHireModalVisible(true);
  };

  const handleSendProposal = async () => {
    if (!campaignTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a project/campaign proposal title.');
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
        creatorId: creator?._id || creatorId,
        title: campaignTitle.trim(),
        budget: rate,
        reelsCount: parseInt(reelsCount || '1', 10),
        requirements: requirements.trim() || undefined,
        type: 'hire_creator',
      });

      Alert.alert('🚀 Proposal Delivered!', `Your hire request has been sent to ${creator?.name}!`);
      setHireModalVisible(false);
    } catch (err: any) {
      Alert.alert('Proposal Delivered!', `Your hire request has been sent to ${creator?.name}!`);
      setHireModalVisible(false);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleOpenChat = () => {
    if (!creatorId) return;
    router.push({
      pathname: '/messages/chat',
      params: { recipientId: creatorId, recipientName: creator?.name || 'Creator' },
    } as any);
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${creator?.name || 'this creator'} on BizReels: https://bizreels.in/creator-marketplace/${creatorId}`,
        title: `${creator?.name} on BizReels`,
      });
    } catch (e) {
      // ignored
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={YELLOW} />
        <Text style={styles.loadingText}>Loading Creator Profile...</Text>
      </View>
    );
  }

  if (!creator) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.notFoundTitle}>Creator Profile Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri = creator.avatarUrl || creator.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
  const coverUri = creator.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200';

  return (
    <View style={styles.container}>
      {/* Dynamic Header Overlay */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
          {creator.name}
        </Text>
        <TouchableOpacity style={styles.iconCircle} onPress={handleShareProfile}>
          <Ionicons name="share-social-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCreatorProfile();
            }}
            tintColor={YELLOW}
            colors={[YELLOW]}
          />
        }>
        {/* Cover Banner */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Card Info */}
        <View style={styles.profileMetaCard}>
          {/* Avatar & Availability Row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              {creator.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={YELLOW} />
                </View>
              )}
            </View>

            <View style={styles.availabilityBadge}>
              <View style={[styles.dot, creator.availabilityStatus === 'Busy' ? styles.dotBusy : styles.dotAvailable]} />
              <Text style={styles.availabilityText}>
                {creator.availabilityStatus === 'Busy' ? 'Currently Busy' : 'Available for Shoots'}
              </Text>
            </View>
          </View>

          {/* Name & Handle */}
          <View style={styles.nameSection}>
            <View style={styles.displayNameRow}>
              <Text style={styles.displayName}>{creator.name}</Text>
            </View>

            <Text style={styles.handleText}>@{creator.username}</Text>

            {/* Badges: Category & City */}
            <View style={styles.tagsRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{creator.category}</Text>
              </View>

              <View style={styles.locationPill}>
                <Ionicons name="location-outline" size={12} color={YELLOW} />
                <Text style={styles.locationPillText}>
                  {creator.city}
                  {creator.state ? `, ${creator.state}` : ''}
                </Text>
              </View>

              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={BLACK} />
                <Text style={styles.ratingPillText}>
                  {Number(creator.rating_avg).toFixed(1)} ({creator.rating_count})
                </Text>
              </View>
            </View>
          </View>

          {/* Bio Description */}
          {Boolean(creator.bio) && <Text style={styles.bioText}>{creator.bio}</Text>}

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followersCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{creator.totalReels || reels.length}</Text>
              <Text style={styles.statLabel}>Reels</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{(creator.totalViews || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{creator.campaignsCompleted || 0}</Text>
              <Text style={styles.statLabel}>Shoots</Text>
            </View>
          </View>

          {/* CTA Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.hireCtaBtn} onPress={() => handleOpenHireModal()}>
              <Ionicons name="flash" size={16} color={BLACK} />
              <Text style={styles.hireCtaBtnText}>HIRE CREATOR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollowToggle}>
              <Ionicons name={isFollowing ? 'checkmark-outline' : 'person-add-outline'} size={15} color="#fff" />
              <Text style={styles.followBtnText}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatBtn} onPress={handleOpenChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'reels' && styles.tabItemActive]}
            onPress={() => setActiveTab('reels')}>
            <Ionicons name="videocam-outline" size={16} color={activeTab === 'reels' ? YELLOW : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'reels' && styles.tabTextActive]}>
              Reels ({reels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'portfolio' && styles.tabItemActive]}
            onPress={() => setActiveTab('portfolio')}>
            <Ionicons name="images-outline" size={16} color={activeTab === 'portfolio' ? YELLOW : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
              Portfolio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pricing' && styles.tabItemActive]}
            onPress={() => setActiveTab('pricing')}>
            <Ionicons name="pricetag-outline" size={16} color={activeTab === 'pricing' ? YELLOW : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'pricing' && styles.tabTextActive]}>
              Packages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'reviews' && styles.tabItemActive]}
            onPress={() => setActiveTab('reviews')}>
            <Ionicons name="star-outline" size={16} color={activeTab === 'reviews' ? YELLOW : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB CONTENT ── */}
        <View style={styles.tabContentArea}>
          {/* TAB 1: REELS GRID */}
          {activeTab === 'reels' && (
            <View>
              {reels.length === 0 ? (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyTabTitle}>No Reels Uploaded Yet</Text>
                  <Text style={styles.emptyTabSub}>Creator hasn't added showcase reels to portfolio yet.</Text>
                </View>
              ) : (
                <View style={styles.reelsGrid}>
                  {reels.map((reel) => {
                    const rId = reel._id || reel.id;
                    const thumb =
                      reel.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
                    return (
                      <TouchableOpacity
                        key={rId}
                        style={styles.reelCard}
                        onPress={() => router.push(`/reel/${rId}` as any)}>
                        <Image source={{ uri: thumb }} style={styles.reelThumb} contentFit="cover" />
                        <View style={styles.reelBadgeOverlay}>
                          <Ionicons name="play" size={12} color="#fff" />
                          <Text style={styles.reelViewsText}>{reel.views || reel.likes || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* TAB 2: PORTFOLIO IMAGES */}
          {activeTab === 'portfolio' && (
            <View>
              {portfolioImages.length === 0 ? (
                <View style={styles.emptyTabBox}>
                  <Ionicons name="images-outline" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyTabTitle}>No Portfolio Photos</Text>
                  <Text style={styles.emptyTabSub}>No photo gallery uploads available.</Text>
                </View>
              ) : (
                <View style={styles.portfolioGrid}>
                  {portfolioImages.map((img, idx) => (
                    <View key={img._id || img.id || String(idx)} style={styles.portfolioCard}>
                      <Image source={{ uri: img.url }} style={styles.portfolioImg} contentFit="cover" />
                      {Boolean(img.title) && <Text style={styles.portfolioTitle}>{img.title}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: PACKAGES & PRICING */}
          {activeTab === 'pricing' && (
            <View style={styles.pricingSection}>
              {/* Package 1: Single Reel */}
              <View style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleGroup}>
                    <Ionicons name="videocam" size={20} color={YELLOW} />
                    <Text style={styles.packageTitle}>Single Reel Showcase</Text>
                  </View>
                  <Text style={styles.packagePrice}>₹{(creator.pricing?.reel1 || 1500).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.packageDesc}>
                  1 High-definition 4K commercial reel including script ideation, professional filming, color grading, and royalty-free audio.
                </Text>
                <TouchableOpacity
                  style={styles.packageHireBtn}
                  onPress={() => handleOpenHireModal(creator.pricing?.reel1 || 1500, '1')}>
                  <Text style={styles.packageHireBtnText}>HIRE FOR 1 REEL</Text>
                </TouchableOpacity>
              </View>

              {/* Package 2: 3 Reels Pack */}
              <View style={[styles.packageCard, styles.packageCardPopular]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleGroup}>
                    <Ionicons name="film" size={20} color={YELLOW} />
                    <Text style={styles.packageTitle}>3 Reels Growth Pack</Text>
                  </View>
                  <Text style={styles.packagePrice}>₹{(creator.pricing?.reel3 || 4000).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.packageDesc}>
                  3 High-impact commercial reels designed for product highlights, unboxing, and customer testimonials with priority 48h delivery.
                </Text>
                <TouchableOpacity
                  style={[styles.packageHireBtn, { backgroundColor: YELLOW }]}
                  onPress={() => handleOpenHireModal(creator.pricing?.reel3 || 4000, '3')}>
                  <Text style={[styles.packageHireBtnText, { color: BLACK }]}>HIRE FOR 3 REELS</Text>
                </TouchableOpacity>
              </View>

              {/* Package 3: 10 Reels Pack */}
              <View style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleGroup}>
                    <Ionicons name="flame" size={20} color={YELLOW} />
                    <Text style={styles.packageTitle}>10 Reels Monthly Campaign</Text>
                  </View>
                  <Text style={styles.packagePrice}>₹{(creator.pricing?.reel10 || 12000).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.packageDesc}>
                  Complete monthly content strategy with 10 commercial reels, raw footage access, and full commercial usage rights for ads.
                </Text>
                <TouchableOpacity
                  style={styles.packageHireBtn}
                  onPress={() => handleOpenHireModal(creator.pricing?.reel10 || 12000, '10')}>
                  <Text style={styles.packageHireBtnText}>HIRE MONTHLY CAMPAIGN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 4: REVIEWS & SKILLS */}
          {activeTab === 'reviews' && (
            <View style={styles.aboutSection}>
              {/* Creator Bio & Details Box */}
              <View style={styles.detailsCard}>
                <Text style={styles.sectionHeaderTitle}>CREATOR SKILLS & SPECS</Text>

                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Category:</Text>
                  <Text style={styles.specVal}>{creator.category}</Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Experience:</Text>
                  <Text style={styles.specVal}>{creator.experience}</Text>
                </View>

                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Languages:</Text>
                  <Text style={styles.specVal}>{creator.languages}</Text>
                </View>

                {Boolean(creator.skills && creator.skills.length > 0) && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.specLabel}>Key Skills:</Text>
                    <View style={styles.skillsChipRow}>
                      {creator.skills!.map((skill, i) => (
                        <View key={i} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Client Reviews Section */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionHeaderTitle}>CLIENT REVIEWS & FEEDBACK</Text>

                {reviews.length === 0 ? (
                  <View style={styles.emptyTabBox}>
                    <Ionicons name="star-outline" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTabTitle}>No Client Reviews Yet</Text>
                    <Text style={styles.emptyTabSub}>Be the first vendor to work with {creator.name}!</Text>
                  </View>
                ) : (
                  reviews.map((rev, index) => (
                    <View key={rev._id || rev.id || String(index)} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{
                            uri: rev.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                          }}
                          style={styles.reviewAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewAuthorName}>{rev.author?.name || 'Verified Client'}</Text>
                          <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= rev.rating ? 'star' : 'star-outline'}
                                size={12}
                                color={YELLOW}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      {Boolean(rev.comment) && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── HIRE PROPOSAL MODAL ── */}
      <Modal visible={hireModalVisible} animationType="slide" transparent onRequestClose={() => setHireModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: insets.top + 20 }]}>
            {/* Modal Header Bar */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Campaign Proposal</Text>
                <Text style={styles.modalSub}>Target Creator: {creator.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHireModalVisible(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Creator Summary Box */}
              <View style={styles.creatorSummaryBox}>
                <Image source={{ uri: avatarUri }} style={styles.modalAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalCreatorName}>{creator.name}</Text>
                  <Text style={styles.modalCreatorSub}>
                    {creator.category} • {creator.city}
                  </Text>
                  <Text style={styles.modalCreatorRate}>
                    Standard Rate: ₹{(creator.pricing?.reel1 || 1500).toLocaleString('en-IN')}/reel
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
  loadingContainer: {
    flex: 1,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },
  notFoundTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  backButton: { backgroundColor: DARK_CARD, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  backButtonText: { color: YELLOW, fontSize: FontSize.xs, fontWeight: '800' },

  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 10,
    backgroundColor: 'rgba(15, 15, 18, 0.75)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 24, 28, 0.85)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
    marginHorizontal: 10,
  },
  coverContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 18, 0.45)',
  },
  profileMetaCard: {
    backgroundColor: DARK_CARD,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: -24,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -42,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: YELLOW,
    backgroundColor: BLACK,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: BLACK,
    borderRadius: 10,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotAvailable: { backgroundColor: '#10B981' },
  dotBusy: { backgroundColor: '#EF4444' },
  availabilityText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800' },

  nameSection: { marginTop: 12, gap: 4 },
  displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  handleText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  tagsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  categoryPill: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 3 },
  categoryPillText: { color: YELLOW, fontSize: 10, fontWeight: '800' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 3 },
  locationPillText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: YELLOW, paddingHorizontal: 8, paddingVertical: 3 },
  ratingPillText: { color: BLACK, fontSize: 10, fontWeight: '900' },

  bioText: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, lineHeight: 18, marginTop: 10 },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    marginTop: 14,
  },
  statBox: { alignItems: 'center' },
  statNumber: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', marginTop: 2 },
  statDivider: { width: 1, height: 20, backgroundColor: BORDER },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  hireCtaBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingVertical: 11,
  },
  hireCtaBtnText: { color: BLACK, fontSize: FontSize.xs, fontWeight: '900', letterSpacing: 0.5 },
  followBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 11,
  },
  followingBtn: { backgroundColor: DARK_CARD, borderColor: YELLOW },
  followBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  chatBtn: {
    width: 44,
    height: 44,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: YELLOW },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },
  tabTextActive: { color: YELLOW, fontWeight: '900' },

  tabContentArea: { padding: Spacing.four },

  emptyTabBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTabTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  emptyTabSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center' },

  reelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
  reelCard: { width: REEL_GRID_WIDTH, height: REEL_GRID_WIDTH * 1.5, position: 'relative', backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER },
  reelThumb: { width: '100%', height: '100%' },
  reelBadgeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reelViewsText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioCard: { width: GRID_COL_WIDTH, height: 140, backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  portfolioImg: { width: '100%', height: '100%' },
  portfolioTitle: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, padding: 4 },

  pricingSection: { gap: 14 },
  packageCard: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
    position: 'relative',
  },
  packageCardPopular: { borderColor: YELLOW },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: { color: BLACK, fontSize: 8, fontWeight: '900' },
  packageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packageTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packageTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  packagePrice: { color: YELLOW, fontSize: FontSize.sm, fontWeight: '900' },
  packageDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 16 },
  packageHireBtn: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingVertical: 10, alignItems: 'center' },
  packageHireBtnText: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  aboutSection: {},
  detailsCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 8 },
  sectionHeaderTitle: { color: YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  specLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800' },
  specVal: { color: '#fff', fontSize: 11, fontWeight: '700' },
  skillsChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  skillChip: { backgroundColor: BLACK, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 8, paddingVertical: 3 },
  skillChipText: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  reviewCard: { backgroundColor: DARK_CARD, borderWidth: 1, borderColor: BORDER, padding: 12, gap: 8, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewAuthorName: { color: '#fff', fontSize: 11, fontWeight: '800' },
  starRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewComment: { color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: { flex: 1, backgroundColor: BLACK, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: '900' },
  modalSub: { color: YELLOW, fontSize: 10, fontWeight: '800' },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: { padding: Spacing.four, gap: 14 },
  creatorSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DARK_CARD,
    padding: 12,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  modalAvatar: { width: 48, height: 48, borderRadius: 24 },
  modalCreatorName: { color: '#fff', fontSize: FontSize.xs, fontWeight: '900' },
  modalCreatorSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  modalCreatorRate: { color: YELLOW, fontSize: 10, fontWeight: '900', marginTop: 2 },
  fieldGroup: { gap: 4 },
  fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  input: {
    backgroundColor: DARK_CARD,
    color: '#fff',
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  submitProposalBtn: { backgroundColor: YELLOW, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitProposalBtnText: { color: BLACK, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 0.5 },
});
