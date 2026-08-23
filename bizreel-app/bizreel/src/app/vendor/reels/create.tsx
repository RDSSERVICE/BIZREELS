/**
 * Create & Publish Reel Screen for Vendors.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCreateReel } from '@/features/reels/queries';
import { useVendorListings } from '@/features/vendor-listings/queries';

export default function CreateReelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('#bizreels #products');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const { data: listings = [] } = useVendorListings();
  const createReelMutation = useCreateReel();

  function handlePublish() {
    if (!videoUrl.trim()) {
      Alert.alert('Video Required', 'Please enter a valid MP4 / video URL for the reel.');
      return;
    }

    const hashtags = hashtagsStr
      .split(' ')
      .map((tag) => tag.trim())
      .filter((tag) => tag.startsWith('#'));

    createReelMutation.mutate(
      {
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        caption: caption.trim() || undefined,
        taggedListing: selectedListingId || undefined,
        hashtags: hashtags.length > 0 ? hashtags : ['#bizreels'],
        mediaType: 'video',
      },
      {
        onSuccess: () => {
          Alert.alert('Reel Published!', 'Your video reel is now live on the public feed!');
          router.back();
        },
        onError: (err: any) => Alert.alert('Publishing Failed', err.message),
      }
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publish Video Reel</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Video Source</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Upload or Select Video File Source</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
            {[
              { label: '🛍️ Product Showcase', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4' },
              { label: '☕ Food / Dining', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-making-coffee-41551-large.mp4' },
              { label: '💻 Tech / Services', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-42533-large.mp4' },
            ].map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.presetChip, videoUrl === preset.url && styles.presetChipActive]}
                onPress={() => {
                  setVideoUrl(preset.url);
                }}>
                <Text style={[styles.presetChipText, videoUrl === preset.url && styles.presetChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="Enter direct video file URL (MP4 / MOV)..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Thumbnail Image Cover URL (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://images.unsplash.com/photo-..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={thumbnailUrl}
            onChangeText={setThumbnailUrl}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.sectionTitle}>Reel Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Write a catchy caption showcasing your product or service..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hashtags (space separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="#business #fashion #sale"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={hashtagsStr}
            onChangeText={setHashtagsStr}
          />
        </View>

        {/* Tag Listing Selection */}
        {listings.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tag Product/Service Listing (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsScroll}>
              <TouchableOpacity
                style={[
                  styles.listingChip,
                  selectedListingId === null && styles.listingChipActive,
                ]}
                onPress={() => setSelectedListingId(null)}>
                <Text
                  style={[
                    styles.listingChipText,
                    selectedListingId === null && styles.listingChipTextActive,
                  ]}>
                  None
                </Text>
              </TouchableOpacity>

              {listings.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.listingChip,
                    selectedListingId === item._id && styles.listingChipActive,
                  ]}
                  onPress={() => setSelectedListingId(item._id)}>
                  <Text
                    style={[
                      styles.listingChipText,
                      selectedListingId === item._id && styles.listingChipTextActive,
                    ]}
                    numberOfLines={1}>
                    {item.title} (₹{item.price})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Publish Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handlePublish}
          disabled={createReelMutation.isPending}>
          {createReelMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Video Reel</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  sectionTitle: {
    color: BrandColors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  input: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  presetScroll: {
    gap: Spacing.two,
    paddingVertical: 4,
    marginBottom: Spacing.one,
  },
  presetChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  presetChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  presetChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  presetChipTextActive: {
    color: '#fff',
  },
  listingsScroll: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  listingChip: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  listingChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  listingChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  listingChipTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
