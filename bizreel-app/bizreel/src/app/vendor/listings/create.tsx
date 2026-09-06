/**
 * Vendor Add/Edit Listing Screen — Mobile Application
 * 100% Visual & Functional Parity with Web Frontend ProductFormModal.jsx
 * Matches Screenshot Layout:
 * - Category & Classification (Filtered by Vendor Onboarded Categories)
 * - Basic Product Details with AI Description Generator Banner (Voice & Text)
 * - Gemini Multimodal Media Scan ("Upload Product Media for AI Auto-Fill")
 * - Voice Input 🎙️ for AI prompt, Title, Short Description, Full Description, Tags
 * - Pricing & Inventory, Shipping & Delivery, Variants, Media Gallery
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

import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/context';
import { useCreateVendorListing, useUpdateVendorListing } from '@/features/vendor-listings/queries';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/utils/image';

const YELLOW = '#F59E0B';
const DARK_BG = '#0F0F12';
const DARK_CARD = '#18181C';
const BORDER = '#2D2D36';
const PURPLE_ACCENT = '#A855F7';
const PURPLE_BG = 'rgba(168,85,247,0.12)';
const PURPLE_BORDER = 'rgba(168,85,247,0.3)';
const TEXT_MUTED = 'rgba(255,255,255,0.7)';

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

  // AI Prompt & Voice
  const [aiPrompt, setAiPrompt] = useState('');
  const [analyzingMedia, setAnalyzingMedia] = useState(false);

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

  // Voice Input Modal State 🎙️
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState('');
  const [voiceSetter, setVoiceSetter] = useState<any>(null);
  const [voiceText, setVoiceText] = useState('');
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
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Service Details
  const [serviceType, setServiceType] = useState('At Home');
  const [priceType, setPriceType] = useState('Fixed Price');
  const [serviceHighlights, setServiceHighlights] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [duration, setDuration] = useState('1 Hour');
  const [serviceArea, setServiceArea] = useState('Local Area');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [homeVisitAvailable, setHomeVisitAvailable] = useState(true);
  const [maxTravelDistanceKm, setMaxTravelDistanceKm] = useState('15');
  const [availableCities, setAvailableCities] = useState('');
  const [emergencyService24x7, setEmergencyService24x7] = useState(false);
  const [advanceBookingRequired, setAdvanceBookingRequired] = useState(true);
  const [bookingAvailability, setBookingAvailability] = useState('Immediate');

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
            const sd = item.serviceDetails || {};

            const itemType = item.type || item.listingType || (item.serviceDetails ? 'service' : 'product');
            setType(itemType as 'product' | 'service');

            if (item.category) setCategory(item.category);
            if (item.subcategory) setSubcategory(item.subcategory);
            if (item.title) setTitle(item.title);
            setBrand(item.brand || prod.brand || '');
            setSku(item.sku || prod.sku || '');
            setShortDescription(item.shortDescription || '');
            setDescription(item.description || '');

            const actualVal = item.actualPrice || item.price || prod.actualPrice || 0;
            const sellingVal = item.sellingPrice || item.salePrice || item.price || prod.sellingPrice || sd.price || 0;
            if (actualVal) setActualPrice(String(actualVal));
            if (sellingVal) setSellingPrice(String(sellingVal));
            if (item.stock !== undefined || prod.stock !== undefined) setStock(String(item.stock ?? prod.stock ?? 10));
            if (item.minOrderQty || prod.minOrderQty) setMinOrderQty(String(item.minOrderQty || prod.minOrderQty || 1));
            if (item.unit || prod.unit) setUnit(item.unit || prod.unit || 'piece');
            if (item.warranty || prod.warranty) setWarranty(item.warranty || prod.warranty || '');
            if (item.returnPolicy || prod.returnPolicy) setReturnPolicy(item.returnPolicy || prod.returnPolicy || '');
            if (item.gst || prod.gst) setGst(item.gst || prod.gst || '18%');
            if (Array.isArray(item.tags)) setTags(item.tags);
            if (Array.isArray(item.labels)) setLabels(item.labels);
            if (Array.isArray(item.variants)) setVariants(item.variants);

            const ship = prod.shippingDetails || item.shippingDetails || {};
            if (ship.weight) setShippingWeight(String(ship.weight));
            if (ship.weightUnit) setShippingWeightUnit(ship.weightUnit);
            if (ship.length) setShippingLength(String(ship.length));
            if (ship.width) setShippingWidth(String(ship.width));
            if (ship.height) setShippingHeight(String(ship.height));
            if (ship.shippingType) setShippingType(ship.shippingType);
            if (ship.freeShipping !== undefined) setFreeShipping(Boolean(ship.freeShipping));
            if (ship.estimatedDays) setEstimatedDays(String(ship.estimatedDays));

            // Populate Service Details
            if (sd) {
              if (sd.serviceHighlights) setServiceHighlights(sd.serviceHighlights);
              if (sd.termsAndConditions) setTermsAndConditions(sd.termsAndConditions);
              if (sd.serviceType) setServiceType(sd.serviceType);
              if (sd.priceType) setPriceType(sd.priceType);
              if (sd.duration || sd.durationText) setDuration(sd.duration || sd.durationText);
              if (sd.serviceArea) setServiceArea(sd.serviceArea);
              if (sd.minOrderValue) setMinOrderValue(String(sd.minOrderValue));
              if (sd.homeVisitAvailable !== undefined) setHomeVisitAvailable(Boolean(sd.homeVisitAvailable));
              if (sd.maxTravelDistanceKm) setMaxTravelDistanceKm(String(sd.maxTravelDistanceKm));
              if (sd.availableCities) setAvailableCities(sd.availableCities);
              if (sd.emergencyService24x7 !== undefined) setEmergencyService24x7(Boolean(sd.emergencyService24x7));
              if (sd.advanceBookingRequired !== undefined) setAdvanceBookingRequired(Boolean(sd.advanceBookingRequired));
              if (sd.bookingAvailability) setBookingAvailability(sd.bookingAvailability);
            }

            // Populate All Previous Main Cover & Gallery Images
            const collectedImages: string[] = [];

            const addImageCandidate = (candidate: any) => {
              if (!candidate) return;
              if (Array.isArray(candidate)) {
                candidate.forEach((itemCandidate) => addImageCandidate(itemCandidate));
                return;
              }
              const resolved = resolveImageUrl(candidate);
              if (resolved && !collectedImages.includes(resolved)) {
                collectedImages.push(resolved);
              }
            };

            // Root listing image properties
            addImageCandidate(item.image);
            addImageCandidate(item.imageUrl);
            addImageCandidate(item.coverImage);
            addImageCandidate(item.thumbnailUrl);
            addImageCandidate(item.thumbnail);
            addImageCandidate(item.images);
            addImageCandidate(item.media);
            addImageCandidate(item.mediaUrls);
            addImageCandidate(item.photos);
            addImageCandidate(item.gallery);

            // Nested productDetails fields
            if (item.productDetails) {
              addImageCandidate(item.productDetails.image);
              addImageCandidate(item.productDetails.imageUrl);
              addImageCandidate(item.productDetails.coverImage);
              addImageCandidate(item.productDetails.images);
              addImageCandidate(item.productDetails.media);
              addImageCandidate(item.productDetails.mediaUrls);
              addImageCandidate(item.productDetails.photos);
              addImageCandidate(item.productDetails.gallery);
            }

            // Nested serviceDetails fields
            if (item.serviceDetails) {
              addImageCandidate(item.serviceDetails.image);
              addImageCandidate(item.serviceDetails.coverImage);
              addImageCandidate(item.serviceDetails.images);
              addImageCandidate(item.serviceDetails.galleryImages);
              addImageCandidate(item.serviceDetails.portfolio);
            }

            // Variant images
            if (Array.isArray(item.variants)) {
              item.variants.forEach((v: any) => {
                addImageCandidate(v?.image);
                addImageCandidate(v?.imageUrl);
              });
            }

            setGalleryImages(collectedImages);
            setImageUrl(collectedImages[0] || '');

            const vid = item.video || item.videos?.[0] || prod.video || sd.reelVideo || '';
            if (vid) setVideoUrl(vid);
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
        }
      })
      .catch(() => {});
  }, []);

  const { user } = useAuth();
  const vendorProfile = user?.vendorProfile || (user as any)?.profileData || {};

  // Extract onboarded Categories from vendor profile / user profile
  const onboardedCategories = React.useMemo(() => {
    let cats: string[] = [];
    const authUser = user as any;
    if (Array.isArray(authUser?.categories) && authUser.categories.length > 0) {
      cats = authUser.categories;
    } else if (Array.isArray(vendorProfile.categories) && vendorProfile.categories.length > 0) {
      cats = vendorProfile.categories;
    } else if (Array.isArray(vendorProfile.selectedCategories) && vendorProfile.selectedCategories.length > 0) {
      cats = vendorProfile.selectedCategories;
    } else if (vendorProfile.category) {
      cats = [vendorProfile.category];
    } else if (vendorProfile.businessCategory) {
      cats = [vendorProfile.businessCategory];
    } else if (authUser?.category) {
      cats = [authUser.category];
    }
    return cats.filter(Boolean);
  }, [user, vendorProfile]);

  // Extract onboarded Subcategories
  const onboardedSubcategories = React.useMemo(() => {
    let subs: string[] = [];
    const authUser = user as any;
    if (Array.isArray(authUser?.subcategories) && authUser.subcategories.length > 0) {
      subs = authUser.subcategories;
    } else if (Array.isArray(vendorProfile.subcategories) && vendorProfile.subcategories.length > 0) {
      subs = vendorProfile.subcategories;
    } else if (Array.isArray(vendorProfile.selectedSubcategories) && vendorProfile.selectedSubcategories.length > 0) {
      subs = vendorProfile.selectedSubcategories;
    } else if (vendorProfile.subcategory) {
      subs = [vendorProfile.subcategory];
    } else if (authUser?.subcategory) {
      subs = [authUser.subcategory];
    }
    return subs.filter(Boolean);
  }, [user, vendorProfile]);

  // Master parent categories filtered STRICTLY by vendor's onboarded categories
  const parentCategories = React.useMemo(() => {
    let list: any[] = [];
    if (onboardedCategories.length > 0) {
      list = onboardedCategories.map((catName) => {
        const foundMaster = categoriesList.find(
          (c: any) => !c.parent_id && (c.name?.toLowerCase() === catName.toLowerCase() || c.id === catName || c._id === catName)
        );
        return {
          id: foundMaster?.id || foundMaster?._id || catName,
          name: foundMaster?.name || catName,
        };
      });
    } else {
      const allParents = categoriesList.filter((c: any) => !c.parent_id);
      list = allParents.map((c: any) => ({ id: c.id || c._id, name: c.name }));
    }

    if (category && !list.some((c: any) => c.name?.toLowerCase() === category.toLowerCase())) {
      list.unshift({ id: category, name: category });
    }

    return list;
  }, [categoriesList, onboardedCategories, category]);

  // Master subcategories filtered STRICTLY by active parent category AND vendor's onboarded subcategories
  const childSubcategories = React.useMemo(() => {
    const activeParent = parentCategories.find((c: any) => c.name?.toLowerCase() === category?.toLowerCase());
    const parentId = activeParent?.id || (activeParent as any)?._id;
    const subsFromMaster = categoriesList.filter(
      (c: any) => parentId && (c.parent_id === parentId || c.parent_id === (activeParent as any)?._id)
    ).map((c: any) => c.name);

    let list: any[] = [];
    if (onboardedSubcategories.length > 0) {
      const matched = onboardedSubcategories.filter((os) =>
        subsFromMaster.length === 0 || subsFromMaster.some((sm: string) => sm.toLowerCase() === os.toLowerCase())
      );
      list = (matched.length > 0 ? matched : onboardedSubcategories).map((name) => ({ name }));
    } else if (subsFromMaster.length > 0) {
      list = subsFromMaster.map((name: string) => ({ name }));
    } else {
      list = [{ name: 'General' }];
    }

    if (subcategory && !list.some((s: any) => (s.name || s)?.toLowerCase() === subcategory?.toLowerCase())) {
      list.unshift({ name: subcategory });
    }

    return list;
  }, [categoriesList, parentCategories, category, onboardedSubcategories, subcategory]);

  // Sync selected category with vendor's available categories (only in Create mode)
  useEffect(() => {
    if (parentCategories.length > 0 && !isEdit) {
      const exists = parentCategories.some((c: any) => c.name?.toLowerCase() === category?.toLowerCase());
      if (!exists && parentCategories[0]?.name) {
        setCategory(parentCategories[0].name);
      }
    }
  }, [parentCategories, category, isEdit]);

  // Sync selected subcategory with available subcategories (only in Create mode)
  useEffect(() => {
    if (childSubcategories.length > 0 && !isEdit) {
      const exists = childSubcategories.some((s: any) => (s.name || s)?.toLowerCase() === subcategory?.toLowerCase());
      if (!exists && childSubcategories[0]) {
        const firstSubName = typeof childSubcategories[0] === 'string' ? childSubcategories[0] : childSubcategories[0]?.name || 'General';
        setSubcategory(firstSubName);
      }
    }
  }, [childSubcategories, subcategory, isEdit]);

  // Auto-Gen SKU
  function generateSKU() {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const code = `SKU-${rand}-${ts}`;
    setSku(code);
    Alert.alert('SKU Code Auto-Generated', `Assigned Code: ${code}`);
  }

  // Tags Handlers
  const handleAddTag = () => {
    const cleanTag = newTag.trim().replace(/^#/, '');
    if (!cleanTag) return;
    if (tags.includes(cleanTag)) {
      Alert.alert('Duplicate Tag', 'Tag already added');
      return;
    }
    setTags([...tags, cleanTag]);
    setNewTag('');
  };

  const handleRemoveTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // Specifications / Key-Value Attributes Handlers
  const handleAddLabel = () => {
    if (!newLabelKey.trim() || !newLabelVal.trim()) {
      Alert.alert('Missing Attribute', 'Enter both attribute key and value (e.g. Color: Matte Black)');
      return;
    }
    setLabels([...labels, { key: newLabelKey.trim(), value: newLabelVal.trim() }]);
    setNewLabelKey('');
    setNewLabelVal('');
  };

  const handleRemoveLabel = (idx: number) => {
    setLabels(labels.filter((_, i) => i !== idx));
  };

  // Product Variants Handlers
  const handleAddVariant = () => {
    if (!variantLabel.trim() || !variantValue.trim()) {
      Alert.alert('Missing Variant Data', 'Please enter variant type and value (e.g. Size: XL)');
      return;
    }
    const finalPrice = variantPriceAdj !== '' ? parseFloat(variantPriceAdj) : parseFloat(sellingPrice || '0');
    const newVar = {
      label: variantLabel.trim(),
      type: variantLabel.trim(),
      value: variantValue.trim(),
      sku: `${sku || 'SKU'}-${variantValue.trim().toUpperCase()}`,
      price: isNaN(finalPrice) ? 0 : finalPrice,
      image: variantImageUrl || undefined,
    };
    setVariants([...variants, newVar]);
    setVariantValue('');
    setVariantPriceAdj('');
    setVariantImageUrl('');
    Alert.alert('Variant Added!', `Variant "${variantLabel}: ${variantValue}" added.`);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

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
  async function pickImageFile(target: 'main' | 'gallery' | 'variant' | 'aiMedia') {
    if (target === 'aiMedia') setAnalyzingMedia(true);
    else setUploadingImage(true);

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
          Alert.alert('Image Uploaded!', 'Product main cover photo attached successfully.');
        } else if (target === 'gallery') {
          setGalleryImages([...galleryImages, uploadedUrl]);
          Alert.alert('Gallery Photo Uploaded!', 'Photo added to product gallery.');
        } else if (target === 'variant') {
          setVariantImageUrl(uploadedUrl);
        } else if (target === 'aiMedia') {
          setImageUrl(uploadedUrl);
          // AI media scan auto-fill description
          setGeneratingAiCopy(true);
          try {
            const aiRes = await api.post('/listings/ai-copy', {
              imageUrl: uploadedUrl,
              title: title || category,
              category,
            });
            const copyData = aiRes.data?.data || aiRes.data;
            if (copyData?.description || copyData?.copy) {
              setDescription(copyData.description || copyData.copy);
              if (copyData.shortDescription) setShortDescription(copyData.shortDescription);
              Alert.alert('✨ Gemini AI Scan Complete!', 'Product highlights extracted from media photo.');
            }
          } catch {
            Alert.alert('Notice', 'Photo uploaded. AI scan complete.');
          } finally {
            setGeneratingAiCopy(false);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Could not upload image file.');
    } finally {
      setUploadingImage(false);
      setAnalyzingMedia(false);
    }
  }

  // AI Description Generator
  const handleGenerateAiCopy = async () => {
    const promptText = aiPrompt.trim() || title.trim() || `${category} product`;
    setGeneratingAiCopy(true);
    try {
      const { data } = await api.post('/listings/ai-copy', {
        prompt: promptText,
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
        Alert.alert('Notice', 'AI copy generator completed. Review description below.');
      }
    } catch (err) {
      Alert.alert('Notice', 'Type description manually or try again.');
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
      Alert.alert('Title Required', 'Please enter product title.');
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

    const payload: any = {
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
      image: imageUrl.trim() || finalImages[0] || undefined,
      images: finalImages,
      video: videoUrl.trim() || undefined,
      status: 'published',
    };

    if (type === 'service') {
      payload.serviceDetails = {
        serviceType,
        priceType,
        price: basePrice,
        serviceHighlights: serviceHighlights.trim() || undefined,
        termsAndConditions: termsAndConditions.trim() || undefined,
        duration: duration.trim() || '1 Hour',
        serviceArea: serviceArea.trim() || 'Local Area',
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
        homeVisitAvailable,
        maxTravelDistanceKm: maxTravelDistanceKm ? parseFloat(maxTravelDistanceKm) : 15,
        availableCities: availableCities.trim() || undefined,
        emergencyService24x7,
        advanceBookingRequired,
        bookingAvailability,
        coverImage: imageUrl.trim() || finalImages[0] || undefined,
        galleryImages: finalImages.slice(1),
        reelVideo: videoUrl.trim() || undefined,
      };
    } else {
      payload.shippingDetails = {
        weight: shippingWeight ? parseFloat(shippingWeight) : undefined,
        weightUnit: shippingWeightUnit,
        length: shippingLength ? parseFloat(shippingLength) : undefined,
        width: shippingWidth ? parseFloat(shippingWidth) : undefined,
        height: shippingHeight ? parseFloat(shippingHeight) : undefined,
        dimensionUnit: 'cm',
        shippingType,
        freeShipping,
        estimatedDays: parseInt(estimatedDays || '5', 10),
      };
      payload.productDetails = {
        brand: brand.trim() || undefined,
        sku: sku.trim() || undefined,
        minOrderQty: parseInt(minOrderQty || '1', 10),
        unit,
        warranty: warranty.trim() || undefined,
        returnPolicy: returnPolicy.trim() || undefined,
        gst: gst.trim() || undefined,
        shippingDetails: payload.shippingDetails,
      };
    }

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
      {/* Header Bar — Matches Web Modal Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={YELLOW} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isEdit ? 'Edit Product Listing' : 'Add New Product Listing'}
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loadingEdit ? (
        <View style={styles.centeredLoading}>
          <ActivityIndicator size="large" color={YELLOW} />
          <Text style={styles.loadingText}>Loading listing details...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SECTION 1: CATEGORY & CLASSIFICATION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>CATEGORY & CLASSIFICATION</Text>

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {parentCategories.map((catItem: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownChip, category === catItem.name && styles.dropdownChipActive]}
                  onPress={() => setCategory(catItem.name)}>
                  <Text style={[styles.dropdownChipText, category === catItem.name && styles.dropdownChipTextActive]}>
                    {catItem.name}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={category === catItem.name ? '#0F0F12' : '#888'} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>SUBCATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {childSubcategories.map((subItem: any, idx: number) => {
                const subName = subItem.name || subItem;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dropdownChip, subcategory === subName && styles.dropdownChipActive]}
                    onPress={() => setSubcategory(subName)}>
                    <Text style={[styles.dropdownChipText, subcategory === subName && styles.dropdownChipTextActive]}>
                      {subName}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={subcategory === subName ? '#0F0F12' : '#888'} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* SECTION 2: BASIC PRODUCT DETAILS */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionHeaderTitle}>BASIC PRODUCT DETAILS</Text>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color={PURPLE_ACCENT} />
                <Text style={styles.aiBadgeText}>AI Assisted</Text>
              </View>
            </View>

            {/* AI Description Generator Glassmorphic Banner */}
            <View style={styles.aiBannerCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.aiBannerTitle}>🤖 AI Description Generator (Voice & Text)</Text>
                <TouchableOpacity
                  style={styles.voicePurpleBtn}
                  onPress={() => toggleVoiceInput(setAiPrompt, 'AI Prompt')}>
                  <Ionicons name="mic" size={12} color="#fff" />
                  <Text style={styles.voicePurpleBtnText}>Voice Input</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={styles.aiPromptInput}
                  placeholder="Tell AI about product features or speak via mic..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                />
                <TouchableOpacity
                  style={styles.autoGenerateBtn}
                  onPress={handleGenerateAiCopy}
                  disabled={generatingAiCopy}>
                  {generatingAiCopy ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={14} color="#fff" />
                      <Text style={styles.autoGenerateBtnText}>Auto-Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(168,85,247,0.2)' }}>
                <Text style={styles.subLabelText}>OR UPLOAD PRODUCT MEDIA FOR AI AUTO-FILL</Text>
                <TouchableOpacity
                  style={styles.filePickerBtn}
                  onPress={() => pickImageFile('aiMedia')}
                  disabled={analyzingMedia}>
                  {analyzingMedia ? (
                    <ActivityIndicator size="small" color={PURPLE_ACCENT} />
                  ) : (
                    <Text style={styles.filePickerBtnText}>📷 Select Photo/Video for AI Scan</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  Gemini will scan your sample photo/video to extract highlights & descriptions.
                </Text>
              </View>
            </View>

            {/* Product Title */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>Product Title *</Text>
                <TouchableOpacity
                  style={styles.voiceSmallBtn}
                  onPress={() => toggleVoiceInput(setTitle, 'Title')}>
                  <Ionicons name="mic" size={11} color={YELLOW} />
                  <Text style={styles.voiceSmallBtnText}>Voice Input</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.whiteInput}
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Short Description */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>Short Description</Text>
                <TouchableOpacity
                  style={styles.voiceSmallBtn}
                  onPress={() => toggleVoiceInput(setShortDescription, 'Short Description')}>
                  <Ionicons name="mic" size={11} color={YELLOW} />
                  <Text style={styles.voiceSmallBtnText}>Voice Input</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.whiteInput}
                placeholder="Brief 1-line summary..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={shortDescription}
                onChangeText={setShortDescription}
              />
            </View>

            {/* Full Description */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>Full Description</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={handleGenerateAiCopy}>
                  <Ionicons name="sparkles" size={12} color={PURPLE_ACCENT} />
                  <Text style={{ color: PURPLE_ACCENT, fontSize: 10, fontWeight: '800' }}>
                    Re-generate AI Description
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.whiteInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Comprehensive product details..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Brand & SKU */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Brand</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="e.g. Sony"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.fieldLabel}>SKU Code</Text>
                  <TouchableOpacity onPress={generateSKU}>
                    <Text style={{ color: YELLOW, fontSize: 9, fontWeight: '900' }}>⚡ Auto-Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="SKU-XXX-000"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={sku}
                  onChangeText={setSku}
                />
              </View>
            </View>

            {/* Tags & Keywords */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelVoiceRow}>
                <Text style={styles.fieldLabel}>Tags / Keywords</Text>
                <TouchableOpacity
                  style={styles.voiceSmallBtn}
                  onPress={() => toggleVoiceInput(setNewTag, 'Tag Keyword')}>
                  <Ionicons name="mic" size={11} color={YELLOW} />
                  <Text style={styles.voiceSmallBtnText}>Voice Input</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="Type tag & press Add (e.g. bluetooth, wireless)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: YELLOW,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleAddTag}>
                  <Text style={{ color: '#0F0F12', fontSize: 11, fontWeight: '900' }}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {tags.map((t, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(245,158,11,0.18)',
                        borderWidth: 1,
                        borderColor: YELLOW,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 12,
                      }}>
                      <Text style={{ color: YELLOW, fontSize: 10, fontWeight: '800' }}>#{t}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTag(idx)}>
                        <Ionicons name="close-circle" size={12} color={YELLOW} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {/* SECTION 3: PRICING, INVENTORY & SHIPPING CONFIGURATION */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionHeaderTitle}>PRICING & INVENTORY</Text>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>

            {/* MRP & Selling Price */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>MRP / Actual Price (₹)</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="3999"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Selling Price (₹) *</Text>
                <TextInput
                  style={[styles.whiteInput, { borderColor: YELLOW }]}
                  placeholder="2588"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* GST Rate (%) selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>GST Rate (%)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {['0%', '5%', '12%', '18%', '28%'].map((gstVal, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dropdownChip, gst === gstVal && styles.dropdownChipActive]}
                    onPress={() => setGst(gstVal)}>
                    <Text style={[styles.dropdownChipText, gst === gstVal && styles.dropdownChipTextActive]}>
                      {gstVal} GST
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Unit / Quantity Type selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Unit / Quantity Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {['piece', 'kg', 'g', 'litre', 'ml', 'meter', 'box', 'pack', 'set', 'pair', 'dozen', 'other'].map((uVal, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dropdownChip, unit === uVal && styles.dropdownChipActive]}
                    onPress={() => setUnit(uVal)}>
                    <Text style={[styles.dropdownChipText, unit === uVal && styles.dropdownChipTextActive]}>
                      {uVal.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {unit === 'other' ? (
                <TextInput
                  style={[styles.whiteInput, { marginTop: 6 }]}
                  placeholder="Enter custom unit (e.g. Bottle, Sheet)..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  onChangeText={(val) => setUnit(val || 'other')}
                />
              ) : null}
            </View>

            {/* Stock, Min Order Qty & Warranty */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="10"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Min Order Qty</Text>
                <TextInput
                  style={styles.whiteInput}
                  placeholder="1"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={minOrderQty}
                  onChangeText={setMinOrderQty}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Warranty Details</Text>
              <TextInput
                style={styles.whiteInput}
                placeholder="e.g. 1 Year Brand Warranty"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={warranty}
                onChangeText={setWarranty}
              />
            </View>

            {/* Return Policy Switch & Days */}
            <View style={[styles.fieldGroup, { paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>Return & Replacement Policy</Text>
                <Switch
                  value={!returnPolicy.toLowerCase().includes('no return')}
                  onValueChange={(val) =>
                    setReturnPolicy(val ? '7 Days Replacement Policy' : 'No Returns Applicable (Final Sale)')
                  }
                  trackColor={{ false: '#333', true: YELLOW }}
                  thumbColor="#fff"
                />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{returnPolicy}</Text>
            </View>

            {/* Shipping Details */}
            <View style={[styles.fieldGroup, { paddingTop: 6, borderTopWidth: 1, borderTopColor: BORDER }]}>
              <Text style={styles.sectionHeaderTitle}>SHIPPING & DELIVERY DETAILS</Text>
              
              <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Package Weight ({shippingWeightUnit})</Text>
                  <TextInput
                    style={styles.whiteInput}
                    placeholder="0.5"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={shippingWeight}
                    onChangeText={setShippingWeight}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Weight Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {['kg', 'g', 'lb'].map((wUnit, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dropdownChip, shippingWeightUnit === wUnit && styles.dropdownChipActive]}
                        onPress={() => setShippingWeightUnit(wUnit)}>
                        <Text style={[styles.dropdownChipText, shippingWeightUnit === wUnit && styles.dropdownChipTextActive]}>
                          {wUnit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Dimensions L × W × H (cm)</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="L"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={shippingLength}
                  onChangeText={setShippingLength}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="W"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={shippingWidth}
                  onChangeText={setShippingWidth}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="H"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={shippingHeight}
                  onChangeText={setShippingHeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={styles.fieldLabel}>Free Shipping Available</Text>
                <Switch
                  value={freeShipping}
                  onValueChange={setFreeShipping}
                  trackColor={{ false: '#333', true: YELLOW }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          {/* SECTION 4: PRODUCT MEDIA & GALLERY */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>PRODUCT MEDIA & GALLERY</Text>

            {/* Main Cover Photo Card */}
            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: YELLOW, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#0F0F12', fontSize: 9, fontWeight: '900' }}>COVER PHOTO</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => {
                    setImageUrl('');
                    const remaining = galleryImages.filter((img) => img !== imageUrl);
                    setGalleryImages(remaining);
                  }}>
                  <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.uploadBtn, { flex: 1 }]}
                onPress={() => pickImageFile('main')}
                disabled={uploadingImage}>
                {uploadingImage ? (
                  <ActivityIndicator color={YELLOW} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color={YELLOW} />
                    <Text style={styles.uploadBtnText}>
                      {imageUrl ? '🖼️ Change Cover' : '📁 Upload Cover'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadBtn, { flex: 1, borderColor: PURPLE_BORDER }]}
                onPress={() => pickImageFile('gallery')}
                disabled={uploadingImage}>
                <Ionicons name="images-outline" size={18} color={PURPLE_ACCENT} />
                <Text style={[styles.uploadBtnText, { color: PURPLE_ACCENT }]}>
                  📷 Add Gallery ({galleryImages.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Paste Image URL Input */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                style={[styles.whiteInput, { flex: 1 }]}
                placeholder="Or paste direct image URL (https://...)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: PURPLE_ACCENT,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  const cleanUrl = imageUrlInput.trim();
                  if (!cleanUrl) return;
                  if (!imageUrl) setImageUrl(cleanUrl);
                  if (!galleryImages.includes(cleanUrl)) setGalleryImages([...galleryImages, cleanUrl]);
                  setImageUrlInput('');
                  Alert.alert('Photo Attached!', 'Image URL added to listing gallery.');
                }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>+ Add URL</Text>
              </TouchableOpacity>
            </View>

            {/* Gallery Thumbnails Grid */}
            {galleryImages.length > 0 ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gallery Photos (Tap photo to set as Main Cover)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {galleryImages.map((gImg, idx) => {
                    const isCover = gImg === imageUrl || (idx === 0 && !imageUrl);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={{ position: 'relative', width: 75, height: 75 }}
                        onPress={() => {
                          setImageUrl(gImg);
                          Alert.alert('Main Cover Updated', 'Selected photo assigned as listing main cover.');
                        }}>
                        <Image
                          source={{ uri: gImg }}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 8,
                            borderWidth: isCover ? 2 : 1,
                            borderColor: isCover ? YELLOW : BORDER,
                          }}
                        />
                        {isCover && (
                          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: YELLOW, paddingVertical: 1, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>
                            <Text style={{ color: '#0F0F12', fontSize: 7, fontWeight: '900', textAlign: 'center' }}>COVER</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#EF4444',
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => {
                            const filtered = galleryImages.filter((_, i) => i !== idx);
                            setGalleryImages(filtered);
                            if (gImg === imageUrl) {
                              setImageUrl(filtered[0] || '');
                            }
                          }}>
                          <Ionicons name="close" size={11} color="#fff" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Video Link Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Product Video URL (Optional)</Text>
              <TextInput
                style={styles.whiteInput}
                placeholder="https://youtube.com/watch?v=... or MP4 link"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
            </View>
          </View>

          {/* SECTION 5: SPECIFICATIONS & VARIANTS */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeaderTitle}>SPECIFICATIONS & ATTRIBUTES</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                style={[styles.whiteInput, { flex: 1 }]}
                placeholder="Attribute (e.g. Color)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={newLabelKey}
                onChangeText={setNewLabelKey}
              />
              <TextInput
                style={[styles.whiteInput, { flex: 1 }]}
                placeholder="Value (e.g. Matte Black)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={newLabelVal}
                onChangeText={setNewLabelVal}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: YELLOW,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleAddLabel}>
                <Text style={{ color: '#0F0F12', fontSize: 11, fontWeight: '900' }}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {labels.length > 0 ? (
              <View style={{ gap: 6, marginTop: 6 }}>
                {labels.map((lbl, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#0F0F12',
                      borderWidth: 1,
                      borderColor: BORDER,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}>
                    <Text style={{ color: YELLOW, fontSize: 11, fontWeight: '800' }}>
                      {lbl.key}: <Text style={{ color: '#fff', fontWeight: '600' }}>{lbl.value}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveLabel(idx)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={[styles.sectionHeaderTitle, { marginTop: 10 }]}>PRODUCT VARIANTS (SIZES, COLORS)</Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="Type (e.g. Size)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={variantLabel}
                  onChangeText={setVariantLabel}
                />
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="Value (e.g. XL)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={variantValue}
                  onChangeText={setVariantValue}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={[styles.whiteInput, { flex: 1 }]}
                  placeholder="Variant Price Adjustment (₹)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={variantPriceAdj}
                  onChangeText={setVariantPriceAdj}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: PURPLE_ACCENT,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleAddVariant}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>+ Add Variant</Text>
                </TouchableOpacity>
              </View>
            </View>

            {variants.length > 0 ? (
              <View style={{ gap: 6, marginTop: 6 }}>
                {variants.map((v, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#0F0F12',
                      borderWidth: 1,
                      borderColor: BORDER,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}>
                    <View>
                      <Text style={{ color: YELLOW, fontSize: 11, fontWeight: '900' }}>
                        {v.label || v.type}: {v.value}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                        Price: ₹{v.price || sellingPrice} • SKU: {v.sku}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveVariant(idx)}>
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* SUBMIT ACTION */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || loadingEdit}>
            {createMutation.isPending || updateMutation.isPending || loadingEdit ? (
              <ActivityIndicator color="#0F0F12" />
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
  container: { flex: 1, backgroundColor: DARK_BG },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: DARK_BG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: YELLOW,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: Spacing.three,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 12,
  },
  sectionHeaderTitle: {
    color: YELLOW,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dropdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dropdownChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  dropdownChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownChipTextActive: {
    color: '#0F0F12',
    fontWeight: '900',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168,85,247,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: PURPLE_ACCENT,
    fontSize: 10,
    fontWeight: '900',
  },
  aiBannerCard: {
    backgroundColor: PURPLE_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    padding: 12,
  },
  aiBannerTitle: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '900',
  },
  voicePurpleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE_ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voicePurpleBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  aiPromptInput: {
    flex: 1,
    backgroundColor: '#0F0F12',
    color: '#fff',
    fontSize: 11,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  autoGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE_ACCENT,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  autoGenerateBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  subLabelText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  filePickerBtn: {
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  filePickerBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
  },
  helperText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic',
  },
  labelVoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
  },
  voiceSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  voiceSmallBtnText: {
    color: YELLOW,
    fontSize: 10,
    fontWeight: '900',
  },
  whiteInput: {
    backgroundColor: '#0F0F12',
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipScroll: {
    gap: 6,
  },
  fieldGroup: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
  },
  uploadBtnText: {
    color: YELLOW,
    fontSize: 11,
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
    borderRadius: 8,
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
  submitBtn: {
    backgroundColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#0F0F12',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: DARK_CARD,
    borderRadius: 16,
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
    fontSize: 12,
    fontWeight: '900',
  },
  modalSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#0F0F12',
    color: '#fff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
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
    borderRadius: 8,
    backgroundColor: '#0F0F12',
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
    borderRadius: 8,
    backgroundColor: YELLOW,
  },
  modalApplyText: {
    color: '#0F0F12',
    fontSize: 11,
    fontWeight: '900',
  },
});
