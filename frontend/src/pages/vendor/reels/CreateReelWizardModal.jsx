import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiLayers, FiTag, FiVideo, FiCheckCircle, FiCheck, FiImage, FiX, FiMapPin, FiUsers, FiEye, FiPlus,
  FiPercent, FiZap, FiBell, FiStar, FiGift, FiCalendar, FiAlertCircle, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';
import CreateServiceModal from './CreateServiceModal';
import CreateProductModal from './CreateProductModal';
import OfferFormModal from '../listings/OfferFormModal';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { useGetVendorOffersQuery, useCreateVendorOfferMutation } from '../../../features/vendor/vendorApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';

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
  amber:  { active: 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-amber-500/20',  dot: 'bg-amber-500'  },
  green:  { active: 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-emerald-500/20', dot: 'bg-emerald-500' },
  blue:   { active: 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-blue-500/20',     dot: 'bg-blue-500'   },
  purple: { active: 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-amber-500/20', dot: 'bg-amber-500' },
  red:    { active: 'bg-red-950/60 border-red-500 text-red-200 shadow-red-500/20',        dot: 'bg-red-500'    },
  orange: { active: 'bg-orange-950/60 border-orange-500 text-orange-200 shadow-orange-500/20', dot: 'bg-orange-500' },
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
        // STRICTLY service categories only
        return c.category_type === 'service';
      }
      if (postType === 'product') {
        // STRICTLY product categories only
        return c.category_type === 'product' || !c.category_type;
      }
      // 'shop' posts
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

    // Fallback if no matching categories in database
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
              subs = matchedSubs; // STRICTLY ONLY onboarded subcategories
            }
          }
          filteredData[catName] = subs;
        });

        return filteredData;
      }
    }

    return data;
  }, [categoriesList, postType, onboardedCategories, onboardedSubcategories]);

  // Set default category / subcategory dynamically when postType or dynamicCategoriesData changes
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

  // Filter vendor services strictly matching onboarded categories & subcategories
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

  // Filter vendor products strictly matching onboarded categories & subcategories
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

  // Further contextual filter by currently selected category in wizard (if selected)
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

  const handleProductCreated = (newProduct) => {
    if (newProduct) {
      const id = newProduct._id || newProduct.id;
      setSelectedProductId(id);
      setSelectedProductData(newProduct);
      if (newProduct.category) setPostCategory(newProduct.category);
      if (newProduct.subcategory) setPostSubcategory(newProduct.subcategory);
      if (newProduct.title) setCaption(newProduct.title + ' - ' + (newProduct.description || ''));
      const media = [...(newProduct.images || []), ...(newProduct.videos || [])];
      if (media.length > 0) setSelectedServiceMediaUrls([media[0]]);
      toast.success(`Selected newly created product: "${newProduct.title}"`);
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
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-4 text-xs">
          <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs flex items-center gap-1.5 font-display">
            Step {wizardStep} of 3: {
              wizardStep === 1 ? 'Content & Category' :
              wizardStep === 2 ? 'Media & Caption' :
              'Promotion & Audience'
            }
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                  wizardStep === s ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 border border-amber-400 scale-105 font-extrabold' :
                  wizardStep > s ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400 border border-white/10 font-bold'
                }`}
              >
                {wizardStep > s ? <FiCheck size={13} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1: CONTENT TYPE, CATEGORY & PURPOSE ── */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 1. SELECT CONTENT TYPE */}
            <div>
              <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest block mb-2">
                1. Select Content Type *
              </label>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPostType('services')}
                  className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'services'
                      ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white border border-amber-400 shadow-md shadow-amber-500/25 scale-[1.02] font-black'
                      : 'bg-[#31333e] border border-white/12 text-slate-200 hover:bg-[#3b3e4c] hover:text-white hover:border-amber-500/40 font-bold'
                  }`}
                >
                  <FiLayers size={19} />
                  <span>Service Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('product')}
                  className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'product'
                      ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white border border-amber-400 shadow-md shadow-amber-500/25 scale-[1.02] font-black'
                      : 'bg-[#31333e] border border-white/12 text-slate-200 hover:bg-[#3b3e4c] hover:text-white hover:border-amber-500/40 font-bold'
                  }`}
                >
                  <FiTag size={19} />
                  <span>Product Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('shop')}
                  className={`py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    postType === 'shop'
                      ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white border border-amber-400 shadow-md shadow-amber-500/25 scale-[1.02] font-black'
                      : 'bg-[#31333e] border border-white/12 text-slate-200 hover:bg-[#3b3e4c] hover:text-white hover:border-amber-500/40 font-bold'
                  }`}
                >
                  <FiVideo size={19} />
                  <span>Shop / Business</span>
                </button>
              </div>
            </div>

            {/* 2. SELECT CATEGORY */}
            <div className="p-4 sm:p-5 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <FiLayers /> 2. Select {postType === 'product' ? 'Product' : postType === 'services' ? 'Service' : 'Shop'} Category
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={postCategory}
                    onChange={handleCategoryChange}
                    className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs font-semibold text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                  >
                    {Object.keys(dynamicCategoriesData).map(cat => (
                      <option key={cat} value={cat} className="bg-[#1c1d22] text-slate-100">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase block mb-1.5">
                    Sub Category *
                  </label>
                  <select
                    value={postSubcategory}
                    onChange={(e) => setPostSubcategory(e.target.value)}
                    className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs font-semibold text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
                  >
                    {(dynamicCategoriesData[postCategory] || ['General']).map(sub => (
                      <option key={sub} value={sub} className="bg-[#1c1d22] text-slate-100">{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. SELECT PURPOSE */}
            <div>
              <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest block mb-2.5">
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
                        // Reset extra fields when purpose changes
                        setDiscountPercent('');
                        setCouponCode('');
                        setDiscountValidity('');
                        setAnnouncementTagline('');
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-950/70 to-amber-900/50 border-2 border-amber-500 text-amber-100 shadow-md shadow-amber-500/25 scale-[1.01]'
                          : 'bg-[#2b2d36] border border-white/12 text-slate-200 hover:bg-[#353844] hover:border-amber-500/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-amber-500 text-white shadow-sm font-bold' : 'bg-white/10 text-amber-300'
                          }`}>
                            <Icon size={15} />
                          </div>
                          <span className="font-bold text-xs text-white">{p.label}</span>
                        </div>
                        {isActive && <FiCheckCircle size={16} className="text-amber-400 flex-shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-300 block leading-tight pl-0.5">{p.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* CONDITIONAL EXTRA FIELDS — Offer / Discount & Flash Sale (Select from Listings Dynamic Offers) */}
              {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && (
                <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-slate-900/60 border border-emerald-500/35 rounded-2xl space-y-3.5 animate-fade-in font-sans">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                        <FiPercent size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                          Select Offer / Discount from Listings
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Link an active offer created in your Listings &amp; Offers portal
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCreateOfferModal(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20 self-start sm:self-auto"
                    >
                      <FiPlus size={13} />
                      <span>+ Create New Dynamic Offer</span>
                    </button>
                  </div>

                  {/* SELECT EXISTING ACTIVE OFFER */}
                  <div className="space-y-3">
                    {activeOffers.length > 0 ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-emerald-300 uppercase block">
                          Choose Active Offer from Your Listings Catalog *
                        </label>
                        <select
                          value={selectedOfferId}
                          onChange={(e) => handleSelectOffer(e.target.value)}
                          className="w-full p-3 bg-[#16181e] border border-emerald-500/35 rounded-xl text-xs font-bold text-white focus:border-emerald-400 outline-none transition cursor-pointer"
                        >
                          <option value="" className="bg-[#16181e] text-slate-300">-- Select an active offer ({activeOffers.length} available) --</option>
                          {activeOffers.map(offer => (
                            <option key={offer._id || offer.id} value={offer._id || offer.id} className="bg-[#16181e] text-white">
                              {offer.title} • {offer.discountType === 'fixed' ? `Flat ₹${offer.discountValue}` : `${offer.discountValue || 15}% OFF`} {offer.couponCode ? `(Code: ${offer.couponCode})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-200 space-y-2">
                        <p className="font-bold flex items-center gap-1.5">
                          <FiAlertCircle size={14} className="text-emerald-400" />
                          No active offers found in your listings.
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Click <strong>"+ Create New Dynamic Offer"</strong> above to create a discount/offer for your listings and link it directly to this post.
                        </p>
                      </div>
                    )}

                    {/* Active Offer Details Preview (if selected) */}
                    {selectedOfferId && (
                      <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                          <span>Applied: {discountPercent ? `${discountPercent}% Discount` : 'Offer Active'}</span>
                          {couponCode && (
                            <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-white border border-emerald-500/30">
                              CODE: {couponCode}
                            </span>
                          )}
                        </div>
                        {discountValidity && (
                          <p className="text-[11px] text-slate-300">
                            Valid Till: <strong className="text-emerald-300">{new Date(discountValidity).toLocaleDateString()}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* CONDITIONAL EXTRA FIELDS — Announcement-style purposes */}
              {(postPurpose === 'Announcement' || postPurpose === 'New Service Launch' ||
                postPurpose === 'New Arrival' || postPurpose === 'Grand Opening' ||
                postPurpose === 'Special Event' || postPurpose === 'Business Update') && (
                <div className="mt-3.5 p-4 bg-amber-500/15 border border-amber-500/35 rounded-2xl space-y-2 animate-fade-in">
                  <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <FiBell size={13} /> Announcement Tagline (Optional)
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
                    className="w-full p-3 bg-[#1c1d22] border border-amber-500/35 rounded-xl text-xs text-white focus:border-amber-400 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 text-right">{announcementTagline.length}/80</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
            >
              Continue to Media & Caption Selection →
            </button>
          </div>
        )}

        {/* ── STEP 2: SELECT ITEM & MEDIA ── */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 4. SELECT ITEM (OPTION A vs B) - ONLY FOR PRODUCT & SERVICE POSTS */}
            {postType !== 'shop' && (
              <div className="p-4 sm:p-5 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3.5">
                <h4 className="font-extrabold text-xs uppercase text-amber-300 tracking-wider flex items-center gap-2">
                  <FiTag /> 4. Select {postType === 'product' ? 'Product' : 'Service'}
                </h4>

                <div className="space-y-3.5">
                  {postType === 'services' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-300 uppercase block">
                          Option A – Select Existing Listed Service
                        </label>
                        {filteredServices.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-extrabold">
                            {filteredServices.length} service(s) available
                          </span>
                        )}
                      </div>

                      {filteredServices.length > 0 ? (
                        <select
                          value={selectedServiceId}
                          onChange={(e) => handleSelectExistingService(e.target.value)}
                          className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs font-semibold text-slate-100 focus:border-amber-500 outline-none"
                        >
                          <option value="" className="bg-[#1c1d22] text-slate-100">-- Choose from your listed services ({filteredServices.length}) --</option>
                          {filteredServices.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id} className="bg-[#1c1d22] text-slate-100">
                              {s.title} (₹{s.price || s.sellingPrice || 0}) • {s.category}{s.subcategory ? ` - ${s.subcategory}` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <span>⚠️ Not Found:</span>
                            <span>No listed services found for onboarded category "{postCategory || 'Services'}".</span>
                          </p>
                          <p className="text-[11px] text-red-200/80">
                            Please select Option B below to create a service for this category first.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-300 uppercase block">
                          Option A – Select Existing Listed Product
                        </label>
                        {filteredProducts.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-extrabold">
                            {filteredProducts.length} product(s) available
                          </span>
                        )}
                      </div>

                      {filteredProducts.length > 0 ? (
                        <select
                          value={selectedProductId}
                          onChange={(e) => handleSelectExistingProduct(e.target.value)}
                          className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs font-semibold text-slate-100 focus:border-amber-500 outline-none"
                        >
                          <option value="" className="bg-[#1c1d22] text-slate-100">-- Choose from your listed products ({filteredProducts.length}) --</option>
                          {filteredProducts.map(p => (
                            <option key={p._id || p.id} value={p._id || p.id} className="bg-[#1c1d22] text-slate-100">
                              {p.title} (₹{p.price || p.sellingPrice || 0}) • {p.category}{p.subcategory ? ` - ${p.subcategory}` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <span>⚠️ Not Found:</span>
                            <span>No listed products found for onboarded category "{postCategory || 'Products'}".</span>
                          </p>
                          <p className="text-[11px] text-red-200/80">
                            Please select Option B below to create a product for this category first.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {postType === 'services' && selectedServiceData && (
                    <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-200">
                      <div className="flex items-center justify-between font-bold">
                        <span>Selected: {selectedServiceData.title}</span>
                        <span>Price: ₹{selectedServiceData.price || selectedServiceData.sellingPrice || 0}</span>
                      </div>
                      <p className="text-[11px] text-emerald-300 line-clamp-2">
                        {selectedServiceData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  {postType === 'product' && selectedProductData && (
                    <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-200">
                      <div className="flex items-center justify-between font-bold">
                        <span>Selected: {selectedProductData.title}</span>
                        <span>Price: ₹{selectedProductData.price || selectedProductData.sellingPrice || 0}</span>
                      </div>
                      <p className="text-[11px] text-emerald-300 line-clamp-2">
                        {selectedProductData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  {postType === 'services' && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[11px] text-slate-300">Can't find the service?</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateServiceModal(true)}
                        className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-white transition rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FiPlus size={13} /> Option B – Create New Service
                      </button>
                    </div>
                  )}

                  {postType === 'product' && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[11px] text-slate-300">Can't find the product?</span>
                      <button
                        type="button"
                        onClick={() => setShowCreateProductModal(true)}
                        className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-white transition rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FiPlus size={13} /> Option B – Create New Product
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CAPTION / POST TITLE */}
            <div>
              <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest block mb-1.5">
                Post Caption * (No Contact Info Allowed)
              </label>
              <textarea
                required
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Describe your ${postType === 'product' ? 'product' : postType === 'services' ? 'service' : 'business'} highlights...`}
                className="w-full p-3.5 bg-[#1c1d22] border border-white/15 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>

            {/* 5. SELECT MEDIA */}
            <div className="p-4 sm:p-5 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <FiImage /> 5. Select Media
              </h4>

              {/* Only show source selection for Product/Service when an item is selected */}
              {postType !== 'shop' && (selectedServiceData || selectedProductData) ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setMediaOption('service_media')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      mediaOption === 'service_media' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-xs' : 'bg-[#1c1d22] border-white/15 text-slate-200'
                    }`}
                  >
                    Option A – Use Item Gallery Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaOption('upload_new')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      mediaOption === 'upload_new' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-xs' : 'bg-[#1c1d22] border-white/15 text-slate-200'
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
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-slate-300 uppercase block">
                              Select up to 5 Images/Videos from Item Gallery:
                            </label>
                            <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
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
                                    isSelected ? 'border-amber-500 ring-2 ring-amber-500/40 scale-95' : 'border-white/15 opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  {url.match(/\.(mp4|webm)(\?.*)?$/i) ? (
                                    <video src={url} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                                  )}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-amber-500/40 flex items-center justify-center font-bold text-white text-xs">
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
                      <div className="p-4 bg-[#1c1d22] border border-amber-500/35 rounded-xl text-center space-y-3">
                        <p className="text-xs text-slate-300 font-bold">
                          Selected item does not have any gallery media items yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => setMediaOption('upload_new')}
                          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-extrabold shadow-md cursor-pointer hover:scale-105 transition"
                        >
                          ☁️ Upload Video / Photo File Now
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 p-1 bg-[#1c1d22] border border-white/15 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        uploadMode === 'file' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-extrabold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <FiImage size={14} /> Upload Photos / Videos (Max 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        uploadMode === 'url' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-extrabold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <FiTag size={14} /> Enter Media URL
                    </button>
                  </div>

                  {uploadMode === 'file' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-300 uppercase block">
                          Upload Files (Select up to 5 items) *
                        </label>
                        <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                          {customMediaList.length} / 5 Uploaded
                        </span>
                      </div>

                      {customMediaList.length < 5 && (
                        <div className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 text-center bg-white/5 hover:bg-white/10 transition cursor-pointer relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="flex flex-col items-center gap-1 text-slate-300">
                            <FiImage className="w-8 h-8 text-amber-400 opacity-80 mb-1" />
                            <span className="font-bold text-xs text-white">
                              Click or Drag & Drop (Select up to {5 - customMediaList.length} files)
                            </span>
                            <span className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP, MP4, MOV (Max 50MB)</span>
                          </div>
                        </div>
                      )}

                      {customMediaList.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 pt-1">
                          {customMediaList.map((item, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border-2 border-amber-500 group shadow-md">
                              {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={item.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeCustomMediaItem(idx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition cursor-pointer"
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
                      <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">
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
                        className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs text-slate-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}

                  {postType !== 'shop' && (
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveToServiceGallery}
                        onChange={(e) => setSaveToServiceGallery(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500"
                      />
                      <span>Save new media to service/product gallery for future use</span>
                    </label>
                  )}
                </div>
              )}

              {/* UPLOAD REEL THUMBNAIL COVER IMAGE */}
              <div className="pt-3.5 border-t border-white/10 space-y-2">
                <label className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">
                  🖼️ Upload Reel Thumbnail Cover Image (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="border border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-3.5 bg-[#1c1d22] flex-1 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            if (evt.target?.result && typeof setThumbnailUrl === 'function') {
                              setThumbnailUrl(evt.target.result);
                              toast.success('Thumbnail cover image selected!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="text-xs text-slate-300 font-bold flex items-center justify-center gap-2">
                      <FiImage size={16} className="text-amber-400" />
                      <span>{thumbnailUrl ? 'Change Thumbnail Cover' : 'Click to Upload Custom Cover Thumbnail'}</span>
                    </div>
                  </div>
                  {thumbnailUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400 relative shrink-0 shadow-md">
                      <img src={thumbnailUrl} alt="Thumbnail Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => typeof setThumbnailUrl === 'function' && setThumbnailUrl('')}
                        className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl cursor-pointer"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="w-1/3 py-3.5 bg-white/10 border border-white/10 text-slate-200 font-bold text-xs rounded-full hover:bg-white/15 hover:text-white transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
              >
                Continue to Promotion & Audience →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PROMOTION AREA & AUDIENCE ── */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 6A. PROMOTION AREA */}
            <div className="p-4 sm:p-5 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <FiMapPin /> 6A. Promotion Area (Single Choice) *
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {PROMOTION_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setPromotionArea(area)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      promotionArea === area
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02] font-extrabold'
                        : 'bg-[#1c1d22] border border-white/12 text-slate-200 hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 6B. TARGET AUDIENCE */}
            <div className="p-4 sm:p-5 bg-[#2b2d36] rounded-2xl border border-amber-500/25 space-y-3.5">
              <h4 className="font-extrabold text-xs uppercase text-amber-300 tracking-wider flex items-center gap-2">
                <FiUsers /> 6B. Target Audience (Multi-Select) *
              </h4>

              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {PREDEFINED_AUDIENCES.map((tag) => {
                  const isSelected = selectedTargetAudiences.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleAudienceTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-white border border-emerald-400 shadow-md shadow-emerald-500/20 font-extrabold'
                          : 'bg-[#1c1d22] border border-white/12 text-slate-200 hover:bg-white/10 hover:text-white'
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
                <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1.5">
                  Custom Target Audience Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lawyers, CA, gym members, foodies, college students"
                  value={customTargetAudience}
                  onChange={(e) => setCustomTargetAudience(e.target.value)}
                  className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs text-slate-100 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-1/3 py-3.5 bg-white/10 border border-white/10 text-slate-200 font-bold text-xs rounded-full hover:bg-white/15 hover:text-white transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onOpenPreview}
                className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400"
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
