/**
 * ReelItem — full-screen reel card with social & e-commerce features.
 *
 * Interactions:
 * - Single tap on video → play / pause toggle
 * - Double tap anywhere → like (with heart animation)
 * - Tap caption → expand / collapse
 * - Product tag banner → Add to Cart or navigate to Listing Details
 * - Comments button → Open Comments Modal
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useAddToCart } from '@/features/cart/queries';
import { useAddReelComment, useReelComments, useToggleReelLike, useToggleReelSave } from './queries';
import type { Reel } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  height: number;
}

export function ReelItem({ reel, isActive, height }: ReelItemProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isSaved, setIsSaved] = useState(reel.isSaved || false);
  const [likeCount, setLikeCount] = useState(reel.likesCount);
  const [isPaused, setIsPaused] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');

  const toggleLikeMutation = useToggleReelLike();
  const toggleSaveMutation = useToggleReelSave();
  const addToCartMutation = useAddToCart();
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
  const imageUrl = reel.mediaUrls?.[0] || reel.thumbnailUrl || reel.videoUrl;

  const player = useVideoPlayer(
    isVideo && reel.videoUrl?.startsWith('http') ? { uri: reel.videoUrl } : null,
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

  // Single tap → play/pause (video only)
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
      addToCartMutation.mutate({ listing_id: taggedListing._id, quantity: 1 });
    }
  }

  function handleViewListing() {
    if (taggedListing?._id) {
      router.push(`/listing/${taggedListing._id}`);
    }
  }

  return (
    <View style={styles.container}>
      {/* Tappable media area */}
      <Pressable style={styles.mediaTouchable} onPress={handleTap} accessibilityRole="button">
        {isVideo ? (
          <>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={false}
            />
            {reel.thumbnailUrl && !isActive && (
              <Image source={{ uri: reel.thumbnailUrl }} style={styles.media} contentFit="contain" />
            )}
          </>
        ) : (
          <>
            <Image source={{ uri: imageUrl }} style={styles.media} contentFit="contain" />
            <View style={styles.imageTypeBadge}>
              <SymbolView name="photo" size={14} tintColor="#fff" />
              <Text style={styles.imageTypeText}>Image</Text>
            </View>
          </>
        )}

        <View style={styles.gradient} pointerEvents="none" />

        {showPauseIcon && (
          <View style={styles.playPauseOverlay} pointerEvents="none">
            <SymbolView name={isPaused ? "pause.fill" : "play.fill"} size={64} tintColor="rgba(255,255,255,0.9)" />
          </View>
        )}

        <Animated.View style={[styles.heartOverlay, heartAnimStyle]} pointerEvents="none">
          <SymbolView name="heart.fill" size={100} tintColor="#fff" />
        </Animated.View>
      </Pressable>

      {/* Bottom overlay — creator, caption & tagged product */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {/* Tagged Product Banner (if tagged) */}
        {hasTaggedListing && (
          <View style={styles.taggedBanner}>
            <Pressable style={styles.taggedContent} onPress={handleViewListing}>
              {taggedListing.image ? (
                <Image source={{ uri: taggedListing.image }} style={styles.taggedImage} />
              ) : (
                <View style={styles.taggedImageFallback}>
                  <SymbolView name="bag.fill" size={16} tintColor="#fff" />
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
            </Pressable>
            <Pressable
              style={styles.addToCartBtn}
              onPress={handleAddToCart}
              disabled={addToCartMutation.isPending}>
              {addToCartMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addToCartBtnText}>Add +</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Creator row */}
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
            <Text style={styles.creatorName} numberOfLines={1}>
              {reel.creatorName}
            </Text>
            <Text style={styles.creatorRole}>{reel.creatorRole}</Text>
          </View>
          {reel.isBoosted && (
            <View style={styles.boostedBadge}>
              <Text style={styles.boostedText}>Sponsored</Text>
            </View>
          )}
        </View>

        {/* Caption */}
        {!!reel.caption && (
          <Pressable onPress={() => setCaptionExpanded((v) => !v)} accessibilityRole="button">
            <Text style={styles.caption} numberOfLines={captionExpanded ? undefined : 1}>
              {reel.caption}
            </Text>
            {!captionExpanded && reel.caption.length > 40 && (
              <Text style={styles.captionMore}>more</Text>
            )}
          </Pressable>
        )}

        {/* Hashtags */}
        {reel.hashtags?.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>
            {reel.hashtags.map((h) => `#${h}`).join(' ')}
          </Text>
        )}
      </View>

      {/* Right-side action buttons */}
      <View style={styles.actions}>
        {/* Like */}
        <Pressable style={styles.actionBtn} onPress={handleLikeButton} accessibilityLabel="Like">
          <SymbolView
            name={isLiked ? "heart.fill" : "heart"}
            size={28}
            tintColor={isLiked ? BrandColors.error : '#fff'}
          />
          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </Pressable>

        {/* Comments */}
        <Pressable style={styles.actionBtn} onPress={() => setCommentsVisible(true)} accessibilityLabel="Comments">
          <SymbolView name="bubble.right" size={28} tintColor="#fff" />
          <Text style={styles.actionCount}>{formatCount(reel.commentsCount)}</Text>
        </Pressable>

        {/* Save / Bookmark */}
        <Pressable style={styles.actionBtn} onPress={handleSaveButton} accessibilityLabel="Bookmark">
          <SymbolView
            name={isSaved ? "bookmark.fill" : "bookmark"}
            size={26}
            tintColor={isSaved ? BrandColors.primary : '#fff'}
          />
        </Pressable>

        {/* Mute / Unmute */}
        {isVideo && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => setIsMuted((v) => !v)}
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
            <SymbolView
              name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"}
              size={24}
              tintColor="#fff"
            />
          </Pressable>
        )}
      </View>

      {/* Comments Drawer Modal */}
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
              <Pressable onPress={() => setCommentsVisible(false)}>
                <SymbolView name="xmark" size={20} tintColor="#fff" />
              </Pressable>
            </View>

            {isLoadingComments ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={BrandColors.primary} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item._id}
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
              <Pressable
                style={styles.sendBtn}
                onPress={handleSendComment}
                disabled={addCommentMutation.isPending}>
                {addCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendBtnText}>Post</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatCount(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  mediaTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 72,
    bottom: 90,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  taggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    borderRadius: 10,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    marginBottom: Spacing.one,
  },
  taggedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  taggedImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  taggedImageFallback: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taggedTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  taggedPrice: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  addToCartBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
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
    marginBottom: Spacing.one,
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
  boostedBadge: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boostedText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  caption: {
    color: '#fff',
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  captionMore: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  hashtags: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  imageTypeBadge: {
    position: 'absolute',
    top: 52,
    left: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  imageTypeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  actions: {
    position: 'absolute',
    right: Spacing.three,
    bottom: 100,
    alignItems: 'center',
    gap: Spacing.four,
  },
  actionBtn: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  actionCount: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsDrawer: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.6,
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
    marginBottom: Spacing.three,
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
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});
