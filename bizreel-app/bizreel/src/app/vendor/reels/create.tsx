/**
 * Create & Publish Reel Screen for Vendors.
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [category, setCategory] = useState('Products');
  const [subcategory, setSubcategory] = useState('General');

  const { data: listings = [] } = useVendorListings();
  const createReelMutation = useCreateReel();

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          setCategoriesList(items);
          const parents = items.filter((c: any) => !c.parent_id);
          if (parents.length > 0) {
            setCategory(parents[0].name);
          }
        }
      })
      .catch(() => {});
  }, []);

  const parentCategories = categoriesList.filter((c: any) => !c.parent_id);
  const activeParent = parentCategories.find((c: any) => c.name === category);
  const childSubcategories = categoriesList.filter((c: any) => activeParent && c.parent_id === (activeParent.id || activeParent._id));

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
        category: category || 'General',
        subcategory: subcategory || 'General',
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

  async function pickLocalFile(type: 'video' | 'image') {
    try {
      if (type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: false,
          quality: 1,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const uri = asset.base64 ? `data:video/mp4;base64,${asset.base64}` : asset.uri;
          setVideoUrl(uri);
          Alert.alert('Video Selected!', 'Video file loaded successfully.');
          return;
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          setThumbnailUrl(uri);
          Alert.alert('Thumbnail Selected!', 'Cover image loaded.');
          return;
        }
      }

      // DocumentPicker fallback for native device files
      const docResult = await DocumentPicker.getDocumentAsync({
        type: type === 'video' ? 'video/*' : 'image/*',
        copyToCacheDirectory: true,
      });

      if (!docResult.canceled && docResult.assets && docResult.assets.length > 0) {
        const asset = docResult.assets[0];
        if (type === 'video') setVideoUrl(asset.uri);
        else setThumbnailUrl(asset.uri);
        Alert.alert('File Loaded!', `Selected ${asset.name}`);
      }
    } catch (err: any) {
      if (typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'video' ? 'video/*' : 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              if (evt.target?.result) {
                const res = evt.target.result as string;
                if (type === 'video') setVideoUrl(res);
                else setThumbnailUrl(res);
                Alert.alert('File Selected!', `Selected ${file.name}`);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        Alert.alert('Picker Error', err?.message || 'Could not open media library.');
      }
    }
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
          <Text style={styles.label}>Upload Video File (MP4 / MOV / WEBM)</Text>
          
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => pickLocalFile('video')}>
            <Ionicons name="cloud-upload-outline" size={22} color={BrandColors.primary} />
            <Text style={styles.uploadBtnText}>
              {videoUrl ? '📁 Change Selected Video File' : '📁 Pick & Upload Video File from Device'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.orText}>— OR choose sample preset / enter URL —</Text>

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
            value={videoUrl.startsWith('data:') ? '[Video File Attached from Device]' : videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Thumbnail Image Cover (Optional)</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => pickLocalFile('image')}>
            <Ionicons name="image-outline" size={22} color={BrandColors.primary} />
            <Text style={styles.uploadBtnText}>
              {thumbnailUrl ? '🖼️ Change Selected Cover Image' : '🖼️ Pick & Upload Thumbnail Cover Image'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Or paste thumbnail image URL..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={thumbnailUrl.startsWith('data:') ? '[Image Cover Attached from Device]' : thumbnailUrl}
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

        {/* API Category Selection */}
        {parentCategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsScroll}>
              {parentCategories.map((catItem: any) => (
                <TouchableOpacity
                  key={catItem.id || catItem._id}
                  style={[
                    styles.listingChip,
                    category === catItem.name && styles.listingChipActive,
                  ]}
                  onPress={() => {
                    setCategory(catItem.name);
                    const children = categoriesList.filter((c: any) => c.parent_id === (catItem.id || catItem._id));
                    if (children.length > 0) setSubcategory(children[0].name);
                    else setSubcategory('General');
                  }}>
                  <Text
                    style={[
                      styles.listingChipText,
                      category === catItem.name && styles.listingChipTextActive,
                    ]}>
                    {catItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* API Subcategory Selection */}
        {childSubcategories.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Subcategory</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsScroll}>
              {childSubcategories.map((subItem: any) => (
                <TouchableOpacity
                  key={subItem.id || subItem._id}
                  style={[
                    styles.listingChip,
                    subcategory === subItem.name && styles.listingChipActive,
                  ]}
                  onPress={() => setSubcategory(subItem.name)}>
                  <Text
                    style={[
                      styles.listingChipText,
                      subcategory === subItem.name && styles.listingChipTextActive,
                    ]}>
                    {subItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#1c1c1e',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    marginVertical: 4,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  orText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginVertical: 4,
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
