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
import { useAddToCart } from '@/features/cart/queries';
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
import { resolveImageUrl } from '@/utils/image';

export const ReelItem = memo(function ReelItem({ reel, isActive, height }: ReelItemProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const isVideo = reel.mediaType === 'video';
  const resolvedVideoUrl = resolveImageUrl(reel.videoUrl) || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4';
  const imageUrl = resolveImageUrl(reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl);

  const player = useVideoPlayer(
    isVideo && resolvedVideoUrl ? { uri: resolvedVideoUrl } : null,
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
      await Share.share({
        message: `Check out this reel by ${reel.creatorName} on BIZREELS: ${reel.caption || ''}`,
        title: `BIZREELS — ${reel.creatorName}`,
      });
    } catch (err) {
      console.warn('Share error', err);
    }
  }

  function handleSendComment() {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    });
  }

  const taggedListing = reel.taggedListing;
  const hasTaggedListing = !!taggedListing?._id;

  function handleAddToCart() {
    if (taggedListing?._id) {
      addToCartMutation.mutate(
        { listing_id: taggedListing._id, quantity: 1 },
        {
          onSuccess: () => Alert.alert('Cart Updated', `${taggedListing.title} added to cart!`),
        }
      );
    }
  }

  function handleViewListing() {
    if (taggedListing?._id) {
      router.push(`/listing/${taggedListing._id}`);
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
            <Image source={{ uri: imageUrl }} style={styles.media} contentFit="cover" />
            <View style={[styles.imageTypeBadge, { top: insets.top + 16 }]}>
              <Ionicons name="image-outline" size={14} color="#fff" />
              <Text style={styles.imageTypeText}>Photo Reel</Text>
            </View>
          </>
        )}

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
              {taggedListing.image ? (
                <Image source={{ uri: taggedListing.image }} style={styles.taggedImage} contentFit="cover" />
              ) : (
                <View style={styles.taggedImageFallback}>
                  <Ionicons name="bag" size={16} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.taggedTitle} numberOfLines={1}>
                  {taggedListing.title}
                </Text>
                <Text style={styles.taggedPrice}>
                  ₹{taggedListing.salePrice || taggedListing.price}
                </Text>
              </View>
            </TouchableOpacity>

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
          </View>
        )}

        {/* Creator Info Row */}
        <View style={styles.creatorRow}>
          <View style={styles.avatar}>
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
            <Text style={styles.creatorRole}>{reel.creatorRole || 'Creator'}</Text>
          </View>

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

        {/* Quick Add to Cart & Buy Now Action Row */}
        <View style={styles.reelBuyRow}>
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
            onPress={() => {
              const targetListingId = (reel as any).taggedListing?._id || (reel as any).taggedListing || reel._id;
              const price = (reel as any).taggedListing?.price || (reel as any).taggedListing?.salePrice || 0;
              addToCartMutation.mutate(
                { listing_id: targetListingId, quantity: 1 },
                {
                  onSuccess: () => {
                    router.push({
                      pathname: '/checkout',
                      params: {
                        listingId: targetListingId,
                        title: reel.caption || 'Featured Reel Product',
                        price: price.toString(),
                        vendorName: reel.creatorName || 'Verified Business',
                      },
                    });
                  },
                  onError: () => {
                    router.push({
                      pathname: '/checkout',
                      params: {
                        listingId: targetListingId,
                        title: reel.caption || 'Featured Reel Product',
                        price: price.toString(),
                        vendorName: reel.creatorName || 'Verified Business',
                      },
                    });
                  },
                }
              );
            }}>
            <Ionicons name="flash" size={15} color="#000" />
            <Text style={styles.reelBuyText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
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
    </View>
  );
});

function formatCount(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  reelBuyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  reelCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reelCartText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reelBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  reelBuyText: {
    color: '#000',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  taggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 28, 0.92)',
    borderRadius: 12,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    marginBottom: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    borderRadius: 8,
  },
  taggedImageFallback: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taggedTitle: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  taggedPrice: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addToCartBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarImage: { width: 40, height: 40 },
  avatarFallback: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  creatorName: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  creatorRole: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  followBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 14,
  },
  followBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  imageTypeBadge: {
    position: 'absolute',
    left: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imageTypeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionIconCircleActive: {
    backgroundColor: 'rgba(255, 45, 85, 0.2)',
    borderColor: '#FF2D55',
  },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  commentsDrawer: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderBottomColor: '#2c2c2e',
  },
  drawerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  commentItem: {
    backgroundColor: '#2c2c2e',
    padding: Spacing.two,
    borderRadius: 8,
  },
  commentUser: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
    borderTopColor: '#2c2c2e',
  },
  input: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: FontSize.sm,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
