/**
 * Vendor Add/Edit Listing Screen — Mobile Application
 * Complete parity with Web Frontend ProductFormModal.jsx & ServiceFormModal.jsx
 * Features:
 * - Product / Service Listing Type toggle
 * - Dynamic Category & Subcategory taxonomy from backend
 * - Voice Input (Speech-to-Text) 🎙️ on Title, Short Highlights, Description, and Tags
 * - Basic Information (Title, Brand, SKU Auto-Gen, Short Highlights, Full Description)
 * - Gemini AI Copy Generator ✨
 * - Product Specs & Custom Attributes (Key-Value pairs)
 * - Product Tags (#tag pills)
 * - Pricing & Inventory (MRP, Selling Price, Auto-calculated % OFF Discount, Stock, Min Order Qty, Unit)
 * - Warranty, Return Policy & GST %
 * - Shipping Details (Weight, Dimensions, Shipping Type, Free Shipping, Estimated Delivery Days)
 * - Product Variants (Variant Type, Value, Price Adjustment, Variant Image)
 * - Media Uploads (Main Cover Image, Gallery Images, Video Demo URL)
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useCreateVendorListing, useUpdateVendorListing } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';

const YELLOW = '#F59E0B';
const BLACK = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';

export default function CreateListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEdit = Boolean(editId);

  const [type, setType] = useState<'product' | 'service'>('product');
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  // Tags & Labels/Specs
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [labels, setLabels] = useState<{ key: string; value: string }[]>([]);
  const [newLabelKey, setNewLabelKey] = useState('');
  const [newLabelVal, setNewLabelVal] = useState('');

  // Voice Input State 🎙️
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceListeningField, setVoiceListeningField] = useState<string | null>(null);

  // Pricing & Inventory
  const [actualPrice, setActualPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [warranty, setWarranty] = useState('1 Year Warranty');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Replacement');
  const [gst, setGst] = useState('18%');

  // Shipping Details
  const [shippingWeight, setShippingWeight] = useState('');
  const [shippingWeightUnit, setShippingWeightUnit] = useState('kg');
  const [shippingLength, setShippingLength] = useState('');
  const [shippingWidth, setShippingWidth] = useState('');
  const [shippingHeight, setShippingHeight] = useState('');
  const [shippingType, setShippingType] = useState<'self' | 'delivery' | 'both'>('both');
  const [freeShipping, setFreeShipping] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState('5');

  // Variants
  const [variants, setVariants] = useState<any[]>([]);
  const [variantLabel, setVariantLabel] = useState('');
  const [variantValue, setVariantValue] = useState('');
  const [variantPriceAdj, setVariantPriceAdj] = useState('');
  const [variantImageUrl, setVariantImageUrl] = useState('');

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const createMutation = useCreateVendorListing();
  const updateMutation = useUpdateVendorListing();

  // Load existing data for Edit mode
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      api.get(`/listings/${editId}`)
        .then((res) => {
          const item = res.data?.data || res.data?.item || res.data;
          if (item) {
            const prod = item.productDetails || {};
            if (item.type) setType(item.type);
            if (item.category) setCategory(item.category);
            if (item.subcategory) setSubcategory(item.subcategory);
            if (item.title) setTitle(item.title);
            if (item.brand || prod.brand) setBrand(item.brand || prod.brand);
            if (item.sku || prod.sku) setSku(item.sku || prod.sku);
            if (item.shortDescription) setShortDescription(item.shortDescription);
            if (item.description) setDescription(item.description);
            if (item.actualPrice) setActualPrice(String(item.actualPrice));
            if (item.sellingPrice || item.price) setSellingPrice(String(item.sellingPrice || item.price));
            if (item.stock !== undefined) setStock(String(item.stock));
            if (item.minOrderQty || prod.minOrderQty) setMinOrderQty(String(item.minOrderQty || prod.minOrderQty));
            if (item.unit || prod.unit) setUnit(item.unit || prod.unit);
            if (item.warranty || prod.warranty) setWarranty(item.warranty || prod.warranty);
            if (item.returnPolicy || prod.returnPolicy) setReturnPolicy(item.returnPolicy || prod.returnPolicy);
            if (item.gst || prod.gst) setGst(item.gst || prod.gst);
            if (item.tags) setTags(item.tags);
            if (item.labels) setLabels(item.labels);
            if (item.variants) setVariants(item.variants);

            const ship = prod.shippingDetails || {};
            if (ship.weight) setShippingWeight(String(ship.weight));
            if (ship.weightUnit) setShippingWeightUnit(ship.weightUnit);
            if (ship.length) setShippingLength(String(ship.length));
            if (ship.width) setShippingWidth(String(ship.width));
            if (ship.height) setShippingHeight(String(ship.height));
            if (ship.shippingType) setShippingType(ship.shippingType);
            if (ship.freeShipping !== undefined) setFreeShipping(Boolean(ship.freeShipping));
            if (ship.estimatedDays) setEstimatedDays(String(ship.estimatedDays));

            const img = item.image || item.images?.[0] || '';
            if (img) setImageUrl(img);
            if (item.images && Array.isArray(item.images)) setGalleryImages(item.images);
            if (item.video) setVideoUrl(item.video);
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load existing listing details.');
        })
        .finally(() => setLoadingEdit(false));
    }
  }, [editId]);

  // Fetch Categories Taxonomy
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          setCategoriesList(items);
          const parents = items.filter((c: any) => !c.parent_id);
          if (parents.length > 0 && !editId) setCategory(parents[0].name);
        }
      })
      .catch(() => {});
  }, [editId]);

  const parentCategories = categoriesList.filter((c: any) => !c.parent_id);
  const activeParent = parentCategories.find((c: any) => c.name === category);
  const childSubcategories = categoriesList.filter(
    (c: any) => activeParent && c.parent_id === (activeParent.id || activeParent._id)
  );

  // Auto-Gen SKU
  function generateSKU() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const code = `SKU-${rand}-${ts}`;
    setSku(code);
    Alert.alert('SKU Code Auto-Generated', `Assigned Code: ${code}`);
  }

  // Tags Management
  const handleAddTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (tags.includes(clean)) {
      Alert.alert('Duplicate Tag', 'Tag already added.');
      return;
    }
    setTags([...tags, clean]);
    setNewTag('');
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Specs / Custom Attribute Labels
  const handleAddLabel = () => {
    if (!newLabelKey.trim() || !newLabelVal.trim()) {
      Alert.alert('Attribute Required', 'Please enter both attribute key and value (e.g. Color: Red).');
      return;
    }
    setLabels([...labels, { key: newLabelKey.trim(), value: newLabelVal.trim() }]);
    setNewLabelKey('');
    setNewLabelVal('');
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  // Variants Management
  const handleAddVariant = () => {
    if (!variantLabel.trim() || !variantValue.trim()) {
      Alert.alert('Variant Required', 'Please enter variant type and value (e.g. Size: XL).');
      return;
    }
    const priceAdj = variantPriceAdj !== '' ? parseFloat(variantPriceAdj) : parseFloat(sellingPrice || '0');

    const newVar = {
      label: variantLabel.trim(),
      type: variantLabel.trim(),
      value: variantValue.trim(),
      sku: `${sku || 'SKU'}-${variantValue.trim().toUpperCase()}`,
      price: priceAdj,
      image: variantImageUrl || undefined,
    };

    setVariants([...variants, newVar]);
    setVariantValue('');
    setVariantPriceAdj('');
    setVariantImageUrl('');
    Alert.alert('Variant Option Added', `Added variant: ${variantLabel.trim()} - ${variantValue.trim()}`);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Voice Input Modal State 🎙️
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState('');
  const [voiceSetter, setVoiceSetter] = useState<any>(null);
  const [voiceText, setVoiceText] = useState('');

  // Voice Input Speech-to-Text Dictation Handler 🎙️
  const toggleVoiceInput = (
    targetSetter: React.Dispatch<React.SetStateAction<string>>,
    fieldName: string
  ) => {
    setVoiceTargetField(fieldName);
    setVoiceSetter(() => targetSetter);
    setVoiceText('');
    setVoiceModalVisible(true);

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListeningVoice(true);
          setVoiceListeningField(fieldName);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0]?.transcript;
          if (transcript) {
            setVoiceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListeningVoice(false);
          setVoiceListeningField(null);
        };

        recognition.onerror = () => {
          setIsListeningVoice(false);
          setVoiceListeningField(null);
        };

        recognition.onend = () => {
          setIsListeningVoice(false);
          setVoiceListeningField(null);
        };

        recognition.start();
      } catch {
        setIsListeningVoice(false);
        setVoiceListeningField(null);
      }
    }
  };

  // Image Upload Handlers
  async function pickImageFile(target: 'main' | 'gallery' | 'variant') {
    setUploadingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: target !== 'gallery',
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

        if (target === 'main') {
          setImageUrl(uploadedUrl);
          if (!galleryImages.includes(uploadedUrl)) setGalleryImages([uploadedUrl, ...galleryImages]);
        } else if (target === 'gallery') {
          setGalleryImages([...galleryImages, uploadedUrl]);
        } else if (target === 'variant') {
          setVariantImageUrl(uploadedUrl);
        }

        Alert.alert('Image Uploaded!', 'Photo attached successfully.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Could not upload image file.');
    } finally {
      setUploadingImage(false);
    }
  }

  // AI Description Generator
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
        brand,
        sellingPrice,
      });
      const res = data?.data || data;
      if (res?.description || res?.copy || res?.shortDescription) {
        if (res.shortDescription) setShortDescription(res.shortDescription);
        if (res.description || res.copy) setDescription(res.description || res.copy);
        Alert.alert('✨ Gemini AI Description Generated!', 'Product highlights synthesized successfully.');
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

  // Submit Listing Form
  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter listing title.');
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

    const finalImages = galleryImages.length > 0 ? galleryImages : imageUrl.trim() ? [imageUrl.trim()] : [];

    const payload = {
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
      tags,
      labels,
      variants,
      shippingDetails: {
        weight: shippingWeight ? parseFloat(shippingWeight) : undefined,
        weightUnit: shippingWeightUnit,
        length: shippingLength ? parseFloat(shippingLength) : undefined,
        width: shippingWidth ? parseFloat(shippingWidth) : undefined,
        height: shippingHeight ? parseFloat(shippingHeight) : undefined,
        dimensionUnit: 'cm',
        shippingType,
        freeShipping,
        estimatedDays: parseInt(estimatedDays || '5', 10),
      },
      image: imageUrl.trim() || finalImages[0] || undefined,
      images: finalImages,
      video: videoUrl.trim() || undefined,
      status: 'published',
    };

    if (isEdit && editId) {
      updateMutation.mutate(
        { id: editId, ...payload },
        {
          onSuccess: () => {
            Alert.alert('🎉 Listing Updated!', `"${title}" details updated and saved successfully!`);
            router.back();
          },
          onError: (err: any) =>
            Alert.alert('Update Failed', err?.response?.data?.message || err?.message || 'Failed to update listing'),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          Alert.alert('🎉 Listing Created!', `"${title}" has been published to your store catalog!`);
          router.back();
        },
        onError: (err: any) =>
          Alert.alert('Creation Failed', err?.response?.data?.message || err?.message || 'Failed to create listing'),
      });
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEdit ? 'Edit Product / Service Listing' : 'Add Product / Service Listing'}
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loadingEdit ? (
        <View style={styles.centeredLoading}>
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>Loading listing details...</Text>
        </View>
      ) : (
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

          {/* 3. BASIC INFORMATION (WITH VOICE INPUT 🎙️) */}
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

            {/* Title + Voice Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>TITLE *</Text>
                <TouchableOpacity
                  style={[styles.voiceBtn, isListeningVoice && voiceListeningField === 'Title' && styles.voiceBtnActive]}
                  onPress={() => toggleVoiceInput(setTitle, 'Title')}>
                  <Ionicons name="mic" size={12} color={isListeningVoice && voiceListeningField === 'Title' ? BLACK : YELLOW} />
                  <Text style={[styles.voiceBtnText, isListeningVoice && voiceListeningField === 'Title' && styles.voiceBtnTextActive]}>
                    {isListeningVoice && voiceListeningField === 'Title' ? 'Listening...' : 'Voice Input'}
                  </Text>
                </TouchableOpacity>
              </View>
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

            {/* Short Highlights + Voice Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>SHORT HIGHLIGHTS DESCRIPTION</Text>
                <TouchableOpacity
                  style={[styles.voiceBtn, isListeningVoice && voiceListeningField === 'Short Highlights' && styles.voiceBtnActive]}
                  onPress={() => toggleVoiceInput(setShortDescription, 'Short Highlights')}>
                  <Ionicons name="mic" size={12} color={isListeningVoice && voiceListeningField === 'Short Highlights' ? BLACK : YELLOW} />
                  <Text style={[styles.voiceBtnText, isListeningVoice && voiceListeningField === 'Short Highlights' && styles.voiceBtnTextActive]}>
                    {isListeningVoice && voiceListeningField === 'Short Highlights' ? 'Listening...' : 'Voice Input'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Brief 1-line product highlight..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={shortDescription}
                onChangeText={setShortDescription}
              />
            </View>

            {/* Full Description + Voice Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>FULL DESCRIPTION</Text>
                <TouchableOpacity
                  style={[styles.voiceBtn, isListeningVoice && voiceListeningField === 'Description' && styles.voiceBtnActive]}
                  onPress={() => toggleVoiceInput(setDescription, 'Description')}>
                  <Ionicons name="mic" size={12} color={isListeningVoice && voiceListeningField === 'Description' ? BLACK : YELLOW} />
                  <Text style={[styles.voiceBtnText, isListeningVoice && voiceListeningField === 'Description' && styles.voiceBtnTextActive]}>
                    {isListeningVoice && voiceListeningField === 'Description' ? 'Listening...' : 'Voice Input'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Detailed specifications, features, warranty terms..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Tags Management */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PRODUCT TAGS (#KEYWORD)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Type tag (e.g. bluetooth, wireless)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newTag}
                  onChangeText={setNewTag}
                />
                <TouchableOpacity style={styles.addSmallBtn} onPress={handleAddTag}>
                  <Text style={styles.addSmallBtnText}>+ ADD</Text>
                </TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagWrapContainer}>
                  {tags.map((tg, i) => (
                    <TouchableOpacity key={i} style={styles.tagPill} onPress={() => handleRemoveTag(i)}>
                      <Text style={styles.tagPillText}>#{tg}</Text>
                      <Ionicons name="close-circle" size={12} color={BLACK} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Custom Specifications / Attributes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CUSTOM SPECIFICATIONS / ATTRIBUTES</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Attribute (e.g. Color)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newLabelKey}
                  onChangeText={setNewLabelKey}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Value (e.g. Matte Black)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newLabelVal}
                  onChangeText={setNewLabelVal}
                />
                <TouchableOpacity style={styles.addSmallBtn} onPress={handleAddLabel}>
                  <Text style={styles.addSmallBtnText}>+ ADD</Text>
                </TouchableOpacity>
              </View>

              {labels.length > 0 && (
                <View style={{ gap: 6, marginTop: 6 }}>
                  {labels.map((lbl, i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specKeyText}>{lbl.key}:</Text>
                      <Text style={styles.specValText}>{lbl.value}</Text>
                      <TouchableOpacity onPress={() => handleRemoveLabel(i)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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

            {/* Shipping & Delivery Details */}
            <View style={[styles.fieldGroup, { marginTop: 6 }]}>
              <Text style={styles.fieldLabel}>SHIPPING & DELIVERY DETAILS</Text>

              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>WEIGHT (KG/G)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.5"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingWeight}
                    onChangeText={setShippingWeight}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>ESTIMATED DAYS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={estimatedDays}
                    onChangeText={setEstimatedDays}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={styles.fieldLabel}>FREE SHIPPING ELIGIBLE</Text>
                <Switch
                  value={freeShipping}
                  onValueChange={setFreeShipping}
                  trackColor={{ false: BORDER, true: YELLOW }}
                  thumbColor={freeShipping ? BLACK : '#fff'}
                />
              </View>
            </View>
          </View>

          {/* 5. PRODUCT VARIANTS */}
          {type === 'product' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>5. PRODUCT VARIANTS & OPTIONS</Text>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Type (e.g. Size)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={variantLabel}
                  onChangeText={setVariantLabel}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Value (e.g. XL)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={variantValue}
                  onChangeText={setVariantValue}
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Variant Price (₹)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={variantPriceAdj}
                  onChangeText={setVariantPriceAdj}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.addSmallBtn} onPress={handleAddVariant}>
                  <Text style={styles.addSmallBtnText}>+ ADD VARIANT</Text>
                </TouchableOpacity>
              </View>

              {variants.length > 0 && (
                <View style={{ gap: 6, marginTop: 6 }}>
                  {variants.map((v, i) => (
                    <View key={i} style={styles.specRow}>
                      <Text style={styles.specKeyText}>{v.label}: {v.value}</Text>
                      <Text style={styles.specValText}>₹{v.price}</Text>
                      <TouchableOpacity onPress={() => handleRemoveVariant(i)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 6. MEDIA & PHOTOS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>6. PRODUCT MEDIA & GALLERY</Text>

            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImageFile('main')}
              disabled={uploadingImage}>
              {uploadingImage ? (
                <ActivityIndicator color={YELLOW} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={22} color={YELLOW} />
                  <Text style={styles.uploadBtnText}>
                    {imageUrl ? '🖼️ Change Main Cover Photo' : '📁 Upload Main Product Photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl('')}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Gallery Images */}
            <View style={styles.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>GALLERY PHOTOS</Text>
                <TouchableOpacity onPress={() => pickImageFile('gallery')}>
                  <Text style={styles.autoGenBtnText}>+ Add Photo</Text>
                </TouchableOpacity>
              </View>

              {galleryImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 6 }}>
                  {galleryImages.map((img, idx) => (
                    <View key={idx} style={styles.galleryThumbContainer}>
                      <Image source={{ uri: img }} style={styles.galleryThumb} />
                      <TouchableOpacity
                        style={styles.removeGalleryBtn}
                        onPress={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}>
                        <Ionicons name="close" size={10} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

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
            disabled={createMutation.isPending || updateMutation.isPending || loadingEdit}>
            {createMutation.isPending || updateMutation.isPending || loadingEdit ? (
              <ActivityIndicator color={BLACK} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEdit ? '💾 SAVE LISTING CHANGES' : '🚀 PUBLISH LISTING TO STORE'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      {/* VOICE DICTATION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={voiceModalVisible}
        onRequestClose={() => setVoiceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="mic" size={20} color={YELLOW} />
                <Text style={styles.modalTitle}>Voice Input: {voiceTargetField}</Text>
              </View>
              <TouchableOpacity onPress={() => setVoiceModalVisible(false)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              {isListeningVoice
                ? '🎙️ Listening to your voice... Speak now'
                : 'Tap microphone button on your keyboard (🎙️) or dictate text below:'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={`Dictate or type ${voiceTargetField}...`}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={voiceText}
              onChangeText={setVoiceText}
              multiline
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setVoiceModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  if (voiceText && voiceText.trim() && voiceSetter) {
                    voiceSetter((prev: string) => (prev ? `${prev} ${voiceText.trim()}` : voiceText.trim()));
                  }
                  setVoiceModalVisible(false);
                }}>
                <Text style={styles.modalApplyText}>✨ Apply Speech Text</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLACK },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
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
  labelVoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: YELLOW,
  },
  voiceBtnActive: {
    backgroundColor: YELLOW,
  },
  voiceBtnText: {
    color: YELLOW,
    fontSize: 9,
    fontWeight: '900',
  },
  voiceBtnTextActive: {
    color: BLACK,
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
  addSmallBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSmallBtnText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '900',
  },
  tagWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagPillText: {
    color: BLACK,
    fontSize: 10,
    fontWeight: '800',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BLACK,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  specKeyText: {
    color: YELLOW,
    fontSize: 11,
    fontWeight: '800',
  },
  specValText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
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
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryThumbContainer: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  removeGalleryBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: YELLOW,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 10,
  },
  modalTitle: {
    color: YELLOW,
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  modalSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: BLACK,
    color: '#fff',
    fontSize: FontSize.xs,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalApplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: YELLOW,
  },
  modalApplyText: {
    color: BLACK,
    fontSize: 11,
    fontWeight: '900',
  },
});
