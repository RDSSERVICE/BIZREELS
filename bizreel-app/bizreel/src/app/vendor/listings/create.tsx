/**
 * Vendor Add/Edit Listing Screen — Mobile Application
 * Implements the full product/service form specification matching Frontend ProductFormModal.
 */

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
import { useCreateVendorListing } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';

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
  const childSubcategories = categoriesList.filter((c: any) => activeParent && c.parent_id === (activeParent.id || activeParent._id));

  function generateSKU() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const code = `SKU-${rand}-${ts}`;
    setSku(code);
    Alert.alert('SKU Generated!', `Assigned SKU Code: ${code}`);
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
        formData.append('folder', 'listings');

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

  // Calculate discount percentage
  const actual = parseFloat(actualPrice) || 0;
  const selling = parseFloat(sellingPrice) || 0;
  const discountPercent = actual > 0 && selling > 0 && actual > selling
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
          Alert.alert('Listing Created!', `"${title}" has been published to your store catalog!`);
          router.back();
        },
        onError: (err: any) => Alert.alert('Creation Failed', err?.response?.data?.message || err?.message || 'Failed to create listing'),
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
        <Text style={styles.headerTitle}>Add Product / Service Listing</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Listing Type Toggle (Product vs Service) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>1. LISTING TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, type === 'product' && styles.typeChipActive]}
              onPress={() => setType('product')}>
              <Ionicons name="cube" size={18} color={type === 'product' ? '#fff' : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.typeChipText, type === 'product' && styles.typeChipTextActive]}>
                Product Listing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeChip, type === 'service' && styles.typeChipActive]}
              onPress={() => setType('service')}>
              <Ionicons name="construct" size={18} color={type === 'service' ? '#fff' : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.typeChipText, type === 'service' && styles.typeChipTextActive]}>
                Service Booking
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Category & Subcategory */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>2. CATEGORY & SUBCATEGORY</Text>
          
          <Text style={styles.fieldLabel}>CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {(parentCategories.length > 0 ? parentCategories : [{ name: 'Electronics' }, { name: 'Fashion' }, { name: 'Real Estate' }, { name: 'Automobile' }, { name: 'Home' }]).map((catItem: any, idx: number) => (
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
            {(childSubcategories.length > 0 ? childSubcategories : [{ name: 'General' }, { name: 'Headsets' }, { name: 'Smartphones' }, { name: 'Laptop' }]).map((subItem: any, idx: number) => {
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

        {/* Section 3: Basic Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>3. BASIC INFORMATION</Text>

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
              style={[styles.input, { height: 90 }]}
              placeholder="Detailed specifications, features, warranty terms..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        {/* Section 4: Pricing, Tax & Stock */}
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
                style={[styles.input, { borderColor: BrandColors.primary }]}
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

        {/* Section 5: Media & Photos */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>5. PRODUCT MEDIA & IMAGES</Text>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickImageFile}
            disabled={uploadingImage}>
            {uploadingImage ? (
              <ActivityIndicator color={BrandColors.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={22} color={BrandColors.primary} />
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

        {/* Submit Action */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  scrollContent: { padding: Spacing.three, gap: Spacing.three },

  sectionCard: {
    backgroundColor: '#1a1c24',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#282b37',
  },
  sectionHeaderTitle: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },

  typeRow: { flexDirection: 'row', gap: Spacing.two },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222530',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2e3242',
  },
  typeChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  typeChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  typeChipTextActive: { color: '#fff' },

  fieldLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  autoGenBtnText: {
    color: BrandColors.primaryLight,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  chipScroll: { gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: '#262936',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chipActive: { backgroundColor: BrandColors.primary },
  chipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  chipTextActive: { color: '#fff', fontWeight: FontWeight.bold },

  fieldGroup: { gap: 4 },
  input: {
    backgroundColor: '#20232e',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: '#2d3040',
  },
  row: { flexDirection: 'row', gap: Spacing.two },

  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountBadgeText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20232e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
  },
  uploadBtnText: { color: BrandColors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
});
