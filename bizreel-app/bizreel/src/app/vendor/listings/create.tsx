/**
 * Vendor Add/Edit Listing Screen — Mobile Application
 * Complete parity with Web Frontend ProductFormModal.jsx & ServiceFormModal.jsx
 * Includes Product/Service Tab, Category taxonomy, Pricing (actual/selling/discount),
 * Stock, SKU auto-generator, Media upload, GST %, Warranty, Return Policy, and AI copy generator.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { useCreateVendorListing } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function CreateListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<'product' | 'service'>('product');

  // Category & Subcategory
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('General');

  // Basic Info
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [generatingAiCopy, setGeneratingAiCopy] = useState(false);

  // Pricing & Inventory
  const [actualPrice, setActualPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [warranty, setWarranty] = useState('1 Year Warranty');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Replacement');
  const [gst, setGst] = useState('18%');

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const createMutation = useCreateVendorListing();

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          setCategoriesList(items);
          const parents = items.filter((c: any) => !c.parent_id);
          if (parents.length > 0) setCategory(parents[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const parentCategories = categoriesList.filter((c: any) => !c.parent_id);
  const activeParent = parentCategories.find((c: any) => c.name === category);
  const childSubcategories = categoriesList.filter(
    (c: any) => activeParent && c.parent_id === (activeParent.id || activeParent._id)
  );

  function generateSKU() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const code = `SKU-${rand}-${ts}`;
    setSku(code);
    Alert.alert('SKU Code Auto-Generated', `Assigned Code: ${code}`);
  }

  async function pickImageFile() {
    setUploadingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'product-image.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);
        formData.append('folder', 'listings/misc');

        const res = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = res.data?.secure_url || res.data?.url || res.data?.path || asset.uri;
        setImageUrl(uploadedUrl);
        Alert.alert('Image Uploaded!', 'Product image uploaded successfully.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Could not upload image file.');
    } finally {
      setUploadingImage(false);
    }
  }

  const handleGenerateAiCopy = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a product title first to generate AI copy.');
      return;
    }

    setGeneratingAiCopy(true);
    try {
      const { data } = await api.post('/listings/ai-copy', {
        title: title.trim(),
        category,
        type,
      });
      const res = data?.data || data;
      if (res?.description || res?.copy || res?.shortDescription) {
        if (res.shortDescription) setShortDescription(res.shortDescription);
        if (res.description || res.copy) setDescription(res.description || res.copy);
        Alert.alert('✨ AI Description Generated!', 'Product highlights synthesized successfully.');
      } else {
        Alert.alert('Notice', 'AI copy generator unavailable. Type description manually.');
      }
    } catch (err) {
      Alert.alert('Notice', 'AI copy generator offline. Type description manually.');
    } finally {
      setGeneratingAiCopy(false);
    }
  };

  const actual = parseFloat(actualPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const discountPercent =
    actual > 0 && selling > 0 && actual > selling
      ? Math.round(((actual - selling) / actual) * 100)
      : 0;

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter listing product/service title.');
      return;
    }

    if (!sellingPrice.trim()) {
      Alert.alert('Price Required', 'Please enter selling price (₹).');
      return;
    }

    const basePrice = parseFloat(sellingPrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    createMutation.mutate(
      {
        type,
        title: title.trim(),
        brand: brand.trim() || undefined,
        sku: sku.trim() || undefined,
        category: category.trim(),
        subcategory: subcategory.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        price: basePrice,
        salePrice: selling,
        actualPrice: actual > 0 ? actual : basePrice,
        discount: discountPercent,
        stock: type === 'product' ? parseInt(stock || '10', 10) : undefined,
        minOrderQty: parseInt(minOrderQty || '1', 10),
        unit,
        warranty: warranty.trim() || undefined,
        returnPolicy: returnPolicy.trim() || undefined,
        gst: gst.trim() || undefined,
        image: imageUrl.trim() || undefined,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        video: videoUrl.trim() || undefined,
        status: 'published',
      },
      {
        onSuccess: () => {
          Alert.alert('🎉 Listing Created!', `"${title}" has been published to your store catalog!`);
          router.back();
        },
        onError: (err: any) =>
          Alert.alert('Creation Failed', err?.response?.data?.message || err?.message || 'Failed to create listing'),
      }
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Add Product / Service Listing</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. LISTING TYPE TOGGLE */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>1. LISTING TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, type === 'product' && styles.typeChipActive]}
              onPress={() => setType('product')}>
              <Ionicons name="cube" size={18} color={type === 'product' ? BLACK : YELLOW} />
              <Text style={[styles.typeChipText, type === 'product' && styles.typeChipTextActive]}>
                Product Listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, type === 'service' && styles.typeChipActive]}
              onPress={() => setType('service')}>
              <Ionicons name="construct" size={18} color={type === 'service' ? BLACK : YELLOW} />
              <Text style={[styles.typeChipText, type === 'service' && styles.typeChipTextActive]}>
                Service Booking
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. CATEGORY & SUBCATEGORY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>2. CATEGORY & SUBCATEGORY</Text>

          <Text style={styles.fieldLabel}>CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {(parentCategories.length > 0
              ? parentCategories
              : [{ name: 'Electronics' }, { name: 'Fashion' }, { name: 'Real Estate' }, { name: 'Automobile' }, { name: 'Home' }]
            ).map((catItem: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, category === catItem.name && styles.chipActive]}
                onPress={() => setCategory(catItem.name)}>
                <Text style={[styles.chipText, category === catItem.name && styles.chipTextActive]}>
                  {catItem.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>SUB CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {(childSubcategories.length > 0
              ? childSubcategories
              : [{ name: 'General' }, { name: 'Headsets' }, { name: 'Smartphones' }, { name: 'Laptop' }]
            ).map((subItem: any, idx: number) => {
              const subName = subItem.name || subItem;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, subcategory === subName && styles.chipActive]}
                  onPress={() => setSubcategory(subName)}>
                  <Text style={[styles.chipText, subcategory === subName && styles.chipTextActive]}>
                    {subName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. BASIC INFORMATION */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionHeaderTitle}>3. BASIC INFORMATION</Text>
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={handleGenerateAiCopy}
              disabled={generatingAiCopy}>
              {generatingAiCopy ? (
                <ActivityIndicator size="small" color={YELLOW} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={14} color={YELLOW} />
                  <Text style={styles.aiBtnText}>AI Copy</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>BRAND</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sony, Apple, Local"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>SKU CODE</Text>
                <TouchableOpacity onPress={generateSKU}>
                  <Text style={styles.autoGenBtnText}>⚡ Auto Gen</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="SKU-8X92-2026"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={sku}
                onChangeText={setSku}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>SHORT HIGHLIGHTS DESCRIPTION</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief 1-line product highlight..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={shortDescription}
              onChangeText={setShortDescription}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>FULL DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Detailed specifications, features, warranty terms..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        {/* 4. PRICING & INVENTORY */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionHeaderTitle}>4. PRICING & INVENTORY</Text>
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>MRP / ACTUAL PRICE (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="3999"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={actualPrice}
                onChangeText={setActualPrice}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>SELLING PRICE (₹) *</Text>
              <TextInput
                style={[styles.input, { borderColor: YELLOW }]}
                placeholder="2588"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {type === 'product' && (
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>STOCK QUANTITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>UNIT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="piece / kg / set"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>WARRANTY</Text>
              <TextInput
                style={styles.input}
                placeholder="1 Year"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={warranty}
                onChangeText={setWarranty}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>GST %</Text>
              <TextInput
                style={styles.input}
                placeholder="18%"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={gst}
                onChangeText={setGst}
              />
            </View>
          </View>
        </View>

        {/* 5. MEDIA & PHOTOS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>5. PRODUCT MEDIA & IMAGES</Text>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImageFile}
            disabled={uploadingImage}>
            {uploadingImage ? (
              <ActivityIndicator color={YELLOW} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={22} color={YELLOW} />
                <Text style={styles.uploadBtnText}>
                  {imageUrl ? '🖼️ Change Product Image' : '📁 Pick & Upload Main Product Photo'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>OR PASTE IMAGE URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://images.unsplash.com/photo-..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>VIDEO DEMO URL (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://assets.mixkit.co/videos/..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* SUBMIT ACTION */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <ActivityIndicator color={BLACK} />
          ) : (
            <Text style={styles.submitBtnText}>🚀 PUBLISH LISTING TO STORE</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  closeBtn: {
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
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
  },
  sectionHeaderTitle: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BLACK,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  typeChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  typeChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
  },
  typeChipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chipScroll: {
    gap: 6,
  },
  chip: {
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: BLACK,
    fontWeight: '900',
  },
  fieldGroup: {
    gap: 4,
  },
  input: {
    backgroundColor: BLACK,
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
  autoGenBtnText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
  },
  discountBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  discountBadgeText: {
    color: BLACK,
    fontSize: 9,
    fontWeight: '900',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  uploadBtnText: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  aiBtnText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  submitBtn: {
    backgroundColor: YELLOW,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: BLACK,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
