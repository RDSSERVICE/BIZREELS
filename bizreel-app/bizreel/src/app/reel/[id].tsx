/**
 * Dedicated Single Reel Video Screen
 * Plays ONLY THAT SPECIFIC REEL's video cleanly in full-screen, with no reel feed scroll,
 * no extra buttons, and direct video URL fallback resolution.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, resolveImageUrl } from '@/lib/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BLACK = '#0F0F12';
const YELLOW = '#F59E0B';

export default function DedicatedSingleReelVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; reelId?: string; videoUrl?: string }>();
  const insets = useSafeAreaInsets();

  const reelId = params.id || params.reelId;
  const initialUrl = params.videoUrl ? resolveImageUrl(params.videoUrl) : null;

  const [playingUrl, setPlayingUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(!initialUrl);

  useEffect(() => {
    if (!initialUrl && reelId) {
      fetchReelVideo(reelId);
    }
  }, [reelId, initialUrl]);

  const fetchReelVideo = async (id: string) => {
    try {
      const res = await api.get(`/reels/${id}`).catch(() => api.get(`/reels/public/${id}`));
      const r = res.data?.data?.reel || res.data?.data || res.data?.reel || res.data || {};
      const rawUrl = r.videoUrl || r.video_url || r.video || r.mediaUrls?.[0];
      if (rawUrl) {
        setPlayingUrl(resolveImageUrl(rawUrl));
      }
    } catch (e) {
      console.warn('Reel fetch error');
    } finally {
      setLoading(false);
    }
  };

  const player = useVideoPlayer(playingUrl || '', (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (player && playingUrl) {
      try {
        if (typeof player.replaceAsync === 'function') {
          player.replaceAsync(playingUrl).then(() => player.play()).catch(() => player.play());
        } else {
          player.replace(playingUrl);
          player.play();
        }
      } catch (e) {
        player.play();
      }
    }
  }, [player, playingUrl]);

  if (loading || !playingUrl) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pure Fullscreen Video Player */}
      <VideoView
        player={player}
        style={styles.videoPlayer}
        contentFit="cover"
        nativeControls={false}
        startsPictureInPictureAutomatically={false}
      />

      {/* Top Floating Back Button ONLY */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 99,
  },
});
