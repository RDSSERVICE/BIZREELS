/**
 * ReelItem — full-screen reel card with cross-platform Ionicons action buttons.
 * Guarantees 100% visibility for Like, Comment, Share, Save & Mute on Android.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import DirectBuyModal from '@/components/DirectBuyModal';
import { useAddToCart } from '@/features/cart/queries';
import { api } from '@/lib/api';
import {
  useAddReelComment,
  useFollowUser,
  useReelComments,
  useToggleReelLike,
  useToggleReelSave,
  useUnfollowUser,
} from './queries';
import type { Reel } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  height: number;
}

import { memo } from 'react';
import { useAuth } from '@/features/auth/context';
import { resolveImageUrl } from '@/utils/image';

export const ReelItem = memo(function ReelItem({ reel, isActive, height }: ReelItemProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const activeRole = user?.activeRole || user?.current_role || 'customer';
  const isCreator = activeRole === 'creator';
  const isVendor = activeRole === 'vendor';

  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isSaved, setIsSaved] = useState(reel.isSaved || false);
  const [likeCount, setLikeCount] = useState(reel.likesCount);
  const [isPaused, setIsPaused] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [directBuyModalOpen, setDirectBuyModalOpen] = useState(false);

  const toggleLikeMutation = useToggleReelLike();
  const toggleSaveMutation = useToggleReelSave();
  const addToCartMutation = useAddToCart();
  const followUserMutation = useFollowUser();
  const unfollowUserMutation = useUnfollowUser();
  const { data: comments = [], isLoading: isLoadingComments } = useReelComments(reel._id, commentsVisible);
  const addCommentMutation = useAddReelComment(reel._id);

  // Double-tap heart animation
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const rawVideoCandidate = reel.videoUrl || (reel as any).video_url || (reel as any).video;
  const isVideo =
    reel.mediaType === 'video' ||
    (Boolean(rawVideoCandidate) && reel.mediaType !== 'image');

  const resolvedVideoUrl = isVideo
    ? resolveImageUrl(rawVideoCandidate) ||
      'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'
    : '';

  const imageUrl =
    resolveImageUrl(
      reel.mediaUrls?.[0] ||
        (reel as any).images?.[0] ||
        (reel as any).imageUrl ||
        reel.thumbnailUrl ||
        rawVideoCandidate
    ) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

  const player = useVideoPlayer(
    resolvedVideoUrl ? { uri: resolvedVideoUrl } : null,
    (p) => {
      p.loop = true;
      p.muted = isMuted;
    }
  );

  // Play / pause based on active state
  useEffect(() => {
    if (!player || !isVideo) return;
    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();
      if (!isActive) player.currentTime = 0;
    }
  }, [isActive, isPaused, player, isVideo]);

  // Sync mute
  useEffect(() => {
    if (player) player.muted = isMuted;
  }, [isMuted, player]);

  // Single tap → play/pause
  function handleSingleTap() {
    if (!isVideo) return;
    setIsPaused((v) => {
      const next = !v;
      setShowPauseIcon(true);
      setTimeout(() => setShowPauseIcon(false), 800);
      return next;
    });
  }

  // Double tap → like
  function handleDoubleTap() {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((v) => v + 1);
      toggleLikeMutation.mutate(reel._id);
    }
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 200 })
    );
  }

  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTap() {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      lastTapRef.current = 0;
      handleDoubleTap();
    } else {
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        handleSingleTap();
      }, DOUBLE_TAP_DELAY);
    }
  }

  function handleLikeButton() {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((v) => (nextLiked ? v + 1 : v - 1));
    toggleLikeMutation.mutate(reel._id);
  }

  function handleSaveButton() {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    toggleSaveMutation.mutate({ reelId: reel._id, isSaved: !nextSaved });
  }

  async function handleShareButton() {
    try {
      const shareUrl = `https://api.bizreels.in/reels/${reel._id}`;
      const captionText = reel.caption ? `\n"${reel.caption.trim()}"` : '';
      const shareMessage = `Check out this reel by ${reel.creatorName || 'a creator'} on BIZREELS!${captionText}\n\n👉 ${shareUrl}`;

      await Share.share(
        {
          message: shareMessage,
          title: `BIZREELS — ${reel.creatorName || 'Reel'}`,
        },
        {
          dialogTitle: `Share Reel by ${reel.creatorName || 'Creator'}`,
        }
      );
    } catch (err) {
      console.warn('Share error', err);
    }
  }

  function handleCallVendor() {
    const vendorPhone = (reel as any).phone || (reel as any).phone_number || (reel as any).user_id?.phone || '919876543210';
    const targetVendorId = (reel as any).creatorId || (reel as any).creator || (reel as any).vendor_id?._id || (reel as any).vendor_id;

    if (targetVendorId) {
      api.post('/analytics', { type: 'call_vendor', targetId: targetVendorId }).catch(() => {});
    }

    Linking.openURL(`tel:${vendorPhone}`);
  }

  function handleWhatsAppVendor() {
    const vendorPhone = (reel as any).phone || (reel as any).phone_number || (reel as any).user_id?.phone || '919876543210';
    const targetVendorId = (reel as any).creatorId || (reel as any).creator || (reel as any).vendor_id?._id || (reel as any).vendor_id;

    if (targetVendorId) {
      api.post('/analytics', { type: 'whatsapp_vendor', targetId: targetVendorId }).catch(() => {});
    }

    const cleanPhone = vendorPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`Hi! I saw your reel on BizReels: "${reel.caption || 'Reel Product'}"\nhttps://api.bizreels.in/reels/${reel._id}`);
    Linking.openURL(`https://wa.me/${formattedPhone}?text=${msg}`);
  }

  function handleSendComment() {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    });
  }

  const taggedListingObj =
    typeof reel.taggedListing === 'object' && reel.taggedListing !== null
      ? reel.taggedListing
      : (reel as any).targetListing && typeof (reel as any).targetListing === 'object'
      ? (reel as any).targetListing
      : (reel as any).listing && typeof (reel as any).listing === 'object'
      ? (reel as any).listing
      : null;

  const taggedListingId =
    taggedListingObj?._id ||
    taggedListingObj?.id ||
    (typeof reel.taggedListing === 'string' ? reel.taggedListing : null) ||
    (typeof (reel as any).targetListing === 'string' ? (reel as any).targetListing : null);

  const hasTaggedListing = !!(taggedListingId || taggedListingObj);

  const priceCandidates = [
    (reel as any).price,
    (reel as any).salePrice,
    (reel as any).sellingPrice,
    (reel as any).offer_price,
    taggedListingObj?.price,
    taggedListingObj?.salePrice,
    (taggedListingObj as any)?.sellingPrice,
    (reel as any).taggedListing?.price,
    (reel as any).taggedListing?.salePrice,
    (reel as any).taggedListing?.sellingPrice,
    (reel as any).taggedListing?.offer_price,
    (reel as any).productPrice,
  ];
  const validPriceNum = priceCandidates.map((p) => Number(p)).find((p) => !isNaN(p) && p > 0);

  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!validPriceNum && taggedListingId && typeof taggedListingId === 'string' && taggedListingId.length === 24) {
      api.get(`/listings/${taggedListingId}`)
        .then(({ data }) => {
          const lData = data.data || data;
          const p = Number(lData.price || lData.salePrice || lData.sellingPrice || lData.offer_price || 0);
          if (p > 0) {
            setFetchedPrice(p);
          }
        })
        .catch(() => null);
    }
  }, [taggedListingId, validPriceNum]);

  const activePriceNum = validPriceNum || fetchedPrice || 299;
  const displayPrice = activePriceNum.toLocaleString('en-IN');

  function handleAddToCart() {
    const targetId = taggedListingId || reel._id;
    if (targetId) {
      addToCartMutation.mutate(
        { listing_id: String(targetId), quantity: 1 },
        {
          onSuccess: () => Alert.alert('Cart Updated', `${taggedListingObj?.title || 'Reel item'} added to cart!`),
        }
      );
    }
  }

  function handleViewListing() {
    const targetId = taggedListingId || reel._id;
    if (targetId) {
      router.push(`/listing/${targetId}`);
    }
  }

  function handleOpenVendorProfile() {
    const vendorId =
      (reel as any).vendor_id ||
      (reel as any).vendorId ||
      (reel as any).vendor?._id ||
      (reel as any).vendor?.id ||
      (typeof reel.creator === 'object' ? (reel.creator as any)?._id || (reel.creator as any)?.id : reel.creator);

    if (vendorId) {
      router.push({
        pathname: '/vendor/[id]',
        params: { id: vendorId.toString() },
      } as any);
    } else {
      Alert.alert('Vendor Profile', 'Vendor details not available for this reel.');
    }
  }

  const bottomMargin = Math.max(insets.bottom, 12) + 70;

  return (
    <View style={[styles.container, { height }]}>
      {/* Media Touchable Container */}
      <Pressable style={styles.mediaTouchable} onPress={handleTap} accessibilityRole="button">
        {isVideo ? (
          <>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
            {reel.thumbnailUrl && !isActive && (
              <Image source={{ uri: reel.thumbnailUrl }} style={styles.media} contentFit="cover" />
            )}
          </>
        ) : (
          <>
            <Image source={{ uri: imageUrl || undefined }} style={styles.media} contentFit="cover" />
            <View style={[styles.imageTypeBadge, { top: insets.top + 16 }]}>
              <Ionicons name="image-outline" size={14} color="#fff" />
              <Text style={styles.imageTypeText}>Photo Reel</Text>
            </View>
          </>
        )}

        {/* PROMINENT REEL PRODUCT PRICE BADGE */}
        {displayPrice ? (
          <View style={[styles.topPriceBadge, { top: insets.top + 16, zIndex: 999 }]}>
            <Ionicons name="pricetag" size={14} color="#0F0F12" />
            <Text style={styles.topPriceText}>₹{displayPrice}</Text>
          </View>
        ) : null}

        <View style={styles.gradientOverlay} pointerEvents="none" />

        {/* Play / Pause Toggle Icon */}
        {showPauseIcon && (
          <View style={styles.playPauseOverlay} pointerEvents="none">
            <View style={styles.playPauseCircle}>
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={40}
                color="rgba(255,255,255,0.95)"
              />
            </View>
          </View>
        )}

        {/* Animated Heart Overlay */}
        <Animated.View style={[styles.heartOverlay, heartAnimStyle]} pointerEvents="none">
          <Ionicons name="heart" size={110} color="#FF2D55" />
        </Animated.View>
      </Pressable>

      {/* Bottom Information Overlay */}
      <View style={[styles.bottomOverlay, { bottom: bottomMargin }]} pointerEvents="box-none">
        {/* Tagged E-Commerce Product Banner */}
        {hasTaggedListing && (
          <View style={styles.taggedBanner}>
            <TouchableOpacity style={styles.taggedContent} onPress={handleViewListing}>
              {taggedListingObj?.images?.[0]?.url || taggedListingObj?.image ? (
                <Image source={{ uri: taggedListingObj.images?.[0]?.url || taggedListingObj.image }} style={styles.taggedImage} contentFit="cover" />
              ) : (
                <View style={styles.taggedImageFallback}>
                  <Ionicons name="bag" size={16} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.taggedTitle} numberOfLines={1}>
                  {taggedListingObj?.title || 'Tagged Product'}
                </Text>
                <Text style={styles.taggedPrice}>
                  ₹{displayPrice || taggedListingObj?.salePrice || taggedListingObj?.price || '0'}
                </Text>
              </View>
            </TouchableOpacity>

            {!isCreator && !isVendor && (
              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={handleAddToCart}
                disabled={addToCartMutation.isPending}>
                {addToCartMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart" size={12} color="#fff" />
                    <Text style={styles.addToCartBtnText}>Add +</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Creator / Vendor Info Row (Clickable to open Vendor Profile) */}
        <View style={styles.creatorRow}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
            onPress={handleOpenVendorProfile}
            activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {reel.creatorAvatar ? (
                <Image source={{ uri: reel.creatorAvatar }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarFallback}>
                  {reel.creatorName?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.creatorName} numberOfLines={1}>
                  {reel.creatorName}
                </Text>
                <Ionicons name="checkmark-circle" size={14} color={BrandColors.primaryLight} />
              </View>
              <Text style={styles.creatorRole}>{reel.creatorRole || 'Store Vendor'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={() => {
              const next = !isFollowing;
              setIsFollowing(next);
              const targetUserId = (reel as any).creatorId || (reel as any).creator;
              if (targetUserId) {
                if (next) followUserMutation.mutate(targetUserId);
                else unfollowUserMutation.mutate(targetUserId);
              }
            }}>
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reel Caption */}
        {!!reel.caption && (
          <TouchableOpacity onPress={() => setCaptionExpanded((v) => !v)} activeOpacity={0.8}>
            <Text style={styles.caption} numberOfLines={captionExpanded ? undefined : 2}>
              {reel.caption}
            </Text>
          </TouchableOpacity>
        )}

        {/* Hashtags */}
        {reel.hashtags && reel.hashtags.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>
            {reel.hashtags.map((h) => `#${h}`).join(' ')}
          </Text>
        )}

        {/* Quick Add to Cart & Buy Now Action Row (Customer mode only) */}
        {!isCreator && !isVendor && (
          <View style={styles.reelBuyRow}>
            {displayPrice ? (
              <View style={styles.pricePillTag}>
                <Text style={styles.pricePillText}>₹{displayPrice}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.reelCartBtn}
              onPress={() => {
                const targetListingId = (reel as any).taggedListing?._id || (reel as any).taggedListing || reel._id;
                addToCartMutation.mutate(
                  { listing_id: targetListingId, quantity: 1 },
                  {
                    onSuccess: () => {
                      Alert.alert('🎉 Added to Cart', `Added "${reel.caption || 'Featured Reel Product'}" to your cart!`, [
                        { text: 'View Cart', onPress: () => router.push('/cart') },
                        { text: 'Continue' },
                      ]);
                    },
                  }
                );
              }}>
              <Ionicons name="cart" size={15} color="#fff" />
              <Text style={styles.reelCartText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reelBuyBtn}
              onPress={() => setDirectBuyModalOpen(true)}>
              <Ionicons name="flash" size={15} color="#000" />
              <Text style={styles.reelBuyText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Right-Side Floating Action Column */}
      <View style={[styles.actionsColumn, { bottom: bottomMargin }]} pointerEvents="box-none">
        {/* Like Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLikeButton} accessibilityLabel="Like">
          <View style={[styles.actionIconCircle, isLiked && styles.actionIconCircleActive]}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={isLiked ? '#FF2D55' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        {/* Comments Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setCommentsVisible(true)}
          accessibilityLabel="Comments">
          <View style={styles.actionIconCircle}>
            <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionCount}>{formatCount(reel.commentsCount)}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleShareButton} accessibilityLabel="Share">
          <View style={styles.actionIconCircle}>
            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>

        {/* Call Vendor Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleCallVendor} accessibilityLabel="Call Vendor">
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
            <Ionicons name="call-outline" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.actionCount}>Call</Text>
        </TouchableOpacity>

        {/* WhatsApp Vendor Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsAppVendor} accessibilityLabel="WhatsApp Vendor">
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#22C55E" />
          </View>
          <Text style={styles.actionCount}>WhatsApp</Text>
        </TouchableOpacity>

        {/* Direct Chat with Seller Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            const recipientId = (reel as any).creatorId || (reel as any).creator || (reel as any).vendor_id?._id || (reel as any).vendor_id || (reel as any).user_id;
            const recipientName = reel.creatorName || 'Seller';
            const recipientAvatar = reel.creatorAvatar || '';

            if (!recipientId) {
              Alert.alert('Seller Info', 'Could not open chat for this seller.');
              return;
            }

            router.push({
              pathname: '/messages/[id]' as any,
              params: {
                id: `direct_${recipientId}`,
                recipientId,
                name: recipientName,
                avatar: recipientAvatar,
              },
            } as any);
          }}
          accessibilityLabel="Chat with Seller">
          <View style={styles.actionIconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.actionCount}>Chat</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleSaveButton} accessibilityLabel="Bookmark">
          <View style={styles.actionIconCircle}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? BrandColors.primaryLight : '#FFFFFF'}
            />
          </View>
          <Text style={styles.actionCount}>{isSaved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>

        {/* Audio Mute / Unmute */}
        {isVideo && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setIsMuted((v) => !v)}
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
            <View style={styles.actionIconCircle}>
              <Ionicons
                name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={22}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide-Up Comments Drawer Modal */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentsVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCommentsVisible(false)} />
          <View style={styles.commentsDrawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Comments ({comments.length})</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {isLoadingComments ? (
              <ActivityIndicator style={{ marginVertical: 30 }} color={BrandColors.primary} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ gap: Spacing.two }}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentUser}>{item.user?.name || 'User'}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyComments}>No comments yet. Be the first to comment!</Text>
                }
              />
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendComment}
                disabled={addCommentMutation.isPending || !commentText.trim()}>
                {addCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Direct Buy / Instant Checkout Modal */}
      <DirectBuyModal
        visible={directBuyModalOpen}
        onClose={() => setDirectBuyModalOpen(false)}
        item={reel}
      />
    </View>
  );
});

function formatCount(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return String(n);
}

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: BLACK,
    position: 'relative',
  },
  mediaTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHeartOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 76,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  infoContainer: {
    position: 'absolute',
    left: Spacing.four,
    right: 80,
    bottom: Spacing.four,
    gap: Spacing.two,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: YELLOW,
  },
  avatarImage: { width: 40, height: 40 },
  avatarFallback: {
    color: YELLOW,
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  creatorName: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '900',
  },
  creatorRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  followBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: 0,
  },
  followBtnActive: {
    backgroundColor: DARK_CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  followBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  followBtnTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  caption: {
    color: '#fff',
    fontSize: FontSize.sm,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  hashtags: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  imageTypeBadge: {
    position: 'absolute',
    left: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BLACK,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  imageTypeText: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  actionsColumn: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: Spacing.four,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: DARK_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionIconCircleActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 3,
  },
  reelBuyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  reelCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 0,
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  reelCartText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  reelBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 0,
    gap: 6,
  },
  reelBuyText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  taggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_CARD,
    borderRadius: 0,
    padding: Spacing.two,
    borderWidth: 1.5,
    borderColor: YELLOW,
    marginBottom: Spacing.one,
  },
  taggedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  taggedImage: {
    width: 38,
    height: 38,
    borderRadius: 0,
  },
  taggedImageFallback: {
    width: 38,
    height: 38,
    borderRadius: 0,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taggedTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  taggedPrice: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YELLOW,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 0,
  },
  addToCartBtnText: {
    color: BLACK,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  commentsDrawer: {
    backgroundColor: DARK_CARD,
    borderTopWidth: 2,
    borderTopColor: YELLOW,
    maxHeight: SCREEN_HEIGHT * 0.65,
    padding: Spacing.four,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
  commentItem: {
    backgroundColor: BLACK,
    padding: Spacing.two,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
  },
  commentUser: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  commentText: {
    color: '#fff',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  emptyComments: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginVertical: Spacing.four,
    fontSize: FontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  input: {
    flex: 1,
    backgroundColor: BLACK,
    color: '#fff',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.sm,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 0,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPriceBadge: {
    position: 'absolute',
    left: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#0F0F12',
  },
  topPriceText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pricePillTag: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePillText: {
    color: BLACK,
    fontSize: 13,
    fontWeight: '900',
  },
});
