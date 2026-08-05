import React, { useState, useEffect } from 'react';
import {
  FiLayers, FiTag, FiVideo, FiCheckCircle, FiCheck, FiImage, FiX, FiMapPin, FiUsers, FiEye, FiPlus,
  FiPercent, FiZap, FiBell, FiStar, FiGift, FiCalendar, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import CreateServiceModal from './CreateServiceModal';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';

// PURPOSE OPTIONS PER POST TYPE
const PURPOSE_OPTIONS = {
  services: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'Standard showcase & visibility', icon: FiStar, color: 'amber' },
    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Promote a discount or coupon', icon: FiPercent, color: 'green' },
    { key: 'Announcement', label: 'Announcement', desc: 'Updates or important info', icon: FiBell, color: 'blue' },
    { key: 'New Service Launch', label: 'New Launch', desc: 'Introduce a brand-new service', icon: FiZap, color: 'purple' },
  ],
  product: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'Standard showcase & visibility', icon: FiStar, color: 'amber' },
    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Promote a discount or coupon', icon: FiPercent, color: 'green' },
    { key: 'New Arrival', label: 'New Arrival', desc: 'Showcase a new product', icon: FiZap, color: 'purple' },
    { key: 'Flash Sale', label: 'Flash Sale', desc: 'Limited-time deal with urgency', icon: FiGift, color: 'red' },
  ],
  shop: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'General business showcase', icon: FiStar, color: 'amber' },
    { key: 'Grand Opening', label: 'Grand Opening', desc: 'New shop or branch launch', icon: FiZap, color: 'purple' },
    { key: 'Special Event', label: 'Special Event', desc: 'Sale event, fair, or seasonal', icon: FiCalendar, color: 'blue' },
    { key: 'Business Update', label: 'Business Update', desc: 'Hours, location, or news update', icon: FiAlertCircle, color: 'orange' },
  ],
};

const COLOR_MAP = {
  amber:  { active: 'bg-amber-500/10 border-amber-500 text-amber-700',  dot: 'bg-amber-500'  },
  green:  { active: 'bg-emerald-500/10 border-emerald-500 text-emerald-700', dot: 'bg-emerald-500' },
  blue:   { active: 'bg-blue-500/10 border-blue-500 text-blue-700',     dot: 'bg-blue-500'   },
  purple: { active: 'bg-brand-purple/10 border-brand-purple text-brand-purple', dot: 'bg-brand-purple' },
  red:    { active: 'bg-red-500/10 border-red-500 text-red-700',        dot: 'bg-red-500'    },
  orange: { active: 'bg-orange-500/10 border-orange-500 text-orange-700', dot: 'bg-orange-500' },
};

// PROMOTION AREAS
const PROMOTION_AREAS = [
  'Within 1 KM',
  'Within 2 KM',
  'Within 3 KM',
  'Within 5 KM',
  'Within 10 KM',
  'Within 25 KM',
  'Within 50 KM',
  'Within 100 KM',
  'Entire City',
  'Entire District',
  'Entire State',
  'Pan India',
];

// PREDEFINED TARGET AUDIENCE GROUPS
const PREDEFINED_AUDIENCES = [
  'User / Customer',
  'Vendor',
  'Creator',
  'Student',
  'Doctor',
  'Teacher',
  'Business Owner',
  'Shopkeeper',
  'Professional',
  'Restaurant',
  'Hospital',
  'School / College',
  'Builder',
  'Real Estate',
  'Automobile',
  'Agriculture',
  'Electronics',
  'Fashion',
  'Anyone (All Users)',
];

