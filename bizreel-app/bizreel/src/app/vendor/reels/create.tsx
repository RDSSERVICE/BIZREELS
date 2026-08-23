/**
 * Create & Publish Reel Screen for Vendors — 2-Step Creation Wizard
 * Implements the exact 2-step flow matching the design specification.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { api } from '@/lib/api';

export default function CreateReelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);

  // 1. Content Type
  const [postType, setPostType] = useState<'service' | 'product' | 'shop'>('service');

  // 2. Category & Subcategory
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [category, setCategory] = useState('Services');
  const [subcategory, setSubcategory] = useState('General');

  // 3. Post Purpose
  const [postPurpose, setPostPurpose] = useState('General Promotion');

  // Step 2 States
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('#bizreels #products');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

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

  const postPurposes = [
    { key: 'General Promotion', label: 'General Promotion', desc: 'Standard showcase & visibility', icon: 'star-outline' },
    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Promote a discount or coupon', icon: 'pricetag-outline' },
    { key: 'Announcement', label: 'Announcement', desc: 'Updates or important info', icon: 'notifications-outline' },
    { key: 'New Launch', label: 'New Launch', desc: 'Introduce a brand-new product or service', icon: 'flash-outline' },
  ];

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

  function handlePublish() {
    if (!videoUrl.trim()) {
      Alert.alert('Video Required', 'Please select or enter a video file for the reel.');
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {postType === 'product' ? 'Create Product Reel' : postType === 'shop' ? 'Create Shop Reel' : 'Create Service Reel'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress Step Header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity
          style={[styles.stepPill, step === 1 && styles.stepPillActive]}
          onPress={() => setStep(1)}>
          <Text style={[styles.stepPillText, step === 1 && styles.stepPillTextActive]}>
            1. Purpose & Category
          </Text>
        </TouchableOpacity>

        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />

        <TouchableOpacity
          style={[styles.stepPill, step === 2 && styles.stepPillActive]}
          onPress={() => setStep(2)}>
          <Text style={[styles.stepPillText, step === 2 && styles.stepPillTextActive]}>
            2. Media & Caption
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── STEP 1: CONTENT TYPE, CATEGORY & PURPOSE ── */}
        {step === 1 && (
          <View style={styles.wizardStepContainer}>
            {/* 1. SELECT CONTENT TYPE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.labelTitle}>1. SELECT CONTENT TYPE *</Text>
              <View style={styles.typeGrid}>
                <TouchableOpacity
                  style={[styles.typeCard, postType === 'service' && styles.typeCardActive]}
                  onPress={() => setPostType('service')}>
                  <Ionicons name="layers-outline" size={20} color={postType === 'service' ? '#fff' : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.typeText, postType === 'service' && styles.typeTextActive]}>
                    Service Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeCard, postType === 'product' && styles.typeCardActive]}
                  onPress={() => setPostType('product')}>
                  <Ionicons name="pricetag-outline" size={20} color={postType === 'product' ? '#fff' : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.typeText, postType === 'product' && styles.typeTextActive]}>
                    Product Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeCard, postType === 'shop' && styles.typeCardActive]}
                  onPress={() => setPostType('shop')}>
                  <Ionicons name="videocam-outline" size={20} color={postType === 'shop' ? '#fff' : 'rgba(255,255,255,0.7)'} />
                  <Text style={[styles.typeText, postType === 'shop' && styles.typeTextActive]}>
                    Shop / Business
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. SELECT CATEGORY */}
            <View style={styles.categoryCardContainer}>
              <Text style={styles.categoryCardHeader}>
                ⚙️ 2. SELECT {postType === 'product' ? 'PRODUCT' : postType === 'shop' ? 'BUSINESS' : 'SERVICE'} CATEGORY
              </Text>

              {parentCategories.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>CATEGORY *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {parentCategories.map((catItem: any) => (
                      <TouchableOpacity
                        key={catItem.id || catItem._id}
                        style={[styles.chip, category === catItem.name && styles.chipActive]}
                        onPress={() => {
                          setCategory(catItem.name);
                          const children = categoriesList.filter((c: any) => c.parent_id === (catItem.id || catItem._id));
                          if (children.length > 0) setSubcategory(children[0].name);
                          else setSubcategory('General');
                        }}>
                        <Text style={[styles.chipText, category === catItem.name && styles.chipTextActive]}>
                          {catItem.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {childSubcategories.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>SUB CATEGORY *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {childSubcategories.map((subItem: any) => (
                      <TouchableOpacity
                        key={subItem.id || subItem._id}
                        style={[styles.chip, subcategory === subItem.name && styles.chipActive]}
                        onPress={() => setSubcategory(subItem.name)}>
                        <Text style={[styles.chipText, subcategory === subItem.name && styles.chipTextActive]}>
                          {subItem.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* 3. SELECT POST PURPOSE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.labelTitle}>3. SELECT POST PURPOSE *</Text>
              <View style={styles.purposeGrid}>
                {postPurposes.map((purpose) => {
                  const isSelected = postPurpose === purpose.key;
                  return (
                    <TouchableOpacity
                      key={purpose.key}
                      style={[styles.purposeCard, isSelected && styles.purposeCardActive]}
                      onPress={() => setPostPurpose(purpose.key)}>
                      <View style={styles.purposeHeader}>
                        <Ionicons
                          name={purpose.icon as any}
                          size={20}
                          color={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}
                        />
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
                      </View>
                      <Text style={[styles.purposeTitle, isSelected && styles.purposeTitleActive]}>
                        {purpose.label}
                      </Text>
                      <Text style={styles.purposeDesc}>{purpose.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setStep(2)}>
              <Text style={styles.continueBtnText}>Continue to Media & Caption Selection →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2: MEDIA UPLOAD & CAPTION DETAILS ── */}
        {step === 2 && (
          <View style={styles.wizardStepContainer}>
            {/* 4. SELECT ITEM */}
            {listings.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.labelTitle}>4. TAG PRODUCT / SERVICE LISTING (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                  <TouchableOpacity
                    style={[styles.chip, selectedListingId === null && styles.chipActive]}
                    onPress={() => setSelectedListingId(null)}>
                    <Text style={[styles.chipText, selectedListingId === null && styles.chipTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>

                  {listings.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={[styles.chip, selectedListingId === item._id && styles.chipActive]}
                      onPress={() => setSelectedListingId(item._id)}>
                      <Text style={[styles.chipText, selectedListingId === item._id && styles.chipTextActive]} numberOfLines={1}>
                        {item.title} (₹{item.price})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 5. SELECT MEDIA */}
            <View style={styles.fieldGroup}>
              <Text style={styles.labelTitle}>5. UPLOAD REEL VIDEO FILE & COVER *</Text>
              
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickLocalFile('video')}>
                <Ionicons name="cloud-upload-outline" size={24} color={BrandColors.primary} />
                <Text style={styles.uploadBtnText}>
                  {videoUrl ? '📁 Change Selected Video File' : '📁 Pick & Upload Video File from Device'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.orText}>— OR choose sample preset / paste video URL —</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                {[
                  { label: '🛍️ Product Showcase', url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4' },
                  { label: '☕ Food / Dining', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-making-coffee-41551-large.mp4' },
                  { label: '💻 Tech / Services', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-42533-large.mp4' },
                ].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.chip, videoUrl === preset.url && styles.chipActive]}
                    onPress={() => setVideoUrl(preset.url)}>
                    <Text style={[styles.chipText, videoUrl === preset.url && styles.chipTextActive]}>
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

            {/* Cover Image */}
            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>Thumbnail Image Cover (Optional)</Text>
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

            {/* 6. CAPTION DETAILS */}
            <View style={styles.fieldGroup}>
              <Text style={styles.labelTitle}>6. CAPTION & HASHTAGS</Text>
              <TextInput
                style={[styles.input, { height: 90 }]}
                placeholder="Write a catchy caption showcasing your product or service highlights..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>Hashtags (space separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="#business #fashion #sale"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={hashtagsStr}
                onChangeText={setHashtagsStr}
              />
            </View>

            {/* Action Row */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
                <Text style={styles.backStepBtnText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handlePublish}
                disabled={createReelMutation.isPending}>
                {createReelMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>🚀 Publish Video Reel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
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
  headerTitle: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#1a1b20',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#27272a',
  },
  stepPillActive: {
    backgroundColor: '#D97706',
  },
  stepPillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },
  stepPillTextActive: {
    color: '#fff',
  },

  scrollContent: { padding: Spacing.four },
  wizardStepContainer: { gap: Spacing.four },

  fieldGroup: { gap: Spacing.two },
  labelTitle: { color: '#D97706', fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  subLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  typeGrid: { flexDirection: 'row', gap: Spacing.two },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    gap: 6,
  },
  typeCardActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  typeText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: FontWeight.bold },
  typeTextActive: { color: '#fff' },

  categoryCardContainer: {
    backgroundColor: '#1c1d22',
    borderRadius: 14,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.3)',
  },
  categoryCardHeader: { color: '#D97706', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  chipScroll: { gap: Spacing.two, paddingVertical: 4 },
  chip: {
    backgroundColor: '#2b2d36',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  chipTextActive: { color: '#fff' },

  purposeGrid: { gap: Spacing.two },
  purposeCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  purposeCardActive: {
    backgroundColor: '#2b2218',
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  purposeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  purposeTitle: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  purposeTitleActive: { color: '#D97706' },
  purposeDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },

  continueBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  continueBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#1c1c1e',
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  uploadBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  orText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: FontWeight.bold, textAlign: 'center' },

  presetScroll: { gap: Spacing.two, paddingVertical: 4 },

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

  actionBtnRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  backStepBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  submitBtn: {
    flex: 1,
    backgroundColor: '#D97706',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
