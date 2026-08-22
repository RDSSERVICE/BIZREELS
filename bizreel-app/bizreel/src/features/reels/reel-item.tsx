/**
 * ReelItem — full-screen reel card.
 *
 * Interactions:
 * - Single tap on video → play / pause toggle
 * - Double tap anywhere → like (with heart animation)
 * - Tap caption → expand / collapse
 */

import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { Reel } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  height: number;
}

export function ReelItem({ reel, isActive, height }: ReelItemProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likeCount, setLikeCount] = useState(reel.likesCount);
  const [isPaused, setIsPaused] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

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

  // ── Tap handlers ──────────────────────────────────────────────

  // Single tap → play/pause (video only)
  function handleSingleTap() {
    if (!isVideo) return;
    setIsPaused((v) => {
      const next = !v;
      setShowPauseIcon(!next === false); // show pause icon briefly when pausing
      return next;
    });
    // Show the play/pause icon briefly
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 800);
  }

  // Double tap → like
  function handleDoubleTap() {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((v) => v + 1);
    }
    // Animate heart
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
    // TODO: call like API
  }

  // Distinguish single vs double tap
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTap() {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      lastTapRef.current = 0;
      handleDoubleTap();
    } else {
      // Potential single tap — wait to see if a second tap follows
      lastTapRef.current = now;
      tapTimerRef.current = setTimeout(() => {
        handleSingleTap();
      }, DOUBLE_TAP_DELAY);
    }
  }

  function handleLikeButton() {
    setIsLiked((v) => !v);
    setLikeCount((v) => (isLiked ? v - 1 : v + 1));
    // TODO: call like/unlike API
  }

  return (
    <View style={styles.container}>
      {/* Tappable media area */}
      <Pressable style={styles.mediaTouchable} onPress={handleTap} accessibilityRole="button">
        {/* Media */}
        {isVideo ? (
          <>
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={false}
            />
            {reel.thumbnailUrl && !isActive && (
              <Image
                source={{ uri: reel.thumbnailUrl }}
                style={styles.media}
                contentFit="contain"
              />
            )}
          </>
        ) : (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.media}
              contentFit="contain"
            />
            <View style={styles.imageTypeBadge}>
              <SymbolView
                name={{ ios: 'photo.fill', android: 'image', web: 'image' }}
                size={14}
                tintColor="#fff"
              />
              <Text style={styles.imageTypeText}>Image</Text>
            </View>
          </>
        )}

        {/* Gradient overlay */}
        <View style={styles.gradient} pointerEvents="none" />

        {/* Play / Pause icon flash */}
        {showPauseIcon && (
          <View style={styles.playPauseOverlay} pointerEvents="none">
            <SymbolView
              name={
                isPaused
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              size={64}
              tintColor="rgba(255,255,255,0.9)"
            />
          </View>
        )}

        {/* Double-tap heart animation */}
        <Animated.View style={[styles.heartOverlay, heartAnimStyle]} pointerEvents="none">
          <SymbolView
            name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            size={100}
            tintColor="#fff"
          />
        </Animated.View>
      </Pressable>

      {/* Bottom overlay — creator + caption */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {/* Creator row */}
        <View style={styles.creatorRow}>
          <View style={styles.avatar}>
            {reel.creatorAvatar ? (
              <Image
                source={{ uri: reel.creatorAvatar }}
                style={styles.avatarImage}
                contentFit="cover"
              />
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

        {/* Caption — 1 line truncated, tap to expand */}
        {!!reel.caption && (
          <Pressable onPress={() => setCaptionExpanded((v) => !v)} accessibilityRole="button">
            <Text
              style={styles.caption}
              numberOfLines={captionExpanded ? undefined : 1}>
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

        {/* Category pills */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{reel.category}</Text>
          </View>
          {reel.postType && (
            <View style={[styles.categoryPill, styles.typePill]}>
              <Text style={styles.categoryText}>{reel.postType}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Right-side action buttons */}
      <View style={styles.actions}>
        {/* Like */}
        <Pressable style={styles.actionBtn} onPress={handleLikeButton} accessibilityLabel="Like">
          <SymbolView
            name={
              isLiked
                ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
            }
            size={28}
            tintColor={isLiked ? BrandColors.error : '#fff'}
          />
          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </Pressable>

        {/* Comments */}
        <Pressable style={styles.actionBtn} accessibilityLabel="Comments">
          <SymbolView
            name={{ ios: 'bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
            size={28}
            tintColor="#fff"
          />
          <Text style={styles.actionCount}>{formatCount(reel.commentsCount)}</Text>
        </Pressable>

        {/* Mute / Unmute (video only) */}
        {isVideo && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => setIsMuted((v) => !v)}
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}>
            <SymbolView
              name={
                isMuted
                  ? { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
                  : { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
              }
              size={24}
              tintColor="#fff"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function formatCount(n: number): string {
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
  // Play/pause flash icon
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Double-tap heart
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom overlay
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 72,
    bottom: 90,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
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
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  typePill: {
    backgroundColor: 'rgba(200,134,10,0.3)',
    borderColor: BrandColors.primary,
  },
  categoryText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
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
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