export default function CreateReelWizardModal({
  isOpen,
  onClose,
  vendorListings,
  onOpenPreview,
  
  // States passed from parent so parent has access to them for preview/publish
  postType,
  setPostType,
  postCategory,
  setPostCategory,
  postSubcategory,
  setPostSubcategory,
  postPurpose,
  setPostPurpose,
  discountPercent,
  setDiscountPercent,
  couponCode,
  setCouponCode,
  discountValidity,
  setDiscountValidity,
  announcementTagline,
  setAnnouncementTagline,
  selectedServiceId,
  setSelectedServiceId,
  selectedServiceData,
  setSelectedServiceData,
  selectedProductId,
  setSelectedProductId,
  selectedProductData,
  setSelectedProductData,
  mediaOption,
  setMediaOption,
  uploadMode,
  setUploadMode,
  selectedServiceMediaUrls,
  setSelectedServiceMediaUrls,
  customMediaUrl,
  setCustomMediaUrl,
  customMediaList,
  setCustomMediaList,
  mediaType,
  setMediaType,
  saveToServiceGallery,
  setSaveToServiceGallery,
  caption,
  setCaption,
  promotionArea,
  setPromotionArea,
  selectedTargetAudiences,
  setSelectedTargetAudiences,
  customTargetAudience,
  setCustomTargetAudience
}) {
  const [wizardStep, setWizardStep] = useState(1);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);

  // Fetch dynamic categories from admin settings
  const { data: categoriesDataRes } = useListCategoriesQuery();
  const categoriesList = categoriesDataRes?.items || [];

  const dynamicCategoriesData = React.useMemo(() => {
    const data = {};
    const parents = categoriesList.filter(c => !c.parent_id);
    const children = categoriesList.filter(c => c.parent_id);

    parents.forEach(parent => {
      const parentId = parent.id || parent._id;
      const subcategories = children
        .filter(child => child.parent_id === parentId)
        .map(child => child.name);
      data[parent.name] = subcategories;
    });

    return data;
  }, [categoriesList]);

  // Set default category / subcategory dynamically from DB data
  useEffect(() => {
    const available = Object.keys(dynamicCategoriesData);
    if (available.length > 0) {
      if (!postCategory || !available.includes(postCategory)) {
        setPostCategory(available[0]);
      }
    }
  }, [dynamicCategoriesData, postCategory, setPostCategory]);

  useEffect(() => {
    if (postCategory && dynamicCategoriesData[postCategory]) {
      const subs = dynamicCategoriesData[postCategory];
      if (subs.length > 0) {
        if (!postSubcategory || !subs.includes(postSubcategory)) {
          setPostSubcategory(subs[0]);
        }
      } else {
        setPostSubcategory('General');
      }
    } else {
      setPostSubcategory('General');
    }
  }, [postCategory, dynamicCategoriesData, postSubcategory, setPostSubcategory]);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setPostCategory(cat);
    const subcats = dynamicCategoriesData[cat] || [];
    setPostSubcategory(subcats[0] || 'General');
  };

  const vendorServices = vendorListings.filter(l => l.type === 'service' || !l.type);
  const vendorProducts = vendorListings.filter(l => l.type === 'product');

  // Handle Existing Service Selection
  const handleSelectExistingService = (serviceId) => {
    setSelectedServiceId(serviceId);
    if (!serviceId) {
      setSelectedServiceData(null);
      setSelectedServiceMediaUrls([]);
      return;
    }
    const service = vendorServices.find(s => (s._id || s.id) === serviceId);
    if (service) {
      setSelectedServiceData(service);
      if (service.category) setPostCategory(service.category);
      if (service.subcategory) setPostSubcategory(service.subcategory);
      if (service.title && !caption) setCaption(service.title + ' - ' + (service.description || ''));

      const media = [...(service.images || []), ...(service.videos || [])];
      if (media.length > 0) {
        setSelectedServiceMediaUrls([media[0]]);
      } else {
        setSelectedServiceMediaUrls([]);
      }
    }
  };

  // Handle Existing Product Selection
  const handleSelectExistingProduct = (productId) => {
    setSelectedProductId(productId);
    if (!productId) {
      setSelectedProductData(null);
      setSelectedServiceMediaUrls([]);
      return;
    }
    const product = vendorProducts.find(p => (p._id || p.id) === productId);
    if (product) {
      setSelectedProductData(product);
      if (product.category) setPostCategory(product.category);
      if (product.subcategory) setPostSubcategory(product.subcategory);
      if (product.title && !caption) setCaption(product.title + ' - ' + (product.description || ''));

      const media = [...(product.images || []), ...(product.videos || [])];
      if (media.length > 0) {
        setSelectedServiceMediaUrls([media[0]]);
      } else {
        setSelectedServiceMediaUrls([]);
      }
    }
  };

  const handleServiceCreated = (newService) => {
    if (newService) {
      const id = newService._id || newService.id;
      setSelectedServiceId(id);
      setSelectedServiceData(newService);
      if (newService.category) setPostCategory(newService.category);
      if (newService.subcategory) setPostSubcategory(newService.subcategory);
      if (newService.title) setCaption(newService.title + ' - ' + (newService.description || ''));
      const media = [...(newService.images || []), ...(newService.videos || [])];
      if (media.length > 0) setSelectedServiceMediaUrls([media[0]]);
      toast.success(`Selected newly created service: "${newService.title}"`);
    }
  };

  // Handle File Uploads (Limit up to 5)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 5 - customMediaList.length;
    if (availableSlots <= 0) {
      return toast.error('Maximum 5 media items allowed per post.');
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.error(`Maximum 5 images/videos allowed. Only processing first ${availableSlots} file(s).`);
    }

    const readPromises = filesToProcess.map((file) => {
      return new Promise((resolve) => {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`Skipped ${file.name}: exceeds 50MB limit.`);
          return resolve(null);
        }
        const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)$/i);
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve({
            url: evt.target.result,
            name: file.name,
            type: isVideo ? 'video' : 'image',
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((results) => {
      const validResults = results.filter(Boolean);
      setCustomMediaList((prev) => [...prev, ...validResults]);
      if (validResults.some(r => r.type === 'video')) {
        setMediaType('video');
      } else if (customMediaList.length === 0) {
        setMediaType('image');
      }
    });
  };

  const removeCustomMediaItem = (index) => {
    setCustomMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleServiceMediaUrl = (url) => {
    if (selectedServiceMediaUrls.includes(url)) {
      setSelectedServiceMediaUrls((prev) => prev.filter((u) => u !== url));
    } else {
      if (selectedServiceMediaUrls.length >= 5) {
        return toast.error('Maximum 5 gallery media items allowed.');
      }
      setSelectedServiceMediaUrls((prev) => [...prev, url]);
    }
  };

  const toggleAudienceTag = (tag) => {
    if (tag === 'Anyone (All Users)') {
      setSelectedTargetAudiences(['Anyone (All Users)']);
      return;
    }
    let updated = selectedTargetAudiences.filter(t => t !== 'Anyone (All Users)');
    if (updated.includes(tag)) {
      updated = updated.filter(t => t !== tag);
    } else {
      updated.push(tag);
    }
    if (updated.length === 0) updated = ['Anyone (All Users)'];
    setSelectedTargetAudiences(updated);
  };

  const modalTitle =
    postType === 'product' ? 'Create Product Reel / Image Post Flow' :
    postType === 'shop'    ? 'Create Shop / Business Reel Flow' :
                            'Create Service Reel / Image Post Flow';

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        
        {/* STEP INDICATOR HEADER */}
        <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
          <span className="font-extrabold text-brand-purple uppercase tracking-wider text-[10px] sm:text-xs">
            Step {wizardStep} of 3: {
              wizardStep === 1 ? 'Content & Category' :
              wizardStep === 2 ? 'Media & Caption' :
              'Promotion & Audience'
            }
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition ${
                  wizardStep === s ? 'bg-brand-purple text-white shadow-sm' :
                  wizardStep > s ? 'bg-emerald-500 text-white' : 'bg-surface-secondary text-text-tertiary border'
                }`}
              >
                {wizardStep > s ? <FiCheck size={12} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: CONTENT TYPE, CATEGORY & PURPOSE ── */}
        {wizardStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* 1. SELECT CONTENT TYPE */}
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                1. Select Content Type *
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPostType('services')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    postType === 'services'
                      ? 'bg-brand-purple text-white border-brand-purple shadow-md'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-purple/50'
                  }`}
                >
                  <FiLayers size={18} />
                  <span>Service Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('product')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    postType === 'product'
                      ? 'bg-brand-purple text-white border-brand-purple shadow-md'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-purple/50'
                  }`}
                >
                  <FiTag size={18} />
                  <span>Product Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('shop')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                    postType === 'shop'
                      ? 'bg-brand-purple text-white border-brand-purple shadow-md'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-purple/50'
                  }`}
                >
                  <FiVideo size={18} />
                  <span>Shop / Business</span>
                </button>
              </div>
            </div>

            {/* 2. SELECT CATEGORY */}
            <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
              <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                <FiLayers /> 2. Select {postType === 'product' ? 'Product' : postType === 'services' ? 'Service' : 'Shop'} Category
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                    Category *
                  </label>
                  <select
                    value={postCategory}
                    onChange={handleCategoryChange}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple"
                  >
                    {Object.keys(dynamicCategoriesData).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                    Sub Category *
                  </label>
                  <select
                    value={postSubcategory}
                    onChange={(e) => setPostSubcategory(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple"
                  >
                    {(dynamicCategoriesData[postCategory] || ['General']).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SELECT PURPOSE */}
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-2">
                3. Select Post Purpose *
              </label>

              <div className="grid grid-cols-2 gap-2">
                {(PURPOSE_OPTIONS[postType] || PURPOSE_OPTIONS.services).map(p => {
                  const isActive = postPurpose === p.key;
                  const Icon = p.icon;
                  const colors = COLOR_MAP[p.color];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setPostPurpose(p.key);
                        // Reset extra fields when purpose changes
                        setDiscountPercent('');
                        setCouponCode('');
                        setDiscountValidity('');
                        setAnnouncementTagline('');
                      }}
                      className={`p-3 rounded-xl text-left border-2 transition-all ${
                        isActive
                          ? colors.active + ' shadow-sm scale-[1.01]'
                          : 'bg-surface border-border text-text-secondary hover:border-border/80 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isActive ? colors.dot + ' text-white' : 'bg-surface-secondary text-text-tertiary'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <span className="font-bold text-[11px]">{p.label}</span>
                        </div>
                        {isActive && <FiCheckCircle size={14} className="flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-text-tertiary block leading-tight">{p.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* CONDITIONAL EXTRA FIELDS — Offer / Discount & Flash Sale */}
              {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && (
                <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl space-y-3 animate-fade-in">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <FiPercent size={12} /> Offer Details
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount % *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g. 20"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-emerald-500 outline-none pr-7"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-tertiary font-bold">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Coupon Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. SAVE20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-emerald-500 outline-none uppercase tracking-widest font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Valid Till (Optional)</label>
                    <input
                      type="date"
                      value={discountValidity}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDiscountValidity(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CONDITIONAL EXTRA FIELDS — Announcement-style purposes */}
              {(postPurpose === 'Announcement' || postPurpose === 'New Service Launch' ||
                postPurpose === 'New Arrival' || postPurpose === 'Grand Opening' ||
                postPurpose === 'Special Event' || postPurpose === 'Business Update') && (
                <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/30 rounded-xl space-y-2 animate-fade-in">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                    <FiBell size={12} /> Announcement Tagline (Optional)
                  </p>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder={`e.g. ${postPurpose === 'Grand Opening' ? 'We are now open at MG Road!' :
                      postPurpose === 'Special Event' ? 'Mega Sale this Saturday! 10AM–6PM' :
                      postPurpose === 'New Arrival' ? 'Just arrived – limited stock!' :
                      'Now offering home visits & online consultations'}`}
                    value={announcementTagline}
                    onChange={(e) => setAnnouncementTagline(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-text-tertiary text-right">{announcementTagline.length}/80</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="w-full py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1 hover:brightness-110"
            >
              Continue to Media & Caption Selection →
            </button>
          </div>
        )}

        {/* ── STEP 2: SELECT ITEM & MEDIA ── */}
        {wizardStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* 4. SELECT ITEM (OPTION A vs B) - ONLY FOR PRODUCT & SERVICE POSTS */}
            {postType !== 'shop' && (
              <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                  <FiTag /> 4. Select {postType === 'product' ? 'Product' : 'Service'}
                </h4>

                <div className="space-y-3">
                  {postType === 'services' ? (
                    <div>
                      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                        Option A – Select Existing Listed Service
                      </label>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => handleSelectExistingService(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                      >
                        <option value="">-- Choose from your listed services ({vendorServices.length}) --</option>
                        {vendorServices.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.title} (₹{s.price || s.sellingPrice || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                        Option A – Select Existing Listed Product
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => handleSelectExistingProduct(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                      >
                        <option value="">-- Choose from your listed products ({vendorProducts.length}) --</option>
                        {vendorProducts.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.title} (₹{p.price || p.sellingPrice || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {postType === 'services' && selectedServiceData && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-800">
                      <div className="flex items-center justify-between font-bold">
                        <span>Selected: {selectedServiceData.title}</span>
                        <span>Price: ₹{selectedServiceData.price || selectedServiceData.sellingPrice || 0}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 line-clamp-2">
                        {selectedServiceData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  {postType === 'product' && selectedProductData && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-800">
                      <div className="flex items-center justify-between font-bold">
                        <span>Selected: {selectedProductData.title}</span>
                        <span>Price: ₹{selectedProductData.price || selectedProductData.sellingPrice || 0}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 line-clamp-2">
                        {selectedProductData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  {postType === 'services' && (
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <span className="text-[11px] text-text-tertiary">Can't find the service?</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateServiceModal(true)}
                        className="px-3 py-1.5 bg-brand-purple/10 text-brand-purple border border-brand-purple/30 hover:bg-brand-purple hover:text-white transition rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <FiPlus size={13} /> Option B – Create New Service
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CAPTION / POST TITLE */}
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                Post Caption * (No Contact Info Allowed)
              </label>
              <textarea
                required
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Describe your ${postType === 'product' ? 'product' : postType === 'services' ? 'service' : 'business'} highlights...`}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
              />
            </div>

            {/* 5. SELECT MEDIA */}
            <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
              <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                <FiImage /> 5. Select Media
              </h4>

              {/* Only show source selection for Product/Service when an item is selected */}
              {postType !== 'shop' && (selectedServiceData || selectedProductData) ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setMediaOption('service_media')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                      mediaOption === 'service_media' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    Option A – Use Item Gallery Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaOption('upload_new')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                      mediaOption === 'upload_new' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    Option B – Upload New Media
                  </button>
                </div>
              ) : null}

              {mediaOption === 'service_media' && postType !== 'shop' && (selectedServiceData || selectedProductData) ? (
                <div>
                  {/* Pull media from active selected product/service */}
                  {(() => {
                    const activeItem = postType === 'product' ? selectedProductData : selectedServiceData;
                    const gallery = [...(activeItem?.images || []), ...(activeItem?.videos || [])];
                    if (gallery.length > 0) {
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-text-tertiary uppercase block">
                              Select up to 5 Images/Videos from Item Gallery:
                            </label>
                            <span className="text-[10px] font-extrabold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                              {selectedServiceMediaUrls.length} / 5 Selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {gallery.map((url, idx) => {
                              const isSelected = selectedServiceMediaUrls.includes(url);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleServiceMediaUrl(url)}
                                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer relative transition ${
                                    isSelected ? 'border-brand-purple ring-2 ring-brand-purple/30 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  {url.match(/\.(mp4|webm)(\?.*)?$/i) ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                                  )}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-brand-purple/40 flex items-center justify-center font-bold text-white text-xs">
                                      <FiCheckCircle size={22} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-text-tertiary italic">
                        Selected item has no media gallery items. Switch to Upload New Media option.
                      </p>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-1 bg-surface border border-border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        uploadMode === 'file' ? 'bg-brand-purple text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <FiImage size={14} /> Upload Photos / Videos (Max 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        uploadMode === 'url' ? 'bg-brand-purple text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <FiTag size={14} /> Enter Media URL
                    </button>
                  </div>

                  {uploadMode === 'file' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase block">
                          Upload Files (Select up to 5 items) *
                        </label>
                        <span className="text-[10px] font-extrabold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                          {customMediaList.length} / 5 Uploaded
                        </span>
                      </div>

                      {customMediaList.length < 5 && (
                        <div className="border-2 border-dashed border-brand-purple/40 hover:border-brand-purple rounded-2xl p-4 text-center bg-surface hover:bg-brand-purple/5 transition cursor-pointer relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center gap-1 text-text-secondary">
                            <FiImage className="w-8 h-8 text-brand-purple opacity-80 mb-1" />
                            <span className="font-bold text-xs text-text-primary">
                              Click or Drag & Drop (Select up to {5 - customMediaList.length} files)
                            </span>
                            <span className="text-[10px] text-text-tertiary">Supports JPG, PNG, WEBP, MP4, MOV (Max 50MB)</span>
                          </div>
                        </div>
                      )}

                      {customMediaList.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 pt-1">
                          {customMediaList.map((item, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-black border-2 border-brand-purple group shadow-sm">
                              {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeCustomMediaItem(idx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition"
                              >
                                <FiX size={12} />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white">
                                #{idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                        Media File URL (MP4 Video or Image URL)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/media.mp4"
                        value={customMediaUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomMediaUrl(val);
                          const isVid = val.startsWith('data:video/') || (() => {
                            try {
                              const path = val.split('?')[0].split('#')[0];
                              return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)$/i.test(path);
                            } catch {
                              return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)/i.test(val);
                            }
                          })();
                          setMediaType(isVid ? 'video' : 'image');
                        }}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                      />
                    </div>
                  )}

                  {postType !== 'shop' && (
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveToServiceGallery}
                        onChange={(e) => setSaveToServiceGallery(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-purple"
                      />
                      <span>Save new media to service/product gallery for future use</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="w-1/3 py-3 bg-surface border border-border font-bold text-xs rounded-xl"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="w-2/3 py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:brightness-110"
              >
                Continue to Promotion & Audience →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PROMOTION AREA & AUDIENCE ── */}
        {wizardStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            
            {/* 6A. PROMOTION AREA */}
            <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
              <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                <FiMapPin /> 6A. Promotion Area (Single Choice) *
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {PROMOTION_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setPromotionArea(area)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                      promotionArea === area
                        ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 6B. TARGET AUDIENCE */}
            <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
              <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                <FiUsers /> 6B. Target Audience (Multi-Select) *
              </h4>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                {PREDEFINED_AUDIENCES.map((tag) => {
                  const isSelected = selectedTargetAudiences.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleAudienceTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-surface border-border text-text-secondary hover:border-emerald-600/40'
                      }`}
                    >
                      {isSelected && <FiCheck size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM TARGET AUDIENCE */}
              <div className="pt-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                  Custom Target Audience Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lawyers, CA, gym members, foodies, college students"
                  value={customTargetAudience}
                  onChange={(e) => setCustomTargetAudience(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-1/3 py-3 bg-surface border border-border font-bold text-xs rounded-xl"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onOpenPreview}
                className="w-2/3 py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1.5 hover:brightness-110"
              >
                <FiEye size={15} /> Open Preview & Publish Summary →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CREATE NEW SERVICE MODAL */}
      <CreateServiceModal
        isOpen={showCreateServiceModal}
        onClose={() => setShowCreateServiceModal(false)}
        initialCategory={postCategory}
        initialSubcategory={postSubcategory}
        categoriesList={categoriesList}
        dynamicCategoriesData={dynamicCategoriesData}
        onCreated={handleServiceCreated}
      />
    </AdminModal>
  );
}
