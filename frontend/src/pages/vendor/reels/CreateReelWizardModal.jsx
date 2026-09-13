import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiLayers, FiTag, FiVideo, FiCheckCircle, FiCheck, FiImage, FiX, FiMapPin, FiUsers, FiEye, FiPlus,
  FiPercent, FiZap, FiBell, FiStar, FiGift, FiCalendar, FiAlertCircle, FiShield, FiUploadCloud, FiTrash2, FiLoader
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import CreateServiceModal from './CreateServiceModal';
import CreateProductModal from './CreateProductModal';
import OfferFormModal from '../listings/OfferFormModal';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { useGetVendorOffersQuery, useCreateVendorOfferMutation } from '../../../features/vendor/vendorApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { mediaApi } from '../../../lib/api';

// PURPOSE OPTIONS PER POST TYPE
const PURPOSE_OPTIONS = {
  services: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'Standard showcase & local visibility', icon: FiStar, color: 'amber' },
    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Promote a discount or coupon code', icon: FiPercent, color: 'green' },
    { key: 'Announcement', label: 'Announcement', desc: 'Service updates or important notices', icon: FiBell, color: 'blue' },
    { key: 'New Service Launch', label: 'New Launch', desc: 'Introduce a brand-new service offering', icon: FiZap, color: 'purple' },
  ],
  product: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'Showcase product highlights & features', icon: FiStar, color: 'amber' },
    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Promote a special discount or coupon', icon: FiPercent, color: 'green' },
    { key: 'New Arrival', label: 'New Arrival', desc: 'Showcase newly stocked products', icon: FiZap, color: 'purple' },
    { key: 'Flash Sale', label: 'Flash Sale', desc: 'Limited-time deal with immediate urgency', icon: FiGift, color: 'red' },
  ],
  shop: [
    { key: 'General Promotion', label: 'General Promotion', desc: 'General storefront & brand showcase', icon: FiStar, color: 'amber' },
    { key: 'Grand Opening', label: 'Grand Opening', desc: 'New store branch or re-launch event', icon: FiZap, color: 'purple' },
    { key: 'Special Event', label: 'Special Event', desc: 'Festive sale, seasonal fair or expo', icon: FiCalendar, color: 'blue' },
    { key: 'Business Update', label: 'Business Update', desc: 'Store timings, address or services news', icon: FiAlertCircle, color: 'orange' },
  ],
};

