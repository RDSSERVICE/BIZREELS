import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, mediaApi } from '../../../lib/api';

// Subcomponents
import ProductCategorySection from './product-form/ProductCategorySection';
import ProductBasicInfoSection from './product-form/ProductBasicInfoSection';
import ProductPricingInventorySection from './product-form/ProductPricingInventorySection';
import ProductMediaSection from './product-form/ProductMediaSection';
import ProductVariantsSpecsSection from './product-form/ProductVariantsSpecsSection';

/**
 * ProductFormModal — Modular product creation/editing modal
 * Sections: Category, Basic Info, Pricing & Inventory, Media, Variants & Specs
 */
export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  categoriesList = [],
  registeredCat = '',
  registeredSubcats = [],
  onboardedCategories = [],
  onboardedSubcategories = [],
  vendorCoords = null,
}) {
  const isEdit = !!editData;

  const defaultCat = editData?.category || registeredCat || (onboardedCategories && onboardedCategories[0]) || '';
  const defaultSub = editData?.subcategory || (registeredSubcats && registeredSubcats[0]) || (onboardedSubcategories && onboardedSubcategories[0]) || '';

  const [form, setForm] = useState({
    category: defaultCat,
    subcategory: defaultSub,
    title: '',
    shortDescription: '',
    description: '',
    brand: '',
    sku: '',
    stock: 10,
    minOrderQty: 1,
    unit: 'piece',
    actualPrice: '',
    sellingPrice: '',
    discount: 0,
    warranty: '',
    returnPolicy: '',
    gst: '',
    tags: [],
    newTag: '',
    shippingDetails: { weight: '', dimensions: '', freeShipping: false, estimatedDays: 5 },
    labels: [],
    newLabelKey: '',
    newLabelVal: '',
    images: [],
    video: '',
    status: 'published',
    isAiGenerating: false,
    variants: [],
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Variant helper states
  const [variantLabel, setVariantLabel] = useState('');
  const [variantValue, setVariantValue] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantPriceAdj, setVariantPriceAdj] = useState('');
  const [variantImageUrl, setVariantImageUrl] = useState('');
  const [variantUploading, setVariantUploading] = useState(false);

  const generateSKU = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const skuCode = `SKU-${rand}-${ts}`;
    setForm((prev) => ({ ...prev, sku: skuCode }));
    setVariantSku(skuCode);
    toast.success('SKU Code Auto-Generated!');
  };

  const generateVariantSKU = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const skuCode = `SKU-${rand}-${ts}`;
    setVariantSku(skuCode);
    toast.success('Variant SKU Auto-Generated!');
  };

  // Dynamic limits state
  const [maxLimits, setMaxLimits] = useState({ maxImages: 5, maxVideos: 1 });

  // Fetch max limits on mount
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const res = await api.get('/v1/listings/limits/media');
        const data = res.data?.data || res.data || {};
        if (data.maxImages !== undefined) {
          setMaxLimits({
            maxImages: Number(data.maxImages) || 5,
            maxVideos: Number(data.maxVideos) || 1,
          });
        }
      } catch (err) {
        console.warn('Could not fetch dynamic listing media limits:', err);
      }
    };
    if (isOpen) {
      fetchLimits();
    }
  }, [isOpen]);

  const allMasterProductCats = useMemo(() => {
    const filtered = categoriesList
      .filter((c) => !c.parent_id && (c.category_type === 'product' || !c.category_type))
      .map((c) => c.name);
    if (filtered.length > 0) return filtered;
    return ['Electronics', 'Fashion', 'Home & Furniture', 'Vehicles', 'Food & Grocery'];
  }, [categoriesList]);

  const productCategories = useMemo(() => {
    const onboarded = (onboardedCategories && onboardedCategories.length > 0)
      ? onboardedCategories
      : (registeredCat ? [registeredCat] : []);

    const validOnboardedProductCats = onboarded.filter((catName) => {
      const catObj = categoriesList.find(
        (c) => !c.parent_id && (c.name === catName || c.id === catName || c._id === catName)
      );
      if (catObj) {
        return catObj.category_type === 'product' || !catObj.category_type;
      }
      return allMasterProductCats.includes(catName);
    });

    if (validOnboardedProductCats.length > 0) {
      return validOnboardedProductCats;
    }

    return allMasterProductCats;
  }, [categoriesList, onboardedCategories, registeredCat, allMasterProductCats]);

  const productSubcategories = useMemo(() => {
    if (!form.category) return [];

    const parent = categoriesList.find(
      (c) => !c.parent_id && (c.name === form.category || c.id === form.category || c._id === form.category)
    );

    let subsFromMaster = [];
    if (parent) {
      subsFromMaster = categoriesList
        .filter((c) => (c.parent_id === parent.id || c.parent_id === parent._id) && (c.category_type === 'product' || !c.category_type))
        .map((c) => c.name);
    }

    const onboardedSubs = (onboardedSubcategories && onboardedSubcategories.length > 0)
      ? onboardedSubcategories
      : (registeredSubcats || []);

    if (onboardedSubs.length > 0) {
      const matched = subsFromMaster.filter(s => onboardedSubs.includes(s));
      const others = subsFromMaster.filter(s => !onboardedSubs.includes(s));
      if (matched.length > 0) {
        return [...matched, ...others];
      }
      if (subsFromMaster.length === 0) {
        return onboardedSubs;
      }
    }

    return subsFromMaster.length > 0 ? subsFromMaster : ['General'];
  }, [categoriesList, form.category, onboardedSubcategories, registeredSubcats]);

  // Default to first category/subcategory if not set
  useEffect(() => {
    if ((!form.category || !productCategories.includes(form.category)) && productCategories.length > 0) {
      updateForm('category', productCategories[0]);
    }
  }, [productCategories, form.category]);

  useEffect(() => {
    if ((!form.subcategory || !productSubcategories.includes(form.subcategory)) && productSubcategories.length > 0) {
      updateForm('subcategory', productSubcategories[0]);
    }
  }, [productSubcategories, form.subcategory]);

  const handleCategoryChange = (val) => {
    updateForm('category', val);
    const parent = categoriesList.find(
      (c) => !c.parent_id && (c.name === val || c.id === val || c._id === val)
    );
    if (parent) {
      const subs = categoriesList.filter((c) => (c.parent_id === parent.id || c.parent_id === parent._id) && (c.category_type === 'product' || !c.category_type));
      if (subs.length > 0) {
        const onboardedMatch = (onboardedSubcategories || []).find(os => subs.some(s => s.name === os));
        updateForm('subcategory', onboardedMatch || subs[0].name);
      } else {
        updateForm('subcategory', (onboardedSubcategories && onboardedSubcategories[0]) || 'General');
      }
    } else {
      updateForm('subcategory', (onboardedSubcategories && onboardedSubcategories[0]) || 'General');
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      const prod = editData.productDetails || {};
      const imgList = editData.images || [];
      const actual = Number(editData.actualPrice || editData.price || 0);
      const selling = Number(editData.salePrice || editData.price || 0);
      const discount = actual > selling && actual > 0 ? Math.round(((actual - selling) / actual) * 100) : (prod.discount || 0);

      setForm({
        category: editData.category || registeredCat || '',
        subcategory: editData.subcategory || '',
        title: editData.title || '',
        shortDescription: editData.shortDescription || '',
        description: editData.description || '',
        brand: prod.brand || '',
        sku: prod.sku || '',
        stock: editData.stock !== undefined ? editData.stock : (prod.stock || 10),
        minOrderQty: prod.minOrderQty || 1,
        unit: prod.unit || 'piece',
        actualPrice: actual || '',
        sellingPrice: selling || '',
        discount,
        warranty: prod.warranty || '',
        returnPolicy: prod.returnPolicy || '',
        gst: prod.gst || '',
        tags: editData.tags || [],
        newTag: '',
        shippingDetails: prod.shippingDetails || { weight: '', dimensions: '', freeShipping: false, estimatedDays: 5 },
        labels: editData.labels || [],
        newLabelKey: '',
        newLabelVal: '',
        images: imgList,
        video: editData.videos?.[0] || '',
        status: editData.status || 'published',
        isAiGenerating: false,
        variants: editData.variants || [],
      });
    }
  }, [editData]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Tags Handlers
  const handleAddTag = () => {
    const tag = form.newTag.trim().replace(/^#/, '');
    if (!tag) return;
    if (form.tags?.includes(tag)) return toast.error('Tag already added');
    setForm((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tag],
      newTag: '',
    }));
  };

  const handleRemoveTag = (idx) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  // Label / Specification Handlers
  const handleAddLabel = () => {
    if (!form.newLabelKey.trim() || !form.newLabelVal.trim()) {
      return toast.error('Enter both attribute and value');
    }
    setForm((prev) => ({
      ...prev,
      labels: [...(prev.labels || []), { key: prev.newLabelKey.trim(), value: prev.newLabelVal.trim() }],
      newLabelKey: '',
      newLabelVal: '',
    }));
  };

  const handleRemoveLabel = (idx) => {
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.filter((_, i) => i !== idx),
    }));
  };

  // Variants Handlers
  const handleAddVariant = () => {
    if (!variantLabel.trim() || !variantValue.trim()) {
      return toast.error('Please enter variant type and value (e.g. Size: XL)');
    }
    const finalVariantPrice = variantPriceAdj !== '' ? Number(variantPriceAdj) : Number(form.sellingPrice || 0);

    const newVar = {
      label: variantLabel.trim(),
      type: variantLabel.trim(),
      value: variantValue.trim(),
      sku: variantSku.trim() || `${form.sku || 'SKU'}-${variantValue.trim().toUpperCase()}`,
      price: finalVariantPrice,
      image: variantImageUrl || undefined,
    };

    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }));

    setVariantValue('');
    setVariantSku('');
    setVariantPriceAdj('');
    setVariantImageUrl('');
    toast.success('Variant option added!');
  };

  const handleRemoveVariant = (idx) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleVariantImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVariantUploading(true);
    const toastId = toast.loading('Uploading variant photo...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaApi.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setVariantImageUrl(url);
        toast.success('Variant photo attached!', { id: toastId });
      }
    } catch {
      toast.error('Failed to upload variant image', { id: toastId });
    } finally {
      setVariantUploading(false);
    }
  };

  // AI Description Generator
  const handleGenerateAiDescription = async () => {
    const promptText = aiPrompt.trim() || `${form.title || form.category || 'Product'} with features`;
    updateForm('isAiGenerating', true);
    const toastId = toast.loading('Gemini AI generating product title & descriptions...');
    try {
      const res = await api.post('/v1/ai/generate-description', {
        prompt: promptText,
        type: 'product',
        category: form.category,
        subcategory: form.subcategory,
        context: {
          brand: form.brand,
          price: form.sellingPrice,
          tags: form.tags,
        },
      });
      const data = res.data?.data || res.data;
      if (data) {
        if (data.title && !form.title) updateForm('title', data.title);
        if (data.shortDescription) updateForm('shortDescription', data.shortDescription);
        if (data.detailedDescription || data.description) {
          updateForm('description', data.detailedDescription || data.description);
        }
        if (data.tags && Array.isArray(data.tags)) {
          setForm((prev) => ({ ...prev, tags: Array.from(new Set([...prev.tags, ...data.tags])) }));
        }
        toast.success('AI description generated successfully!', { id: toastId });
      }
    } catch {
      toast.error('AI generation unavailable. Please enter details manually.', { id: toastId });
    } finally {
      updateForm('isAiGenerating', false);
    }
  };

  // Web Speech API
  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListeningVoice(true);
      toast('Listening... Speak product specs now', { icon: '🎙️' });
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListeningVoice(false);
      toast.success('Voice captured!');
    };
    recognition.onerror = () => {
      setIsListeningVoice(false);
      toast.error('Voice input error. Please try again.');
    };
    recognition.onend = () => setIsListeningVoice(false);
    recognition.start();
  };

  // Multimodal File Scan
  const handleAiAutoFillMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('AI analyzing media to auto-fill product specifications...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await mediaApi.post('/v1/ai/multimodal-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res.data?.data || res.data;
      if (result) {
        if (result.title) updateForm('title', result.title);
        if (result.description) updateForm('description', result.description);
        if (result.suggestedCategory) updateForm('category', result.suggestedCategory);
        if (result.tags && Array.isArray(result.tags)) {
          setForm((prev) => ({ ...prev, tags: Array.from(new Set([...prev.tags, ...result.tags])) }));
        }
        toast.success('Fields auto-filled from media scan!', { id: toastId });
      }
    } catch {
      toast.error('Could not auto-fill from media. Please enter manually.', { id: toastId });
    }
  };

  // File Upload Handlers
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (form.images.length + files.length > maxLimits.maxImages) {
      toast.error(`Exceeded maximum limit of ${maxLimits.maxImages} images!`);
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await mediaApi.post('/v1/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res.data?.url || res.data?.data?.url;
        if (url) uploadedUrls.push(url);
      }
      updateForm('images', [...form.images, ...uploadedUrls]);
      toast.success('Images uploaded successfully!', { id: toastId });
    } catch {
      toast.error('Image upload failed. Check file size.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter product title');
    if (!form.sellingPrice) return toast.error('Please enter selling price');

    setSubmitting(true);
    try {
      const payload = {
        type: 'product',
        category: form.category || 'General',
        subcategory: form.subcategory || 'General',
        title: form.title,
        shortDescription: form.shortDescription || form.title,
        description: form.description || form.shortDescription || form.title,
        price: Number(form.actualPrice || form.sellingPrice),
        salePrice: Number(form.sellingPrice),
        actualPrice: Number(form.actualPrice || form.sellingPrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock || 0),
        images: form.images,
        videos: form.video ? [form.video] : [],
        labels: form.labels,
        tags: form.tags,
        variants: form.variants,
        productDetails: {
          brand: form.brand,
          sku: form.sku,
          minOrderQty: Number(form.minOrderQty || 1),
          unit: form.unit,
          discount: Number(form.discount || 0),
          warranty: form.warranty,
          returnPolicy: form.returnPolicy,
          gst: form.gst,
          shippingDetails: form.shippingDetails,
        },
        location: vendorCoords ? { type: 'Point', coordinates: [vendorCoords.lng, vendorCoords.lat] } : undefined,
        status: form.status,
      };

      if (isEdit) payload._editId = editData._id || editData.id;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Product Listing' : 'Add New Product Listing'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Category & Classification */}
        <ProductCategorySection
          form={form}
          updateForm={updateForm}
          handleCategoryChange={handleCategoryChange}
          productCategories={productCategories}
          productSubcategories={productSubcategories}
        />

        {/* Basic Information */}
        <ProductBasicInfoSection
          form={form}
          updateForm={updateForm}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          isListeningVoice={isListeningVoice}
          toggleVoiceRecording={toggleVoiceRecording}
          handleGenerateAiDescription={handleGenerateAiDescription}
          handleAiAutoFillMedia={handleAiAutoFillMedia}
          generateSKU={generateSKU}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
        />

        {/* Pricing & Inventory */}
        <ProductPricingInventorySection form={form} updateForm={updateForm} />

        {/* Images & Media */}
        <ProductMediaSection
          form={form}
          setForm={setForm}
          maxLimits={maxLimits}
          imageUrlInput={imageUrlInput}
          setImageUrlInput={setImageUrlInput}
          handleImageUpload={handleImageUpload}
          uploading={uploading}
        />

        {/* Variants & Specifications */}
        <ProductVariantsSpecsSection
          form={form}
          updateForm={updateForm}
          handleAddLabel={handleAddLabel}
          handleRemoveLabel={handleRemoveLabel}
          variantLabel={variantLabel}
          setVariantLabel={setVariantLabel}
          variantValue={variantValue}
          setVariantValue={setVariantValue}
          variantSku={variantSku}
          setVariantSku={setVariantSku}
          variantPriceAdj={variantPriceAdj}
          setVariantPriceAdj={setVariantPriceAdj}
          variantImageUrl={variantImageUrl}
          setVariantImageUrl={setVariantImageUrl}
          variantUploading={variantUploading}
          generateVariantSKU={generateVariantSKU}
          handleAddVariant={handleAddVariant}
          handleRemoveVariant={handleRemoveVariant}
          handleVariantImageUpload={handleVariantImageUpload}
        />

        {/* Status */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
            Listing Status
          </label>
          <select
            value={form.status}
            onChange={(e) => updateForm('status', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl font-black text-xs shadow-2xs disabled:opacity-50 transition cursor-pointer border-none"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Product Listing' : 'Publish Product to Marketplace'}
        </button>
      </form>
    </AdminModal>
  );
}
