import React, { useState, useEffect } from 'react';
import {
  FiCpu, FiMic, FiMicOff, FiUploadCloud, FiPlus, FiX, FiImage, FiTag, FiRefreshCw, FiSearch, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import { api, mediaApi } from '../../../lib/api';

function SearchableSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch(value || '');
    }
  }, [value, isOpen]);

  const filteredOptions = React.useMemo(() => {
    if (!search || search === value) return options;
    return options.filter(opt =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, value]);

  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              setSearch(value || '');
            }, 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-2.5 pr-8 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple transition-all disabled:opacity-50 text-text-primary"
        />
        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary pointer-events-none text-[10px]">
          ▼
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg z-50 p-1 space-y-0.5">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-text-tertiary p-2 text-center">No results found</p>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt === value;
              return (
                <div
                  key={idx}
                  onMouseDown={() => {
                    onChange(opt);
                    setSearch(opt);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-purple/10 text-brand-purple font-bold'
                      : 'hover:bg-white/5 text-text-secondary'
                  }`}
                >
                  {opt}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ProductFormModal — Complete product creation/editing form
 * Fields: Name, Description, Short Desc, Category, Subcategory, Brand, SKU,
 * Prices, Stock, Min Order Qty, Unit, Images, Videos, Specifications/Labels,
 * Tags, Warranty, Return Policy, Shipping, GST, Status
 */
export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  categoriesList = [],
  subcategoriesList = [],
  registeredCat = '',
  registeredSubcats = [],
  vendorCoords = null,
}) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    category: registeredCat || '',
    subcategory: registeredSubcats[0] || '',
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
    setForm(prev => ({ ...prev, sku: skuCode }));
    setVariantSku(skuCode);
    toast.success('SKU Code Auto-Generated!');
  };

  const generateVariantSKU = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ts = Date.now().toString().slice(-4);
    const skuCode = `SKU-${rand}-${ts}`;
    setForm(prev => ({ ...prev, sku: skuCode }));
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
            maxVideos: Number(data.maxVideos) || 1
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

  const productCategories = React.useMemo(() => {
    return categoriesList
      .filter(c => !c.parent_id && (c.category_type === 'product' || !c.category_type))
      .map(c => c.name);
  }, [categoriesList]);

  const productSubcategories = React.useMemo(() => {
    if (!form.category) return [];
    const parent = categoriesList.find(
      c => !c.parent_id && (c.name === form.category || c.id === form.category || c._id === form.category)
    );
    if (!parent) return [];
    return categoriesList
      .filter(c => c.parent_id === parent.id || c.parent_id === parent._id)
      .map(c => c.name);
  }, [categoriesList, form.category]);

  // Default to first category/subcategory if not set
  useEffect(() => {
    if (!form.category && productCategories.length > 0) {
      updateForm('category', productCategories[0]);
    }
  }, [productCategories, form.category]);

  useEffect(() => {
    if (!form.subcategory && productSubcategories.length > 0) {
      updateForm('subcategory', productSubcategories[0]);
    }
  }, [productSubcategories, form.subcategory]);

  const handleCategoryChange = (val) => {
    updateForm('category', val);
    const parent = categoriesList.find(
      c => !c.parent_id && (c.name === val || c.id === val || c._id === val)
    );
    if (parent) {
      const subs = categoriesList.filter(c => c.parent_id === parent.id || c.parent_id === parent._id);
      if (subs.length > 0) {
        updateForm('subcategory', subs[0].name);
      } else {
        updateForm('subcategory', 'General');
      }
    } else {
      updateForm('subcategory', 'General');
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        category: editData.category || registeredCat || '',
        subcategory: editData.subcategory || '',
        title: editData.title || '',
        shortDescription: editData.shortDescription || '',
        description: editData.description || '',
        brand: editData.brand || '',
        sku: editData.sku || '',
        stock: editData.stock ?? 10,
        minOrderQty: editData.minOrderQty ?? 1,
        unit: editData.unit || 'piece',
        actualPrice: editData.actualPrice || editData.price || '',
        sellingPrice: editData.sellingPrice || editData.salePrice || '',
        discount: editData.discount || 0,
        warranty: editData.warranty || '',
        returnPolicy: editData.returnPolicy || '',
        gst: editData.gst || '',
        tags: editData.tags || [],
        newTag: '',
        shippingDetails: editData.shippingDetails || { weight: '', dimensions: '', freeShipping: false, estimatedDays: 5 },
        labels: editData.labels || [],
        newLabelKey: '',
        newLabelVal: '',
        images: editData.images || [],
        video: editData.videos?.[0] || '',
        status: editData.status || 'published',
        isAiGenerating: false,
        variants: editData.variants || [],
      });
    }
  }, [editData]);

  // Auto calculate discount
  useEffect(() => {
    const act = parseFloat(form.actualPrice) || 0;
    const sel = parseFloat(form.sellingPrice) || 0;
    if (act > 0 && sel > 0 && sel < act) {
      setForm(prev => ({ ...prev, discount: Math.round(((act - sel) / act) * 100) }));
    } else {
      setForm(prev => ({ ...prev, discount: 0 }));
    }
  }, [form.actualPrice, form.sellingPrice]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleAddLabel = () => {
    if (!form.newLabelKey || !form.newLabelVal) return;
    setForm(prev => ({
      ...prev,
      labels: [...prev.labels, { key: prev.newLabelKey.trim(), value: prev.newLabelVal.trim() }],
      newLabelKey: '', newLabelVal: ''
    }));
  };

  const handleRemoveLabel = (idx) => {
    setForm(prev => ({ ...prev, labels: prev.labels.filter((_, i) => i !== idx) }));
  };

  const handleAddTag = () => {
    if (!form.newTag.trim()) return;
    if (form.tags.includes(form.newTag.trim())) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, prev.newTag.trim()], newTag: '' }));
  };

  const handleRemoveTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);
    try {
      const urls = [];
      for (const file of files) {
        const res = await mediaApi.upload(file, 'listings/products');
        const url = res.data?.secure_url || res.data?.url;
        if (url) urls.push(url);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded!`, { id: toastId });
    } catch (err) {
      toast.error('Image upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  // AI Sample Upload Auto-Fill
  const handleAiAutoFill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateForm('isAiGenerating', true);
    const toastId = toast.loading('AI analyzing media sample in real-time...');
    try {
      let resource_type = 'image';
      if (file.type.startsWith('audio')) resource_type = 'raw'; // use raw for audio/voice notes in media upload
      if (file.type.startsWith('video')) resource_type = 'video';

      const uploadRes = await mediaApi.upload(file, 'listings/ai-samples', resource_type);
      const url = uploadRes.data?.secure_url || uploadRes.data?.url || uploadRes.data?.data?.url;

      if (!url) throw new Error('File upload failed');

      // Now call AI API
      const aiRes = await api.post('/v1/ai/generate-listing-content', {
        title: form.title || file.name.split('.')[0] || 'Product Sample',
        type: 'new_product',
        image_urls: resource_type === 'image' ? [url] : [],
        audio_url: resource_type === 'raw' ? url : undefined,
        video_url: resource_type === 'video' ? url : undefined,
      });

      const data = aiRes.data?.data || aiRes.data || aiRes;
      if (data && data.generated) {
        const gen = data.generated;
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        const ts = Date.now().toString().slice(-4);
        const skuCode = `SKU-${rand}-${ts}`;
        
        const flatVariants = [];
        if (Array.isArray(gen.variants)) {
          for (const v of gen.variants) {
            if (v && v.options && Array.isArray(v.options)) {
              for (const opt of v.options) {
                flatVariants.push({
                  name: `${v.name}: ${opt}`,
                  priceAdjustment: 0,
                  stock: -1,
                });
              }
            }
          }
        }

        setForm(prev => {
          const mappedLabels = (Array.isArray(gen.specifications) && gen.specifications.length > 0)
            ? gen.specifications.map(s => ({ key: s.key, value: s.value }))
            : (Array.isArray(gen.features) ? gen.features.map(f => ({ key: f, value: 'Yes' })) : prev.labels);

          return {
            ...prev,
            title: gen.title || prev.title || `AI ${file.name.split('.')[0]}`,
            brand: gen.brand || prev.brand,
            shortDescription: gen.short_description || prev.shortDescription,
            description: gen.description || prev.description,
            tags: gen.tags || prev.tags,
            labels: mappedLabels,
            variants: flatVariants.length > 0 ? flatVariants : prev.variants,
            actualPrice: gen.suggested_price_range_inr?.max || prev.actualPrice,
            sellingPrice: gen.suggested_price_range_inr?.min || prev.sellingPrice,
            sku: prev.sku || skuCode,
          };
        });
        setVariantSku(prev => prev || skuCode);
        toast.success('AI extracted specs, price & details in real-time!', { id: toastId });
      } else {
        throw new Error('AI returned empty response');
      }
    } catch (err) {
      toast.error('AI extraction failed: ' + (err.message || 'Error'), { id: toastId });
    } finally {
      updateForm('isAiGenerating', false);
    }
  };

  // Voice Input for AI Prompts
  const toggleVoiceRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error('Voice input is not supported in this browser.');
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';
      recognition.onstart = () => {
        setIsListeningVoice(true);
        toast.success('🎙️ Listening... Speak product details now');
      };
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) setAiPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      recognition.onerror = (event) => {
        setIsListeningVoice(false);
        toast.error(`Voice error: ${event.error}`);
      };
      recognition.onend = () => setIsListeningVoice(false);
      recognition.start();
    } catch {
      setIsListeningVoice(false);
      toast.error('Failed to start voice input');
    }
  };

  // Generate AI Content from Prompts / Voice details
  const handleGenerateAiContent = async (e) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return toast.error('Please enter or dictate a prompt for AI generation');
    updateForm('isAiGenerating', true);
    const toastId = toast.loading('✨ Google Gemini AI is generating real-time details...');
    try {
      const aiRes = await api.post('/v1/ai/generate-listing-content', {
        title: form.title || aiPrompt.trim().slice(0, 100) || 'Product Sample',
        type: 'new_product',
        hints: aiPrompt.trim(),
        category_name: form.category,
        sub_category_name: form.subcategory,
      });

      const data = aiRes.data?.data || aiRes.data || aiRes;
      if (data && data.generated) {
        const gen = data.generated;
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        const ts = Date.now().toString().slice(-4);
        const skuCode = `SKU-${rand}-${ts}`;

        const flatVariants = [];
        if (Array.isArray(gen.variants)) {
          for (const v of gen.variants) {
            if (v && v.options && Array.isArray(v.options)) {
              for (const opt of v.options) {
                flatVariants.push({
                  name: `${v.name}: ${opt}`,
                  priceAdjustment: 0,
                  stock: -1,
                });
              }
            }
          }
        }

        setForm(prev => {
          const mappedLabels = (Array.isArray(gen.specifications) && gen.specifications.length > 0)
            ? gen.specifications.map(s => ({ key: s.key, value: s.value }))
            : (Array.isArray(gen.features) ? gen.features.map(f => ({ key: f, value: 'Yes' })) : prev.labels);

          return {
            ...prev,
            title: gen.title || prev.title || 'AI Product',
            brand: gen.brand || prev.brand,
            shortDescription: gen.short_description || prev.shortDescription,
            description: gen.description || prev.description,
            tags: gen.tags || prev.tags,
            labels: mappedLabels,
            variants: flatVariants.length > 0 ? flatVariants : prev.variants,
            actualPrice: gen.suggested_price_range_inr?.max || prev.actualPrice,
            sellingPrice: gen.suggested_price_range_inr?.min || prev.sellingPrice,
            sku: prev.sku || skuCode,
          };
        });
        setVariantSku(prev => prev || skuCode);
        toast.success('✨ Gemini AI specifications & details generated in real-time!', { id: toastId });
      } else {
        throw new Error('AI returned empty response');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to generate AI content';
      toast.error(`⚠️ ${errMsg}`, { id: toastId });
    } finally {
      updateForm('isAiGenerating', false);
    }
  };

  const handleVariantImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVariantUploading(true);
    const toastId = toast.loading('Uploading variant image...');
    try {
      const res = await mediaApi.upload(file, 'listings/variants');
      const url = res.data?.secure_url || res.data?.url;
      if (url) {
        setVariantImageUrl(url);
        toast.success('Variant image uploaded!', { id: toastId });
      }
    } catch {
      toast.error('Failed to upload variant image', { id: toastId });
    } finally {
      setVariantUploading(false);
    }
  };

  const handleAddVariant = () => {
    if (!variantLabel.trim() || !variantValue.trim()) {
      return toast.error('Variant label and value are required');
    }
    const name = `${variantLabel.trim()}: ${variantValue.trim()}`;
    const newVar = {
      name,
      priceAdjustment: Number(variantPriceAdj) || 0,
      sku: variantSku.trim() || undefined,
      stock: -1,
      image: variantImageUrl || undefined,
      imageUrl: variantImageUrl || undefined,
    };
    setForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVar]
    }));
    setVariantLabel('');
    setVariantValue('');
    setVariantSku('');
    setVariantPriceAdj('');
    setVariantImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Product name is required');
    if (!form.sellingPrice) return toast.error('Selling price is required');

    setSubmitting(true);
    try {
      const payload = {
        type: 'product',
        category: form.category || 'General',
        subcategory: form.subcategory || 'General',
        title: form.title.trim(),
        shortDescription: form.shortDescription,
        description: form.description,
        brand: form.brand,
        sku: form.sku,
        actualPrice: Number(form.actualPrice || form.sellingPrice),
        sellingPrice: Number(form.sellingPrice),
        price: Number(form.actualPrice || form.sellingPrice),
        salePrice: Number(form.sellingPrice),
        stock: Number(form.stock),
        minOrderQty: Number(form.minOrderQty),
        unit: form.unit,
        warranty: form.warranty,
        returnPolicy: form.returnPolicy,
        gst: form.gst,
        tags: form.tags,
        shippingDetails: form.shippingDetails,
        labels: form.labels,
        images: form.images,
        videos: form.video ? [form.video] : [],
        location: vendorCoords ? { type: 'Point', coordinates: [vendorCoords.lng, vendorCoords.lat] } : undefined,
        status: form.status,
        variants: form.variants || [],
      };

      if (isEdit) payload._editId = editData._id || editData.id;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product Listing' : 'Add New Product'} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        
        {/* SECTION 1: BASIC INFO & CLASSIFICATION */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider">1. Basic Info & Classification</h4>
            <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <FiCpu size={12} /> AI Assisted
            </span>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              label="Category"
              placeholder="Search category..."
              value={form.category}
              onChange={handleCategoryChange}
              options={productCategories}
            />
            <SearchableSelect
              label="Subcategory"
              placeholder="Search subcategory..."
              value={form.subcategory}
              onChange={(val) => updateForm('subcategory', val)}
              options={productSubcategories}
            />
          </div>

          {/* AI Assisted Generator */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-brand-purple/10 via-brand-pink/10 to-brand-orange/10 border border-brand-purple/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-purple flex items-center gap-1">
                <FiCpu size={14} /> AI Description & Specs Generator (Voice & Text)
              </span>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  isListeningVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-brand-purple text-white hover:bg-brand-purple/90'
                }`}
                title="Speak details to AI"
              >
                {isListeningVoice ? <FiMicOff size={12} /> : <FiMic size={12} />}
                <span>{isListeningVoice ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your product (e.g. '128GB black iPhone 14 in brand new condition') or speak..."
                className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
              <button
                type="button"
                onClick={handleGenerateAiContent}
                disabled={form.isAiGenerating || !aiPrompt.trim()}
                className="px-3.5 py-1.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition flex items-center gap-1 disabled:opacity-50 shrink-0"
              >
                <FiCpu size={13} />
                <span>{form.isAiGenerating ? 'Generating...' : 'Auto-Generate'}</span>
              </button>
            </div>

            {/* Real-time Media Auto-Fill */}
            <div className="pt-2 border-t border-brand-purple/10 space-y-1">
              <label className="text-[10px] font-bold text-brand-purple uppercase block">Or Upload Media for AI Auto-Fill</label>
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleAiAutoFill}
                className="text-xs text-text-tertiary"
              />
              <p className="text-[9px] text-text-tertiary">
                Gemini will scan your sample photo/video/voice note to extract specifications & details.
              </p>
            </div>
          </div>

          {/* Product Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Product Name *</label>
              <input type="text" required value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="e.g. Wireless Noise Cancelling Headphones" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Brand</label>
              <input type="text" value={form.brand} onChange={(e) => updateForm('brand', e.target.value)} placeholder="e.g. Sony, Samsung" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Short Description</label>
            <input type="text" value={form.shortDescription} onChange={(e) => updateForm('shortDescription', e.target.value)} placeholder="Brief one-liner..." className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" maxLength={300} />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Full Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Detailed product description..." className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
        </div>

        {/* SECTION 2: PRICING & INVENTORY */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider mb-1">2. Pricing & Inventory</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">SKU</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, sku: val }));
                    setVariantSku(val);
                  }}
                  placeholder="SKU-001"
                  className="w-full p-2.5 pr-10 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  title="Auto-Generate SKU"
                  className="absolute right-2 p-1.5 rounded-lg hover:bg-brand-purple/10 text-brand-purple transition-all cursor-pointer"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => updateForm('unit', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
                <option value="piece">Piece</option>
                <option value="kg">Kg</option>
                <option value="liter">Liter</option>
                <option value="meter">Meter</option>
                <option value="set">Set</option>
                <option value="box">Box</option>
                <option value="pair">Pair</option>
                <option value="dozen">Dozen</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order Qty</label>
              <input type="number" min={1} value={form.minOrderQty} onChange={(e) => updateForm('minOrderQty', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">GST %</label>
              <input type="text" value={form.gst} onChange={(e) => updateForm('gst', e.target.value)} placeholder="18%" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Stock *</label>
              <input type="number" value={form.stock} onChange={(e) => updateForm('stock', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Actual Price (₹)</label>
              <input type="number" value={form.actualPrice} onChange={(e) => updateForm('actualPrice', e.target.value)} placeholder="3999" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Selling Price (₹) *</label>
              <input type="number" required value={form.sellingPrice} onChange={(e) => updateForm('sellingPrice', e.target.value)} placeholder="2499" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount %</label>
              <input type="text" disabled value={`${form.discount}%`} className="w-full p-2.5 bg-surface-tertiary font-bold text-emerald-600 border border-border rounded-xl text-xs" />
            </div>
          </div>
        </div>

        {/* SECTION 3: WARRANTY & SHIPPING */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider mb-1">3. Warranty & Shipping</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Warranty</label>
              <input type="text" value={form.warranty} onChange={(e) => updateForm('warranty', e.target.value)} placeholder="e.g. 1 Year Manufacturer Warranty" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Return Policy</label>
              <input type="text" value={form.returnPolicy} onChange={(e) => updateForm('returnPolicy', e.target.value)} placeholder="e.g. 7-day return policy" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
            </div>
          </div>

          <div className="p-3 bg-surface rounded-2xl border border-border space-y-3">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Shipping Specifications</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input type="text" value={form.shippingDetails.weight} onChange={(e) => setForm(prev => ({ ...prev, shippingDetails: { ...prev.shippingDetails, weight: e.target.value } }))} placeholder="Weight (e.g. 500g)" className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
              <input type="text" value={form.shippingDetails.dimensions} onChange={(e) => setForm(prev => ({ ...prev, shippingDetails: { ...prev.shippingDetails, dimensions: e.target.value } }))} placeholder="Dimensions" className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
              <input type="number" min={1} value={form.shippingDetails.estimatedDays} onChange={(e) => setForm(prev => ({ ...prev, shippingDetails: { ...prev.shippingDetails, estimatedDays: Number(e.target.value) } }))} placeholder="Est. days" className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
              <label className="flex items-center gap-2 text-xs font-semibold select-none cursor-pointer">
                <input type="checkbox" checked={form.shippingDetails.freeShipping} onChange={(e) => setForm(prev => ({ ...prev, shippingDetails: { ...prev.shippingDetails, freeShipping: e.target.checked } }))} className="w-4 h-4 rounded text-brand-purple" />
                Free Shipping
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 4: PRODUCT MEDIA */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider mb-1">4. Product Media</h4>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Product Images (Max {maxLimits.maxImages})</label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group">
                  <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]">
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {form.images.length < maxLimits.maxImages ? (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-brand-purple flex items-center justify-center cursor-pointer transition bg-surface">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  {uploading ? <div className="w-4 h-4 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" /> : <FiUploadCloud className="w-5 h-5 text-text-tertiary" />}
                </label>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-tertiary border border-border flex flex-col items-center justify-center text-[8px] text-text-tertiary text-center font-bold">
                  Max limit reached
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 p-2.5 bg-surface border border-border rounded-xl text-xs outline-none focus:border-brand-purple"
              />
              <button
                type="button"
                onClick={() => {
                  if (!imageUrlInput.trim()) return;
                  if (form.images.length >= maxLimits.maxImages) {
                    toast.error(`Maximum allowed images is ${maxLimits.maxImages}`);
                    return;
                  }
                  setForm(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
                  setImageUrlInput('');
                  toast.success('Image URL added!');
                }}
                className="px-3.5 py-2.5 bg-brand-purple text-white rounded-xl text-xs font-bold transition hover:bg-brand-purple/90 shrink-0"
              >
                Add URL
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Product Video URL (Optional, Max {maxLimits.maxVideos})</label>
            <input 
              type="url" 
              value={form.video} 
              onChange={(e) => updateForm('video', e.target.value)} 
              placeholder="https://..." 
              className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
              disabled={maxLimits.maxVideos === 0 || (!!form.video && maxLimits.maxVideos <= 1)}
            />
          </div>
        </div>

        {/* SECTION 5: VARIANTS, SPECIFICATIONS & STATUS */}
        <div className="space-y-3 p-4 bg-surface-secondary rounded-2xl border border-border">
          <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider mb-1">5. Variants, Specs & Status</h4>
          
          {/* Product Variants Section */}
          <div className="space-y-3 pt-1">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Product Variants (Manage Options)</label>
            {form.variants && form.variants.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {form.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      {v.imageUrl && <img src={v.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border" />}
                      <div>
                        <span className="font-bold text-text-primary">{v.name}</span>
                        {v.priceAdjustment !== 0 && (
                          <span className="text-[10px] text-emerald-600 block">Adjustment: +₹{v.priceAdjustment}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))} 
                      className="text-red-500 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-surface p-3 rounded-2xl border border-border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Label (e.g. Color, RAM)" value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
                <input type="text" placeholder="Value (e.g. Black, 256 GB)" value={variantValue} onChange={(e) => setVariantValue(e.target.value)} className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="SKU (Optional)"
                    value={variantSku}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVariantSku(val);
                      setForm(prev => ({ ...prev, sku: val }));
                    }}
                    className="w-full p-2 pr-8 bg-surface-secondary border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
                  />
                  <button
                    type="button"
                    onClick={generateVariantSKU}
                    title="Auto-Generate SKU"
                    className="absolute right-1.5 p-1 rounded hover:bg-brand-purple/10 text-brand-purple transition-all cursor-pointer"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input type="number" placeholder="Price Adjustment (Optional)" value={variantPriceAdj} onChange={(e) => setVariantPriceAdj(e.target.value)} className="p-2 bg-surface-secondary border border-border rounded-xl text-xs" />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  {variantImageUrl && <img src={variantImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border animate-fade-in" />}
                  <label className="px-3 py-1.5 bg-surface-secondary border border-border rounded-xl text-xs font-bold cursor-pointer hover:bg-surface-tertiary transition select-none">
                    <input type="file" accept="image/*" onChange={handleVariantImageUpload} className="hidden" />
                    {variantUploading ? 'Uploading...' : 'Upload Variant Image'}
                  </label>
                </div>
                <button type="button" onClick={handleAddVariant} className="px-4 py-1.5 bg-brand-purple text-white rounded-xl text-xs font-bold shadow-sm">+ Add Variant</button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-brand-purple/10 text-brand-purple text-[10px] font-bold rounded-lg flex items-center gap-1">
                  <FiTag className="w-2.5 h-2.5" /> {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={form.newTag} onChange={(e) => updateForm('newTag', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Add tag..." className="flex-1 p-2 bg-surface border border-border rounded-xl text-xs" />
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold">+ Tag</button>
            </div>
          </div>

          {/* Product Labels / Specifications */}
          <div className="space-y-2 border-t border-border pt-3">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Product Specifications (Labels)</label>
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.labels.map((lbl, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-surface border border-border text-xs rounded-xl flex items-center gap-1.5">
                    <strong className="text-brand-purple">{lbl.key}:</strong> {lbl.value}
                    <button type="button" onClick={() => handleRemoveLabel(idx)} className="text-text-tertiary hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <input type="text" placeholder="Label Key (e.g. Battery)" value={form.newLabelKey} onChange={(e) => updateForm('newLabelKey', e.target.value)} className="flex-1 p-2 bg-surface border border-border rounded-xl text-xs" />
              <input type="text" placeholder="Value (e.g. 5000 mAh)" value={form.newLabelVal} onChange={(e) => updateForm('newLabelVal', e.target.value)} className="flex-1 p-2 bg-surface border border-border rounded-xl text-xs" />
              <button type="button" onClick={handleAddLabel} className="px-3 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold">+ Add</button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Listing Status</label>
            <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting} className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium disabled:opacity-50 transition">
          {submitting ? 'Saving...' : isEdit ? 'Update Product Listing' : 'Publish Product to Database'}
        </button>
      </form>
    </AdminModal>
  );
}