const COLOR_MAP = {
  amber:  { active: 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/25', iconBg: 'bg-amber-100 text-amber-800' },
  green:  { active: 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/25', iconBg: 'bg-emerald-100 text-emerald-800' },
  blue:   { active: 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/25', iconBg: 'bg-blue-100 text-blue-800' },
  purple: { active: 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400/25', iconBg: 'bg-purple-100 text-purple-800' },
  red:    { active: 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400/25', iconBg: 'bg-rose-100 text-rose-800' },
  orange: { active: 'bg-orange-50 border-orange-500 text-orange-900 ring-2 ring-orange-400/25', iconBg: 'bg-orange-100 text-orange-800' },
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
  thumbnailUrl,
  setThumbnailUrl,
  promotionArea,
  setPromotionArea,
  selectedTargetAudiences,
  setSelectedTargetAudiences,
  customTargetAudience,
  setCustomTargetAudience
}) {
  const [wizardStep, setWizardStep] = useState(1);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  // Fetch Vendor Dynamic Offers
  const { data: offersDataRes, refetch: refetchOffers } = useGetVendorOffersQuery();
  const [createOfferMutation] = useCreateVendorOfferMutation();

  const vendorOffers = Array.isArray(offersDataRes?.data)
    ? offersDataRes.data
    : Array.isArray(offersDataRes?.offers)
    ? offersDataRes.offers
    : Array.isArray(offersDataRes)
    ? offersDataRes
    : [];

  const activeOffers = React.useMemo(() => {
    return vendorOffers.filter(o => o.status === 'active' || !o.status);
  }, [vendorOffers]);

  const handleSelectOffer = (offerId) => {
    setSelectedOfferId(offerId);
    if (!offerId) {
      setDiscountPercent('');
      setCouponCode('');
      setDiscountValidity('');
      return;
    }
    const offer = activeOffers.find(o => (o._id || o.id) === offerId);
    if (offer) {
      if (offer.discountValue || offer.discountPercent) {
        setDiscountPercent(String(offer.discountValue || offer.discountPercent));
      }
      if (offer.couponCode) {
        setCouponCode(offer.couponCode);
      }
      if (offer.endDate) {
        try {
          const dStr = new Date(offer.endDate).toISOString().split('T')[0];
          setDiscountValidity(dStr);
        } catch {}
      }
      if (!caption) {
        const valText = offer.discountType === 'fixed' ? `₹${offer.discountValue} FLAT OFF` : `${offer.discountValue || 15}% OFF`;
        setCaption(`🔥 Special Offer: Get ${valText} with code "${offer.couponCode || 'DEAL'}"! ${offer.title || ''}`);
      }
      toast.success(`Applied offer "${offer.title}" (${offer.couponCode || 'Offer'})!`);
    }
  };

  const handleCreateDynamicOfferSubmit = async (payload) => {
    const toastId = toast.loading('Creating dynamic offer...');
    try {
      const res = await createOfferMutation(payload).unwrap();
      const newOffer = res?.data || res?.offer || res;
      toast.success('Dynamic offer created and linked to reel!', { id: toastId });
      setShowCreateOfferModal(false);
      refetchOffers();
      if (newOffer) {
        const id = newOffer._id || newOffer.id;
        if (id) setSelectedOfferId(id);
        if (newOffer.discountValue) setDiscountPercent(String(newOffer.discountValue));
        if (newOffer.couponCode) setCouponCode(newOffer.couponCode);
        if (newOffer.endDate) {
          try {
            setDiscountValidity(new Date(newOffer.endDate).toISOString().split('T')[0]);
          } catch {}
        }
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create offer', { id: toastId });
    }
  };

  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};

  const onboardedCategories = React.useMemo(() => {
    let cats = [];
    if (Array.isArray(vendorProfile.categories) && vendorProfile.categories.length > 0) {
      cats = vendorProfile.categories;
    } else if (Array.isArray(vendorProfile.selectedCategories) && vendorProfile.selectedCategories.length > 0) {
      cats = vendorProfile.selectedCategories;
    } else if (vendorProfile.category) {
      cats = [vendorProfile.category];
    } else if (vendorProfile.businessCategory) {
      cats = [vendorProfile.businessCategory];
    }
    return cats.filter(Boolean);
  }, [vendorProfile]);

  const onboardedSubcategories = React.useMemo(() => {
    let subs = [];
    if (Array.isArray(vendorProfile.subcategories) && vendorProfile.subcategories.length > 0) {
      subs = vendorProfile.subcategories;
    } else if (Array.isArray(vendorProfile.subCategories) && vendorProfile.subCategories.length > 0) {
      subs = vendorProfile.subCategories;
    } else if (Array.isArray(vendorProfile.selectedSubCategories) && vendorProfile.selectedSubCategories.length > 0) {
      subs = vendorProfile.selectedSubCategories;
    } else if (vendorProfile.subcategory) {
      subs = [vendorProfile.subcategory];
    }
    return subs.filter(Boolean);
  }, [vendorProfile]);

  // Fetch dynamic categories from admin settings
  const { data: categoriesDataRes } = useListCategoriesQuery();
  const categoriesList = categoriesDataRes?.items || [];

  const dynamicCategoriesData = React.useMemo(() => {
    const data = {};
    const parents = categoriesList.filter(c => {
      if (c.parent_id) return false;
      if (postType === 'services') {
        return c.category_type === 'service';
      }
      if (postType === 'product') {
        return c.category_type === 'product' || !c.category_type;
      }
      return true;
    });
    const children = categoriesList.filter(c => c.parent_id);

    parents.forEach(parent => {
      const parentId = parent.id || parent._id;
      const subcategories = children
        .filter(child => child.parent_id === parentId)
        .map(child => child.name);
      data[parent.name] = subcategories.length > 0 ? subcategories : ['General'];
    });

    // Fallback defaults if no matching categories
    if (Object.keys(data).length === 0) {
      if (postType === 'services') {
        data['Services'] = ['Plumber', 'Electrician', 'Carpenter', 'AC Repair', 'Cleaning', 'Painter', 'General'];
        data['Beauty & Salon'] = ['Men Salon', 'Women Salon', 'Spa', 'Makeup'];
        data['Real Estate'] = ['Rent', 'Buy', 'Sell', 'PG/Hostel'];
        data['Health & Fitness'] = ['Gym', 'Yoga', 'Doctor', 'Medical Store'];
        data['Education & Coaching'] = ['School', 'Coaching', 'Tuition', 'Skill Courses'];
      } else if (postType === 'product') {
        data['Electronics'] = ['Mobile', 'Laptop', 'TV', 'Home Appliances', 'Accessories'];
        data['Fashion'] = ['Men', 'Women', 'Kids', 'Footwear', 'Accessories'];
        data['Home & Furniture'] = ['Furniture', 'Kitchen', 'Decor', 'Bedding'];
        data['Vehicles'] = ['Car', 'Bike', 'Scooter', 'Commercial'];
        data['Food & Grocery'] = ['Restaurants', 'Grocery', 'Bakery', 'Sweets'];
      } else {
        data['General Business'] = ['General'];
      }
    }

    // Strictly show ONLY vendor's onboarded categories that match this postType
    if (onboardedCategories.length > 0) {
      const filteredData = {};
      const matchingOnboardedCats = onboardedCategories.filter(catName => {
        return Object.prototype.hasOwnProperty.call(data, catName);
      });

      if (matchingOnboardedCats.length > 0) {
        matchingOnboardedCats.forEach(catName => {
          let subs = data[catName] || ['General'];
          if (onboardedSubcategories.length > 0) {
            const matchedSubs = subs.filter(s => onboardedSubcategories.includes(s));
            if (matchedSubs.length > 0) {
              subs = matchedSubs;
            }
          }
          filteredData[catName] = subs;
        });

        return filteredData;
      }
    }

    return data;
  }, [categoriesList, postType, onboardedCategories, onboardedSubcategories]);

  // Set default category / subcategory dynamically
  useEffect(() => {
    const available = Object.keys(dynamicCategoriesData);
    if (available.length > 0) {
      if (!postCategory || !available.includes(postCategory)) {
        const firstCat = available[0];
        setPostCategory(firstCat);
        const firstSubs = dynamicCategoriesData[firstCat] || ['General'];
        setPostSubcategory(firstSubs[0] || 'General');
      }
    }
  }, [postType, dynamicCategoriesData]); // eslint-disable-line

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

  const availableCategoriesList = Object.keys(dynamicCategoriesData);

  // Filter vendor services strictly matching categories
  const vendorServices = React.useMemo(() => {
    return (vendorListings || []).filter(l => {
      if (l.type !== 'service' && l.type) return false;
      if (availableCategoriesList.length > 0) {
        if (!availableCategoriesList.includes(l.category)) return false;
        const allowedSubs = dynamicCategoriesData[l.category] || [];
        if (l.subcategory && allowedSubs.length > 0 && !allowedSubs.includes(l.subcategory) && !allowedSubs.includes('General')) {
          return false;
        }
      }
      return true;
    });
  }, [vendorListings, availableCategoriesList, dynamicCategoriesData]);

  // Filter vendor products strictly matching categories
  const vendorProducts = React.useMemo(() => {
    return (vendorListings || []).filter(l => {
      if (l.type !== 'product') return false;
      if (availableCategoriesList.length > 0) {
        if (!availableCategoriesList.includes(l.category)) return false;
        const allowedSubs = dynamicCategoriesData[l.category] || [];
        if (l.subcategory && allowedSubs.length > 0 && !allowedSubs.includes(l.subcategory) && !allowedSubs.includes('General')) {
          return false;
        }
      }
      return true;
    });
  }, [vendorListings, availableCategoriesList, dynamicCategoriesData]);

  // Contextual filter by currently selected category in wizard
  const filteredServices = React.useMemo(() => {
    if (!postCategory) return vendorServices;
    return vendorServices.filter(s => s.category === postCategory);
  }, [vendorServices, postCategory]);

  const filteredProducts = React.useMemo(() => {
    if (!postCategory) return vendorProducts;
    return vendorProducts.filter(p => p.category === postCategory);
  }, [vendorProducts, postCategory]);

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
      if (service.title && !caption) setCaption(service.title + (service.description ? ` - ${service.description}` : ''));

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
      if (product.title && !caption) setCaption(product.title + (product.description ? ` - ${product.description}` : ''));

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
      if (newService.title) setCaption(newService.title + (newService.description ? ` - ${newService.description}` : ''));
      const media = [...(newService.images || []), ...(newService.videos || [])];
      if (media.length > 0) setSelectedServiceMediaUrls([media[0]]);
      toast.success(`Selected newly created service: "${newService.title}"`);
    }
  };

  const handleProductCreated = (newProduct) => {
    if (newProduct) {
      const id = newProduct._id || newProduct.id;
      setSelectedProductId(id);
      setSelectedProductData(newProduct);
      if (newProduct.category) setPostCategory(newProduct.category);
      if (newProduct.subcategory) setPostSubcategory(newProduct.subcategory);
      if (newProduct.title) setCaption(newProduct.title + (newProduct.description ? ` - ${newProduct.description}` : ''));
      const media = [...(newProduct.images || []), ...(newProduct.videos || [])];
      if (media.length > 0) setSelectedServiceMediaUrls([media[0]]);
      toast.success(`Selected newly created product: "${newProduct.title}"`);
    }
  };

  // Handle File Uploads via Direct CDN Streaming (Approach 1)
  const handleFileUpload = async (e) => {
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

    for (const file of filesToProcess) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Skipped ${file.name}: exceeds 50MB limit.`);
        continue;
      }

      const isVideo = file.type?.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)$/i);
      const localPreviewUrl = URL.createObjectURL(file);
      const tempId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Instantly show local preview with progress bar
      setCustomMediaList((prev) => [
        ...prev,
        {
          id: tempId,
          url: localPreviewUrl,
          name: file.name,
          type: isVideo ? 'video' : 'image',
          isUploading: true,
          progress: 0,
        },
      ]);
      if (isVideo) setMediaType('video');

      const toastId = toast.loading(`Streaming ${file.name} to CDN...`);

      // Stream file directly to CDN / storage
      try {
        const uploaded = await mediaApi.uploadMediaStream(file, (progress) => {
          setCustomMediaList((prev) =>
            prev.map((item) => (item.id === tempId ? { ...item, progress } : item))
          );
        });

        // Replace local object URL with clean CDN URL
        setCustomMediaList((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  url: uploaded.url,
                  isUploading: false,
                  progress: 100,
                }
              : item
          )
        );
        toast.success(`✓ ${file.name} uploaded to CDN!`, { id: toastId });
      } catch (err) {
        console.error('Direct CDN upload failed:', err);
        toast.error(`Upload failed for ${file.name}: ${err.message || 'Error'}`, { id: toastId });
        setCustomMediaList((prev) => prev.filter((item) => item.id !== tempId));
      }
    }
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

  const progressPercent = wizardStep === 1 ? 33 : wizardStep === 2 ? 66 : 100;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 font-sans">

        {/* ── STEPPER HEADER WITH PROGRESS BAR ── */}
        <div className="space-y-3 pb-2 border-b border-[#e3dccb]">
          <div className="flex items-center justify-between text-xs">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              Step {wizardStep} of 3: {
                wizardStep === 1 ? 'Content & Purpose' :
                wizardStep === 2 ? 'Media & Caption' :
                'Promotion & Audience'
              }
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {progressPercent}% Completed
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full h-1.5 bg-[#ede5d8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Pill Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {[
              { num: 1, label: '1. Content & Item' },
              { num: 2, label: '2. Media & Caption' },
              { num: 3, label: '3. Targeting & Reach' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setWizardStep(step.num)}
                className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                  wizardStep === step.num
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm font-extrabold border border-amber-400 scale-[1.01]'
                    : wizardStep > step.num
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-[#f8f4ec] text-slate-600 border border-[#e3dccb] hover:bg-[#ede5d8]'
                }`}
              >
                {wizardStep > step.num ? <FiCheck size={13} className="text-emerald-600 flex-shrink-0" /> : null}
                <span className="truncate">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── STEP 1: CONTENT TYPE, CATEGORY & PURPOSE ── */}
        {wizardStep === 1 && (
          <div className="space-y-5 animate-fade-in">

            {/* 1. SELECT CONTENT TYPE */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3 shadow-2xs">
              <label className="text-xs font-black text-[#241b15] uppercase tracking-wider block">
                1. Select Content Type *
              </label>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPostType('product')}
                  className={`p-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'product'
                      ? 'bg-white border-2 border-amber-500 text-amber-900 shadow-sm font-black ring-2 ring-amber-400/20'
                      : 'bg-white/70 border border-[#e3dccb] text-slate-700 hover:bg-white hover:text-black hover:border-amber-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${postType === 'product' ? 'bg-amber-500 text-white' : 'bg-[#f8f4ec] text-amber-700'}`}>
                    <FiTag size={18} />
                  </div>
                  <span>Product Post</span>
                  <span className="text-[10px] font-normal text-slate-500">Items &amp; Goods</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostType('services')}
                  className={`p-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'services'
                      ? 'bg-white border-2 border-amber-500 text-amber-900 shadow-sm font-black ring-2 ring-amber-400/20'
                      : 'bg-white/70 border border-[#e3dccb] text-slate-700 hover:bg-white hover:text-black hover:border-amber-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${postType === 'services' ? 'bg-amber-500 text-white' : 'bg-[#f8f4ec] text-amber-700'}`}>
                    <FiLayers size={18} />
                  </div>
                  <span>Service Post</span>
                  <span className="text-[10px] font-normal text-slate-500">Skills &amp; Repairs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostType('shop')}
                  className={`p-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'shop'
                      ? 'bg-white border-2 border-amber-500 text-amber-900 shadow-sm font-black ring-2 ring-amber-400/20'
                      : 'bg-white/70 border border-[#e3dccb] text-slate-700 hover:bg-white hover:text-black hover:border-amber-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${postType === 'shop' ? 'bg-amber-500 text-white' : 'bg-[#f8f4ec] text-amber-700'}`}>
                    <FiVideo size={18} />
                  </div>
                  <span>Shop / Business</span>
                  <span className="text-[10px] font-normal text-slate-500">Store &amp; Brand</span>
                </button>
              </div>
            </div>

            {/* 2. SELECT CATEGORY & SUBCATEGORY */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3.5 shadow-2xs">
              <h4 className="font-black text-xs uppercase text-[#241b15] tracking-wider flex items-center gap-2">
                <FiLayers className="text-amber-600" /> 2. Select {postType === 'product' ? 'Product' : postType === 'services' ? 'Service' : 'Shop'} Category
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={postCategory}
                    onChange={handleCategoryChange}
                    className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition cursor-pointer shadow-2xs"
                  >
                    {Object.keys(dynamicCategoriesData).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1.5">
                    Sub Category *
                  </label>
                  <select
                    value={postSubcategory}
                    onChange={(e) => setPostSubcategory(e.target.value)}
                    className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition cursor-pointer shadow-2xs"
                  >
                    {(dynamicCategoriesData[postCategory] || ['General']).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SELECT POST PURPOSE */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3 shadow-2xs">
              <label className="text-xs font-black text-[#241b15] uppercase tracking-wider block">
                3. Select Post Purpose *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        setDiscountPercent('');
                        setCouponCode('');
                        setDiscountValidity('');
                        setAnnouncementTagline('');
                      }}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? colors.active
                          : 'bg-white border-[#e3dccb] text-slate-700 hover:border-amber-400 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-amber-500 text-white font-bold' : colors.iconBg
                          }`}>
                            <Icon size={15} />
                          </div>
                          <span className="font-extrabold text-xs text-[#1a1a1a]">{p.label}</span>
                        </div>
                        {isActive && <FiCheckCircle size={16} className="text-amber-600 flex-shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-600 block pl-0.5 leading-snug">{p.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Offers selector when Offer / Discount or Flash Sale */}
              {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && (
                <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <FiPercent size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                          Link Active Offer / Discount
                        </p>
                        <p className="text-[10px] text-emerald-700">
                          Select from your listings offers or create a new coupon
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreateOfferModal(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 self-start sm:self-auto shadow-2xs"
                    >
                      <FiPlus size={13} />
                      <span>+ Create New Offer</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeOffers.length > 0 ? (
                      <div>
                        <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                          Choose Active Offer ({activeOffers.length} available)
                        </label>
                        <select
                          value={selectedOfferId}
                          onChange={(e) => handleSelectOffer(e.target.value)}
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-[#1a1a1a] focus:border-emerald-500 outline-none transition cursor-pointer"
                        >
                          <option value="">-- Choose an active offer --</option>
                          {activeOffers.map(offer => (
                            <option key={offer._id || offer.id} value={offer._id || offer.id}>
                              {offer.title} • {offer.discountType === 'fixed' ? `Flat ₹${offer.discountValue}` : `${offer.discountValue || 15}% OFF`} {offer.couponCode ? `(Code: ${offer.couponCode})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-800 font-medium">
                        No active offers in your catalog. Click <strong>"+ Create New Offer"</strong> to add one.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Announcement Tagline for special events */}
              {(postPurpose === 'Announcement' || postPurpose === 'New Service Launch' ||
                postPurpose === 'New Arrival' || postPurpose === 'Grand Opening' ||
                postPurpose === 'Special Event' || postPurpose === 'Business Update') && (
                <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 animate-fade-in">
                  <p className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FiBell size={13} className="text-amber-700" /> Announcement Tagline (Optional)
                  </p>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Mega Clearance Sale this weekend! Now open at Main Market."
                    value={announcementTagline}
                    onChange={(e) => setAnnouncementTagline(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs text-[#1a1a1a] focus:border-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 text-right">{announcementTagline.length}/80</p>
                </div>
              )}
            </div>

            {/* 4. LINKED ITEM SELECTOR (PRODUCT OR SERVICE) */}
            {postType !== 'shop' && (
              <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3.5 shadow-2xs">
                <h4 className="font-black text-xs uppercase text-[#241b15] tracking-wider flex items-center gap-2">
                  <FiTag className="text-amber-600" /> 4. Select {postType === 'product' ? 'Product to Showcase' : 'Service to Showcase'}
                </h4>

                {postType === 'product' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 uppercase block">
                        Choose Existing Listed Product
                      </label>
                      {filteredProducts.length > 0 && (
                        <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          {filteredProducts.length} product(s) available
                        </span>
                      )}
                    </div>

                    {filteredProducts.length > 0 ? (
                      <select
                        value={selectedProductId}
                        onChange={(e) => handleSelectExistingProduct(e.target.value)}
                        className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:border-amber-500 outline-none cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Choose from your listed products ({filteredProducts.length}) --</option>
                        {filteredProducts.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.title} (₹{p.price || p.sellingPrice || 0}) • {p.category}{p.subcategory ? ` - ${p.subcategory}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <span>⚠️ No listed products found for "{postCategory || 'Category'}".</span>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Create a new product listing below to tag it in this reel.
                        </p>
                      </div>
                    )}

                    {/* Rich Product Preview Card when a product is selected */}
                    {selectedProductData && (
                      <div className="p-3.5 bg-white border-2 border-emerald-500/40 rounded-xl shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {selectedProductData.images?.[0] ? (
                              <img src={selectedProductData.images[0]} alt={selectedProductData.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiTag size={20} className="text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Selected Product
                            </span>
                            <h5 className="font-black text-xs text-[#1a1a1a] truncate mt-1">
                              {selectedProductData.title}
                            </h5>
                            <p className="text-xs font-bold text-emerald-700">
                              ₹{selectedProductData.price || selectedProductData.sellingPrice || 0}
                              {selectedProductData.category && (
                                <span className="text-[10px] font-normal text-slate-500 ml-2">
                                  • {selectedProductData.category}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectExistingProduct('')}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#e3dccb]">
                      <span className="text-xs text-slate-600">Can't find the product?</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateProductModal(true)}
                        className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <FiPlus size={13} /> + Create New Product
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-700 uppercase block">
                        Choose Existing Listed Service
                      </label>
                      {filteredServices.length > 0 && (
                        <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          {filteredServices.length} service(s) available
                        </span>
                      )}
                    </div>

                    {filteredServices.length > 0 ? (
                      <select
                        value={selectedServiceId}
                        onChange={(e) => handleSelectExistingService(e.target.value)}
                        className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:border-amber-500 outline-none cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Choose from your listed services ({filteredServices.length}) --</option>
                        {filteredServices.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>
                            {s.title} (₹{s.price || s.sellingPrice || 0}) • {s.category}{s.subcategory ? ` - ${s.subcategory}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <span>⚠️ No listed services found for "{postCategory || 'Category'}".</span>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Create a new service listing below to tag it in this reel.
                        </p>
                      </div>
                    )}

                    {/* Rich Service Preview Card when a service is selected */}
                    {selectedServiceData && (
                      <div className="p-3.5 bg-white border-2 border-emerald-500/40 rounded-xl shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-[#f8f4ec] border border-[#e3dccb] overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {selectedServiceData.images?.[0] ? (
                              <img src={selectedServiceData.images[0]} alt={selectedServiceData.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiLayers size={20} className="text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Selected Service
                            </span>
                            <h5 className="font-black text-xs text-[#1a1a1a] truncate mt-1">
                              {selectedServiceData.title}
                            </h5>
                            <p className="text-xs font-bold text-emerald-700">
                              ₹{selectedServiceData.price || selectedServiceData.sellingPrice || 0}
                              {selectedServiceData.category && (
                                <span className="text-[10px] font-normal text-slate-500 ml-2">
                                  • {selectedServiceData.category}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectExistingService('')}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#e3dccb]">
                      <span className="text-xs text-slate-600">Can't find the service?</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateServiceModal(true)}
                        className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <FiPlus size={13} /> + Create New Service
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTINUE TO STEP 2 BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
              >
                <span>Continue to Media &amp; Caption Selection →</span>
              </button>
            </div>

          </div>
        )}

        {/* ── STEP 2: SELECT MEDIA & CAPTION ── */}
        {wizardStep === 2 && (
          <div className="space-y-5 animate-fade-in">

            {/* CAPTION INPUT */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#241b15] uppercase tracking-wider block">
                  Post Caption &amp; Description *
                </label>
                <span className="text-[10px] font-bold text-slate-500">
                  {caption.length}/2200
                </span>
              </div>

              <textarea
                required
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Describe your ${postType === 'product' ? 'product features, quality, pricing, warranty' : postType === 'services' ? 'service highlights, guarantees, expertise' : 'store offerings & highlights'}...`}
                className="w-full p-3.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition shadow-2xs"
              />

              {/* Hashtags Quick Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Suggest:</span>
                {['#NewArrival', '#BestDeal', '#LocalStore', '#SpecialOffer', '#QualityGuaranteed'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!caption.includes(tag)) {
                        setCaption(prev => prev ? `${prev} ${tag}` : tag);
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-50 border border-[#e3dccb] hover:border-amber-400 text-[10px] font-bold text-slate-700 hover:text-amber-900 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Safety notice banner */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900">
                <FiShield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Notice:</strong> Do not include phone numbers, WhatsApp, emails, QR codes, or external links in caption. Customers connect with you via verified platform buttons.
                </span>
              </div>
            </div>

            {/* 5. SELECT MEDIA */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-[#241b15] tracking-wider flex items-center gap-2">
                  <FiImage className="text-amber-600" /> 5. Select Media (Up to 5 Videos/Images)
                </h4>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  Vertical 9:16 Recommended
                </span>
              </div>

              {/* Source selection tab buttons if service/product selected */}
              {postType !== 'shop' && (selectedServiceData || selectedProductData) ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaOption('upload_new')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      mediaOption === 'upload_new'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-2xs font-black'
                        : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#ede5d8]'
                    }`}
                  >
                    ☁️ Option A – Upload New Video/Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaOption('service_media')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      mediaOption === 'service_media'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-2xs font-black'
                        : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#ede5d8]'
                    }`}
                  >
                    🖼️ Option B – Select from Item Gallery
                  </button>
                </div>
              ) : null}

              {mediaOption === 'service_media' && postType !== 'shop' && (selectedServiceData || selectedProductData) ? (
                <div className="bg-white p-4 rounded-xl border border-[#e3dccb] space-y-3">
                  {(() => {
                    const activeItem = postType === 'product' ? selectedProductData : selectedServiceData;
                    const gallery = [...(activeItem?.images || []), ...(activeItem?.videos || [])];
                    if (gallery.length > 0) {
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-slate-700 uppercase block">
                              Select from Item Gallery:
                            </label>
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                              {selectedServiceMediaUrls.length} / 5 Selected
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {gallery.map((url, idx) => {
                              const isSelected = selectedServiceMediaUrls.includes(url);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleServiceMediaUrl(url)}
                                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer relative transition ${
                                    isSelected
                                      ? 'border-amber-500 ring-2 ring-amber-400/40 scale-95 shadow-sm'
                                      : 'border-[#e3dccb] opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  {url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                                  )}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center font-bold text-white">
                                      <FiCheckCircle size={22} className="drop-shadow-md text-white" />
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
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-600 font-bold">
                          Selected item does not have any gallery media items yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMediaOption('upload_new')}
                          className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm cursor-pointer transition"
                        >
                          ☁️ Upload Video / Photo File Now
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option 1: File Upload */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FiUploadCloud className="text-amber-600" size={14} /> Option 1: Upload Video or Photo Files (Max 5)
                      </label>
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {customMediaList.length} / 5 Attached
                      </span>
                    </div>

                    {/* UPLOAD NEW MEDIA DRAG/CLICK AREA */}
                    <div className="border-2 border-dashed border-[#e3dccb] hover:border-amber-500 rounded-2xl p-6 bg-white text-center cursor-pointer relative transition-all group shadow-2xs">
                      <input
                        type="file"
                        accept="video/*,image/*"
                        multiple
                        onChange={(e) => {
                          setUploadMode('file');
                          handleFileUpload(e);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-600 group-hover:text-amber-800 transition">
                        <div className="w-12 h-12 rounded-full bg-[#f8f4ec] group-hover:bg-amber-100 text-amber-700 flex items-center justify-center transition">
                          <FiUploadCloud size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-[#1a1a1a]">
                            Click or drag video &amp; photo files here
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Supports MP4, MOV, WebP, JPG (Max 50MB per file, up to 5 items)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CUSTOM MEDIA ITEMS LIST */}
                    {customMediaList.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">
                          Attached Media Files ({customMediaList.length} / 5):
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {customMediaList.map((item, idx) => (
                            <div
                              key={idx}
                              className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#e3dccb] bg-black shadow-2xs group"
                            >
                              {item.type === 'video' || item.url?.match(/\.(mp4|mov|webm)$/i) ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                              )}
                              
                              {/* Uploading Progress Overlay */}
                              {item.isUploading && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-1 z-10">
                                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-1"></div>
                                  <span className="text-[10px] font-black text-amber-300">{item.progress || 0}%</span>
                                  <span className="text-[8px] text-white/90 font-bold tracking-tight">Streaming CDN</span>
                                </div>
                              )}

                              <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCustomMediaItem(idx)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-sm z-20"
                                title="Remove media"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER: OR */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#e3dccb]"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-black text-slate-600 uppercase bg-[#ede5d8] px-3 py-1 rounded-full border border-[#d8cfbe] shadow-2xs">
                      — OR ENTER DIRECT MEDIA URL —
                    </span>
                    <div className="flex-grow border-t border-[#e3dccb]"></div>
                  </div>

                  {/* Option 2: Direct Media URL */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3 shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FiTag className="text-amber-600" size={14} /> Option 2: Direct Media URL (Video or Photo Link)
                        </label>
                        <span className="text-[10px] text-amber-900 font-extrabold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          CDN / Cloudinary / External Link
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="https://example.com/reel-video.mp4 or https://example.com/product-photo.jpg"
                          value={customMediaUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomMediaUrl(val);
                            if (val.trim()) {
                              setUploadMode('url');
                            }
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
                          className="w-full p-3 pr-10 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-2xs transition"
                        />
                        {customMediaUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomMediaUrl('');
                              if (customMediaList.length > 0) {
                                setUploadMode('file');
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                            title="Clear URL"
                          >
                            <FiX size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Preview for URL */}
                    {customMediaUrl && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">
                          URL Live Preview:
                        </label>
                        <div className="aspect-[9/16] max-h-48 bg-black rounded-xl overflow-hidden border-2 border-[#e3dccb] shadow-sm flex items-center justify-center relative">
                          {customMediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || customMediaUrl.startsWith('data:video/') ? (
                            <video src={customMediaUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={customMediaUrl} alt="URL Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          )}
                          <span className="absolute top-2 left-2 bg-black/75 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {mediaType === 'video' ? '🎬 Video Reel' : '📷 Image Post'}
                          </span>
                        </div>
                      </div>
                    )}

                    {postType !== 'shop' && (
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={saveToServiceGallery}
                          onChange={(e) => setSaveToServiceGallery(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer"
                        />
                        <span>Save this media to listing gallery automatically</span>
                      </label>
                    )}
                  </div>

                  {/* THUMBNAIL COVER OPTION */}
                  <div className="pt-2 border-t border-[#e3dccb]">
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1.5">
                      Custom Reel Cover Thumbnail (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="border border-dashed border-[#e3dccb] hover:border-amber-500 rounded-xl p-3 bg-white flex-1 text-center cursor-pointer relative transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 15 * 1024 * 1024) {
                                return toast.error('Thumbnail cover image must be under 15MB');
                              }
                              const localPreview = URL.createObjectURL(file);
                              if (typeof setThumbnailUrl === 'function') {
                                setThumbnailUrl(localPreview);
                              }
                              const toastId = toast.loading('Streaming thumbnail cover to CDN...');
                              try {
                                const uploaded = await mediaApi.uploadMediaStream(file, undefined, 'uploads/thumbnails');
                                if (typeof setThumbnailUrl === 'function') {
                                  setThumbnailUrl(uploaded.url);
                                }
                                toast.success('Cover thumbnail uploaded to CDN!', { id: toastId });
                              } catch (err) {
                                console.error('Thumbnail upload failed:', err);
                                toast.error('Failed to upload thumbnail: ' + (err.message || 'Error'), { id: toastId });
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="text-xs text-slate-600 font-bold flex items-center justify-center gap-2">
                          <FiImage size={16} className="text-amber-600" />
                          <span>{thumbnailUrl ? 'Change Thumbnail Cover' : 'Upload Custom Cover Image'}</span>
                        </div>
                      </div>
                      {thumbnailUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-500 relative shrink-0 shadow-sm">
                          <img src={thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => typeof setThumbnailUrl === 'function' && setThumbnailUrl('')}
                            className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl cursor-pointer"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION ROW: BACK & CONTINUE */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="w-1/3 py-3.5 bg-white border border-[#e3dccb] text-slate-700 font-bold text-xs rounded-full hover:bg-[#ede5d8] transition cursor-pointer shadow-2xs"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
              >
                Continue to Promotion &amp; Audience →
              </button>
            </div>

          </div>
        )}

        {/* ── STEP 3: PROMOTION AREA & AUDIENCE ── */}
        {wizardStep === 3 && (
          <div className="space-y-5 animate-fade-in">

            {/* 6A. PROMOTION AREA */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-[#241b15] tracking-wider flex items-center gap-2">
                  <FiMapPin className="text-amber-600" /> 6A. Promotion Area (Single Choice) *
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Selected: <strong className="text-amber-900">{promotionArea}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {PROMOTION_AREAS.map((area) => {
                  const isSelected = promotionArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setPromotionArea(area)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-sm scale-[1.02] font-black'
                          : 'bg-white border-[#e3dccb] text-slate-700 hover:border-amber-400 hover:text-black shadow-2xs'
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6B. TARGET AUDIENCE */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase text-[#241b15] tracking-wider flex items-center gap-2">
                  <FiUsers className="text-amber-600" /> 6B. Target Audience (Multi-Select) *
                </h4>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  {selectedTargetAudiences.length} Selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {PREDEFINED_AUDIENCES.map((tag) => {
                  const isSelected = selectedTargetAudiences.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleAudienceTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-extrabold'
                          : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#ede5d8] shadow-2xs'
                      }`}
                    >
                      {isSelected && <FiCheck size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM TARGET AUDIENCE */}
              <div className="pt-2 border-t border-[#e3dccb]">
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1.5">
                  Custom Target Audience Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lawyers, CA, gym members, foodies, tech professionals"
                  value={customTargetAudience}
                  onChange={(e) => setCustomTargetAudience(e.target.value)}
                  className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:border-amber-500 outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* ACTION ROW: BACK & OPEN PREVIEW */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-1/3 py-3.5 bg-white border border-[#e3dccb] text-slate-700 font-bold text-xs rounded-full hover:bg-[#ede5d8] transition cursor-pointer shadow-2xs"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onOpenPreview}
                className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
              >
                <FiEye size={15} /> Open Preview &amp; Publish Summary →
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

      {/* CREATE NEW PRODUCT MODAL */}
      <CreateProductModal
        isOpen={showCreateProductModal}
        onClose={() => setShowCreateProductModal(false)}
        initialCategory={postCategory}
        initialSubcategory={postSubcategory}
        categoriesList={categoriesList}
        dynamicCategoriesData={dynamicCategoriesData}
        onCreated={handleProductCreated}
      />

      {/* CREATE DYNAMIC OFFER MODAL */}
      <OfferFormModal
        isOpen={showCreateOfferModal}
        onClose={() => setShowCreateOfferModal(false)}
        onSubmit={handleCreateDynamicOfferSubmit}
        allListings={vendorListings}
      />
    </AdminModal>
  );
}
