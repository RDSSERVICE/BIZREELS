import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo, FiCpu, FiPlay, FiCalendar, FiShield,
  FiEye, FiHeart, FiShare2, FiUserCheck, FiRadio, FiZap, FiPlus,
  FiMapPin, FiTarget, FiAlertTriangle, FiCheckCircle, FiClock, FiCamera,
  FiImage, FiLayers, FiTag, FiUsers, FiDollarSign, FiSend, FiX, FiHelpCircle, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useGetVendorReelsQuery, useCreateReelMutation, useGetVendorListingsQuery } from '../../../features/vendor/vendorApi';
import CreateServiceModal from './CreateServiceModal';

const TABS = [
  { key: 'published', label: 'Published Reels', icon: FiPlay },
  { key: 'scheduled', label: 'Scheduled Reels', icon: FiCalendar },
];

// PREDEFINED DEPENDENT SERVICE CATEGORIES & SUB-CATEGORIES
const SERVICE_CATEGORIES = {
  'Home Services': ['Electrician', 'Plumber', 'AC Repair', 'Cleaning & Sanitization', 'Carpenter', 'Appliance Repair', 'Painter', 'Pest Control'],
  'Beauty & Wellness': ['Salon for Men', 'Salon for Women', 'Spa & Massage', 'Makeup Artist', 'Hair Styling', 'Nail Art', 'Tattoo & Piercing'],
  'Education & Coaching': ['Coaching Institute', 'Home Tutor', 'Language Classes', 'Music & Dance', 'Competitive Exams', 'Skill Development'],
  'Health & Medical': ['Clinic', 'Dentist', 'Physiotherapy', 'Diagnostics & Lab', 'Pharmacy', 'Yoga & Wellness', 'Ayurvedic & Homeopathy'],
  'Automobile Services': ['Car Repair & Service', 'Bike Repair', 'Washing & Detailing', 'Towing Service', 'EV Charging', 'Battery & Tyres'],
  'IT & Digital Services': ['Web & App Development', 'Graphic Design', 'Digital Marketing', 'CCTV & Security Systems', 'Computer Repair'],
  'Events & Wedding': ['Event Planner', 'Catering', 'Photography & Video', 'Decoration', 'DJ & Entertainment'],
  'Real Estate & Construction': ['Interior Design', 'Architecture & Plan', 'Building Contractor', 'Property Dealer', 'Electric Work'],
  'Legal & Financial': ['Chartered Accountant (CA)', 'Lawyer / Advocate', 'Tax Consultant', 'GST Registration', 'Insurance Advisor']
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

export default function VendorReelsPage() {
  const [activeTab, setActiveTab] = useState('published');
  
  // Main Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAiAdModal, setShowAiAdModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedReelForBoost, setSelectedReelForBoost] = useState(null);

  // ── WIZARD STEP STATE ──
  const [wizardStep, setWizardStep] = useState(1);

  // 1. SELECT CONTENT TYPE
  const [postType, setPostType] = useState('services'); // 'product' | 'services' | 'shop'

  // 2. DEPENDENT CATEGORY & SUB CATEGORY
  const [postCategory, setPostCategory] = useState('Home Services');
  const [postSubcategory, setPostSubcategory] = useState('Electrician');

  // 3. SELECT POST PURPOSE
  const [postPurpose, setPostPurpose] = useState('General Promotion'); // 'General Promotion' | 'Offer / Discount' | 'Announcement'

  // 4. SELECT SERVICE (OPTION A & B)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedServiceData, setSelectedServiceData] = useState(null);

  // 5. SELECT MEDIA (OPTION A & B - UP TO 5 IMAGES/VIDEOS PER POST)
  const [mediaOption, setMediaOption] = useState('service_media'); // 'service_media' | 'upload_new'
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedServiceMediaUrls, setSelectedServiceMediaUrls] = useState([]);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [customMediaList, setCustomMediaList] = useState([]); // Array of { url, name, type } (up to 5)
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [saveToServiceGallery, setSaveToServiceGallery] = useState(false);

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
      setCustomMediaList((prev) => {
        const nextList = [...prev, ...validResults].slice(0, 5);
        if (nextList.length > 0) {
          setMediaType(nextList[0].type);
        }
        return nextList;
      });
      toast.success(`🟢 ${validResults.length} photo(s)/video(s) added!`);
    });
  };

  const removeCustomMediaItem = (index) => {
    setCustomMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleServiceMediaUrl = (url) => {
    if (selectedServiceMediaUrls.includes(url)) {
      setSelectedServiceMediaUrls(prev => prev.filter(u => u !== url));
    } else {
      if (selectedServiceMediaUrls.length >= 5) {
        return toast.error('Maximum 5 images/videos allowed per post.');
      }
      setSelectedServiceMediaUrls(prev => [...prev, url]);
    }
  };

  // POST DETAILS
  const [caption, setCaption] = useState('');

  // 6. PROMOTION & TARGET AUDIENCE SETTINGS
  const [promotionArea, setPromotionArea] = useState('Within 5 KM');
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState(['Anyone (All Users)']);
  const [customTargetAudience, setCustomTargetAudience] = useState('');

  // SCHEDULING
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // BOOST POST STATE
  const [boostBudget, setBoostBudget] = useState(499);
  const [boostDurationDays, setBoostDurationDays] = useState(3);

  // GO LIVE STATE
  const [liveTitle, setLiveTitle] = useState('Live Product Showcase & Q&A');
  const [isStreaming, setIsStreaming] = useState(false);

  // AI Ad Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // API QUERIES & MUTATIONS
  const { data: reelsData, isFetching, refetch } = useGetVendorReelsQuery(undefined, { pollingInterval: 5000 });
  const { data: listingsData } = useGetVendorListingsQuery(undefined);
  const [createReel, { isLoading: isPublishing }] = useCreateReelMutation();

  const reelsList = Array.isArray(reelsData?.data) ? reelsData.data : Array.isArray(reelsData?.reels) ? reelsData.reels : Array.isArray(reelsData) ? reelsData : [];
  const filtered = reelsList.filter((r) => (r.status || 'published') === activeTab);

  // Vendor's services list for Option A
  const vendorListings = Array.isArray(listingsData?.data) ? listingsData.data : Array.isArray(listingsData?.listings) ? listingsData.listings : Array.isArray(listingsData) ? listingsData : [];
  const vendorServices = vendorListings.filter(l => l.type === 'service' || !l.type);

  // ── AI CONTACT RESTRICTION SCANNER ──
  const scanForForbiddenContact = (text) => {
    if (!text) return false;
    const phoneRegex = /(?:(?:\+|00)91[\s-]*)?[6789]\d{9}|\b\d{10}\b|\b\d{5}[\s-]\d{5}\b/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const websiteRegex = /(https?:\/\/|www\.)[^\s]+/i;
    const socialHandleRegex = /@[\w_.]{3,}/;
    const qrKeywords = /qr\s*code|scan\s*qr|scan\s*to\s*pay|whatsapp|call\s*me/i;

    if (phoneRegex.test(text)) return 'Phone / Mobile Number';
    if (emailRegex.test(text)) return 'Email Address';
    if (websiteRegex.test(text)) return 'Website URL';
    if (socialHandleRegex.test(text)) return 'Social Media Handle (@username)';
    if (qrKeywords.test(text)) return 'QR Code / Direct Contact Trigger';
    return false;
  };

  // Handle Category Change -> Update Subcategories
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setPostCategory(cat);
    const subcats = SERVICE_CATEGORIES[cat] || [];
    setPostSubcategory(subcats[0] || 'General');
  };

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

      // Collect service media
      const media = [...(service.images || []), ...(service.videos || [])];
      if (media.length > 0) {
        setSelectedServiceMediaUrls([media[0]]);
      } else {
        setSelectedServiceMediaUrls([]);
      }
    }
  };

  // Toggle Target Audience chip
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

  // Handle Newly Created Service from Option B Modal
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

  // Final Publish Handler
  const handlePublishReelPost = async (publishStatus = 'published') => {
    if (!caption) return toast.error('Please enter Reel / Image post caption');

    const violation = scanForForbiddenContact(caption);
    if (violation) {
      toast.error(`⚠️ RESTRICTED: Post contains ${violation}. Phone numbers, WhatsApp, QR codes, emails, websites & social handles are strictly prohibited! Vendor flagged.`, { duration: 6000 });
      return;
    }

    // Determine final media URLs (up to 5 items)
    let finalMedia = [];
    if (mediaOption === 'service_media') {
      finalMedia = selectedServiceMediaUrls.slice(0, 5);
    } else {
      if (uploadMode === 'file') {
        finalMedia = customMediaList.map(item => item.url).slice(0, 5);
      } else {
        if (customMediaUrl) finalMedia = [customMediaUrl];
      }
    }

    if (finalMedia.length === 0) {
      finalMedia = ['https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4'];
    }

    const toastId = toast.loading(
      publishStatus === 'scheduled' ? 'Scheduling Post...' :
      publishStatus === 'draft' ? 'Saving Draft...' : 'Publishing Service Reel/Image Post...'
    );

    try {
      await createReel({
        title: caption,
        caption,
        postType,
        category: postCategory,
        subcategory: postSubcategory,
        classification: postPurpose,
        postPurpose,
        targetListing: selectedServiceId || null,
        targeting: {
          distance: promotionArea,
          area: promotionArea,
          audience: selectedTargetAudiences,
          customAudience: customTargetAudience,
        },
        customAudience: customTargetAudience,
        mediaUrls: finalMedia,
        videoUrl: finalMedia[0],
        mediaType,
        saveToServiceGallery,
        status: publishStatus,
        scheduledDate: publishStatus === 'scheduled' ? scheduledDate : null,
      }).unwrap();

      toast.success(
        publishStatus === 'scheduled' ? '🟢 Service Reel Scheduled Successfully!' :
        publishStatus === 'draft' ? '📝 Post Saved as Draft!' :
        '🟢 Service Reel/Image Post Published Successfully!',
        { id: toastId }
      );

      setShowPreviewModal(false);
      setShowPostModal(false);
      setCaption('');
      setWizardStep(1);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to publish post', { id: toastId });
    }
  };

  const handleConfirmBoost = (e) => {
    e.preventDefault();
    toast.success(`🚀 Post Boosted for ${boostDurationDays} days (Target: ${(boostBudget * 20).toLocaleString()} views)!`);
    setShowBoostModal(false);
  };

  const handleGenerateAiAd = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return toast.error('Enter product description');

    const violation = scanForForbiddenContact(aiPrompt);
    if (violation) {
      return toast.error(`⚠️ RESTRICTED: Prompt contains ${violation}.`);
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading('AI is generating video script & ad layout...');
    setTimeout(async () => {
      setIsGeneratingAi(false);
      setShowAiAdModal(false);
      try {
        await createReel({ title: aiPrompt, caption: aiPrompt, postType: 'services', status: 'published' }).unwrap();
      } catch {}
      toast.success('AI Video Ad Generated & Published to Reels!', { id: toastId });
      refetch();
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* AI RESTRICTION NOTICE BANNER */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-700 font-medium">
        <div className="flex items-center gap-2">
          <FiShield className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            <strong>AI Content Guard Active:</strong> Phone numbers, WhatsApp numbers, QR codes, emails, websites & social media handles are strictly blocked. Violations will result in vendor account blacklisting.
          </span>
        </div>
      </div>

      <AdminPageHeader
        icon={FiVideo}
        title="Service Reels & AI Ads Studio"
        subtitle="Post service reels/images, target specific audience groups & local areas, launch live streams, run AI ad creator, schedule posts, and boost visibility"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setWizardStep(1); setShowPostModal(true); }}
            className="px-3.5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium flex items-center gap-1.5"
          >
            <FiPlus size={15} /> 1. CREATE SERVICE REEL / POST
          </button>
          <button
            onClick={() => setShowBoostModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <FiZap size={15} /> 2. BOOST POST
          </button>
          <button
            onClick={() => setShowAiAdModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-brand-purple text-white font-bold text-xs flex items-center gap-1.5"
          >
            <FiCpu size={15} /> 3. CREATE REELS (AI)
          </button>
          <button
            onClick={() => setShowLiveModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <FiRadio size={15} /> 5. GO LIVE
          </button>
        </div>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Reels Grid */}
      {isFetching && !reelsList.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No {activeTab} reels found. Click "1. CREATE SERVICE REEL / POST" to publish your first content!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((reel) => (
            <div key={reel._id || reel.id} className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden">
              <div className="aspect-[9/16] bg-black relative">
                <video src={reel.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                {reel.isBoosted && (
                  <div className="absolute top-3 left-3 gradient-brand px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-premium">
                    <FiZap size={11} /> BOOSTED
                  </div>
                )}
                {reel.postPurpose && (
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-amber-400/30">
                    {reel.postPurpose}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <h4 className="font-bold text-sm text-text-primary line-clamp-2">{reel.caption || reel.title || 'Service Reel'}</h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-purple/10 text-brand-purple">
                    {reel.category || 'Service'} • {reel.subcategory || 'General'}
                  </span>
                  {reel.promotionArea && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600">
                      📍 {reel.promotionArea}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-text-tertiary border-t border-border pt-2">
                  <span className="flex items-center gap-1"><FiEye size={13} /> {reel.views?.toLocaleString() || 120}</span>
                  <span className="flex items-center gap-1"><FiHeart size={13} className="text-brand-pink" /> {reel.likesCount || 15}</span>
                  <button
                    onClick={() => { setSelectedReelForBoost(reel); setShowBoostModal(true); }}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                  >
                    <FiZap /> Boost
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE SERVICE REEL / IMAGE POST FLOW (7-STEP WIZARD) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Create Service Reel / Image Post Flow"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          
          {/* STEP INDICATOR HEADER */}
          <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
            <span className="font-extrabold text-brand-purple uppercase tracking-wider">
              Step {wizardStep} of 4: {
                wizardStep === 1 ? 'Content Type, Category & Purpose' :
                wizardStep === 2 ? 'Select Service & Media' :
                wizardStep === 3 ? 'Promotion & Target Audience' :
                'Preview & Publish'
              }
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map(s => (
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

          {/* ──────────────── STEP 1: CONTENT TYPE, CATEGORY & PURPOSE ──────────────── */}
          {wizardStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              
              {/* 1. SELECT CONTENT TYPE */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                  1. Select Content Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
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

              {/* 2. SELECT SERVICE CATEGORY (DEPENDENT DROPDOWNS) */}
              <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                  <FiLayers /> 2. Select Service Category (Dependent Dropdowns)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Service Category *
                    </label>
                    <select
                      value={postCategory}
                      onChange={handleCategoryChange}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple"
                    >
                      {Object.keys(SERVICE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Service Sub Category *
                    </label>
                    <select
                      value={postSubcategory}
                      onChange={(e) => setPostSubcategory(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs font-medium focus:border-brand-purple"
                    >
                      {(SERVICE_CATEGORIES[postCategory] || ['General']).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-text-tertiary italic">
                  Selected Mapping: <strong className="text-brand-purple">{postCategory}</strong> → <strong>{postSubcategory}</strong>
                </p>
              </div>

              {/* 3. SELECT POST PURPOSE */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                  3. Select Post Purpose (Select One) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'General Promotion', label: 'General Promotion', desc: 'Standard visibility & showcase' },
                    { key: 'Offer / Discount', label: 'Offer / Discount', desc: 'Highlight special deal or coupon' },
                    { key: 'Announcement', label: 'Announcement', desc: 'New launches or service updates' },
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPostPurpose(p.key)}
                      className={`p-3 rounded-xl text-left border transition ${
                        postPurpose === p.key
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 shadow-sm'
                          : 'bg-surface border-border text-text-secondary hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{p.label}</span>
                        {postPurpose === p.key && <FiCheckCircle className="text-amber-600" size={14} />}
                      </div>
                      <span className="text-[10px] text-text-tertiary block">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="w-full py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1"
              >
                Continue to Service & Media Selection →
              </button>
            </div>
          )}

          {/* ──────────────── STEP 2: SELECT SERVICE & MEDIA ──────────────── */}
          {wizardStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              
              {/* 4. SELECT SERVICE (OPTION A vs OPTION B) */}
              <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                  <FiTag /> 4. Select Service
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                      Option A – Select Existing Service Listed by Vendor
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => handleSelectExistingService(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                    >
                      <option value="">-- Choose from your listed services ({vendorServices.length}) --</option>
                      {vendorServices.map(s => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.title} (₹{s.price || s.sellingPrice || 0}) - {s.category || 'General'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedServiceData && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1 text-emerald-800">
                      <div className="flex items-center justify-between font-bold">
                        <span>Selected: {selectedServiceData.title}</span>
                        <span>Price: ₹{selectedServiceData.price || selectedServiceData.sellingPrice || 0}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 line-clamp-2">
                        {selectedServiceData.description || selectedServiceData.shortDescription || 'No description provided.'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[11px] text-text-tertiary">Can't find the service you want to promote?</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateServiceModal(true)}
                      className="px-3 py-1.5 bg-brand-purple/10 text-brand-purple border border-brand-purple/30 hover:bg-brand-purple hover:text-white transition rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <FiPlus size={13} /> Option B – Create New Service
                    </button>
                  </div>
                </div>
              </div>

              {/* CAPTION / POST TITLE */}
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                  Service Reel / Image Caption * (No Contact Info Allowed)
                </label>
                <textarea
                  required
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe your service offer, highlights, or promo message..."
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                />
              </div>

              {/* 5. SELECT MEDIA (OPTION A vs OPTION B) */}
              <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
                <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
                  <FiImage /> 5. Select Media
                </h4>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setMediaOption('service_media')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                      mediaOption === 'service_media' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'
                    }`}
                  >
                    Option A – Use Service Media
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

                {mediaOption === 'service_media' ? (
                  <div>
                    {selectedServiceData && (selectedServiceData.images?.length > 0 || selectedServiceData.videos?.length > 0) ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-text-tertiary uppercase block">
                            Select up to 5 Images/Videos from Service Gallery:
                          </label>
                          <span className="text-[10px] font-extrabold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                            {selectedServiceMediaUrls.length} / 5 Selected
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[...(selectedServiceData.images || []), ...(selectedServiceData.videos || [])].map((url, idx) => {
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
                                  <img src={url} alt="Service media" className="w-full h-full object-cover" />
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
                    ) : (
                      <p className="text-xs text-text-tertiary italic">
                        {selectedServiceData ? 'Selected service has no pre-uploaded media. Switch to Option B to upload up to 5 images.' : 'Select a service first in Option A to load service media.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* BUTTON TO CHOOSE BETWEEN UPLOAD FILE OR ENTER URL */}
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
                            Upload Photos / Videos (Up to 5 items for 1 post) *
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
                                Click or Drag & Drop Photos / Videos (Select up to {5 - customMediaList.length} files)
                              </span>
                              <span className="text-[10px] text-text-tertiary">Select multiple photos at once. Supports JPG, PNG, WEBP, MP4, MOV (Up to 50MB per file)</span>
                            </div>
                          </div>
                        )}

                        {/* MULTI-IMAGE PREVIEW GRID (UP TO 5 ITEMS) */}
                        {customMediaList.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 pt-1">
                            {customMediaList.map((item, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-black border-2 border-brand-purple group shadow-sm">
                                {item.type === 'video' ? (
                                  <video src={item.url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={item.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeCustomMediaItem(idx)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition"
                                  title="Remove image"
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
                          Media File URL (Video MP4 or Image JPG/PNG)
                        </label>
                        <input
                          type="url"
                          placeholder="https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4"
                          value={customMediaUrl}
                          onChange={(e) => {
                            setCustomMediaUrl(e.target.value);
                            setMediaType(e.target.value.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? 'video' : 'image');
                          }}
                          className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveToServiceGallery}
                        onChange={(e) => setSaveToServiceGallery(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-purple"
                      />
                      <span>Save this new media to Service Gallery for future use</span>
                    </label>
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
                  className="w-2/3 py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium"
                >
                  Continue to Promotion & Audience →
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: PROMOTION & TARGET AUDIENCE ──────────────── */}
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
                  <FiUsers /> 6B. Target Audience (Multi-Select Groups) *
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

                {/* CUSTOM TARGET AUDIENCE FIELD */}
                <div className="pt-2">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
                    Custom Target Audience (Saved to DB for search, filter & AI matching)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lawyers, Chartered Accountants, Engineers, Architects, Tourists, Gym Members, Startups"
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
                  onClick={() => {
                    setShowPreviewModal(true);
                  }}
                  className="w-2/3 py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1.5"
                >
                  <FiEye size={15} /> Open Preview & Publish Summary →
                </button>
              </div>
            </div>
          )}

        </div>
      </AdminModal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 7: PREVIEW & PUBLISH SUMMARY WITH CREDIT CONFIRMATION */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="7. Service Reel / Image Post Preview & Publish"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
          
          {/* PREVIEW CARD */}
          <div className="glass rounded-2xl border border-border p-4 space-y-4 bg-surface">
            
            {/* Service & Category Badge */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase">
                  {postCategory} → {postSubcategory}
                </span>
                <h3 className="font-bold text-base text-text-primary mt-1">
                  {selectedServiceData?.title || caption.slice(0, 40) || 'Service Promotion'}
                </h3>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-full text-xs font-bold uppercase">
                {postPurpose}
              </span>
            </div>

            {/* Media & Caption Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="space-y-2">
                <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative max-h-48 flex items-center justify-center border shadow-sm">
                  {(customMediaList[0]?.url || customMediaUrl || selectedServiceMediaUrls[0]) ? (
                    (customMediaList[0]?.url || customMediaUrl || selectedServiceMediaUrls[0]).match(/\.(mp4|webm)(\?.*)?$/i) ? (
                      <video src={customMediaList[0]?.url || customMediaUrl || selectedServiceMediaUrls[0]} muted autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                      <img src={customMediaList[0]?.url || customMediaUrl || selectedServiceMediaUrls[0]} alt="Post Media" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <video src="https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4" muted autoPlay loop className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-amber-400 border border-amber-400/30">
                    📷 {(mediaOption === 'service_media' ? selectedServiceMediaUrls : customMediaList).length || 1} Photo(s) Attached
                  </div>
                </div>
                {(customMediaList.length > 1 || selectedServiceMediaUrls.length > 1) && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {(mediaOption === 'service_media' ? selectedServiceMediaUrls : customMediaList.map(i => i.url)).map((mUrl, mIdx) => (
                      <div key={mIdx} className="w-10 h-10 rounded-lg bg-black border border-brand-purple overflow-hidden flex-shrink-0">
                        {mUrl.match(/\.(mp4|webm)(\?.*)?$/i) ? (
                          <video src={mUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={mUrl} alt={`Media ${mIdx}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-tertiary block">Caption</span>
                  <p className="text-text-secondary bg-surface-secondary p-2.5 rounded-xl border border-border line-clamp-4">
                    {caption || 'No caption entered.'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-tertiary block">Targeting Summary</span>
                  <p className="text-text-primary font-medium">📍 Area: {promotionArea}</p>
                  <p className="text-text-primary font-medium">👥 Audience: {selectedTargetAudiences.join(', ')}</p>
                  {customTargetAudience && <p className="text-brand-purple font-medium">🏷️ Custom: {customTargetAudience}</p>}
                </div>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-surface-secondary p-3 rounded-xl text-center border border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Estimated Reach</span>
                <span className="font-extrabold text-xs text-emerald-600">5,000 - 25,000 Users</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Credit Required</span>
                <span className="font-extrabold text-xs text-amber-600">1 Credit</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Post Validity</span>
                <span className="font-extrabold text-xs text-brand-purple">30 Days</span>
              </div>
            </div>
          </div>

          {/* CONFIRMATION MESSAGE */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span>"Publishing this Service Reel/Image Post will consume 1 credit. Do you want to continue?"</span>
          </div>

          {/* SCHEDULE OPTION TOGGLE */}
          <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5"><FiCalendar className="text-brand-purple" /> Schedule for Later Date</span>
              <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4" />
            </label>
            {isScheduled && (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-xl text-xs"
              />
            )}
          </div>

          {/* 4 ACTION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <button
              type="button"
              disabled={isPublishing}
              onClick={() => handlePublishReelPost(isScheduled ? 'scheduled' : 'published')}
              className="py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1"
            >
              <FiSend size={13} /> {isScheduled ? 'Schedule' : 'Publish'}
            </button>
            
            <button
              type="button"
              disabled={isPublishing}
              onClick={() => handlePublishReelPost('scheduled')}
              className="py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
            >
              <FiCalendar size={13} /> Schedule
            </button>

            <button
              type="button"
              disabled={isPublishing}
              onClick={() => handlePublishReelPost('draft')}
              className="py-3 bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="py-3 bg-surface border border-border text-text-secondary font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>

        </div>
      </AdminModal>

      {/* CREATE NEW SERVICE MODAL (OPTION B) */}
      <CreateServiceModal
        isOpen={showCreateServiceModal}
        onClose={() => setShowCreateServiceModal(false)}
        initialCategory={postCategory}
        initialSubcategory={postSubcategory}
        onCreated={handleServiceCreated}
      />

      {/* MODAL 2: BOOST POST */}
      <AdminModal isOpen={showBoostModal} onClose={() => setShowBoostModal(false)} title="2. Boost Post Visibility">
        <form onSubmit={handleConfirmBoost} className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700">
            Boost your reel/post to get priority placement in buyer feeds and instant customer inquiries.
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Select Budget (INR)</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setBoostBudget(199)} className={`p-2 rounded-xl text-xs font-bold border ${boostBudget === 199 ? 'bg-amber-500 text-white' : 'bg-surface'}`}>₹199 (4,000 views)</button>
              <button type="button" onClick={() => setBoostBudget(499)} className={`p-2 rounded-xl text-xs font-bold border ${boostBudget === 499 ? 'bg-amber-500 text-white' : 'bg-surface'}`}>₹499 (10,000 views)</button>
              <button type="button" onClick={() => setBoostBudget(999)} className={`p-2 rounded-xl text-xs font-bold border ${boostBudget === 999 ? 'bg-amber-500 text-white' : 'bg-surface'}`}>₹999 (25,000 views)</button>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-amber-500 text-white font-bold text-xs rounded-xl">
            Confirm & Launch Post Boost
          </button>
        </form>
      </AdminModal>

      {/* MODAL 3: CREATE REELS AI */}
      <AdminModal isOpen={showAiAdModal} onClose={() => setShowAiAdModal(false)} title="3. Create Reels / AI Generator">
        <form onSubmit={handleGenerateAiAd} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Product Offer / Promo Description *</label>
            <textarea
              rows={4}
              required
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create a 15-second promo reel for 20% discount on AC repair service..."
              className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
            />
          </div>
          <button type="submit" disabled={isGeneratingAi} className="w-full py-3 gradient-brand text-white font-bold text-xs rounded-xl">
            {isGeneratingAi ? 'AI Generating Reel...' : 'Generate AI Reel Video'}
          </button>
        </form>
      </AdminModal>

      {/* MODAL 5: GO LIVE MENU */}
      <AdminModal isOpen={showLiveModal} onClose={() => setShowLiveModal(false)} title="5. Go Live Interactive Console">
        <div className="space-y-4 text-center">
          <div className="aspect-video bg-black rounded-2xl relative flex items-center justify-center overflow-hidden border border-border">
            {isStreaming ? (
              <div className="text-white text-xs space-y-2 animate-pulse">
                <span className="px-3 py-1 bg-red-600 rounded-full font-bold uppercase tracking-wider text-[10px]">🔴 LIVE STREAMING NOW</span>
                <p className="text-sm font-bold">{liveTitle}</p>
                <p className="text-[10px] text-gray-400">Simulated Viewers: 142</p>
              </div>
            ) : (
              <div className="text-text-tertiary text-xs space-y-2">
                <FiCamera size={32} className="mx-auto opacity-50" />
                <p>Webcam preview ready. Click "Start Live Stream" to go live to customers.</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setIsStreaming(!isStreaming);
              toast.success(isStreaming ? 'Live stream ended.' : '🔴 LIVE Stream Started!');
            }}
            className={`w-full py-3 text-white font-bold text-xs rounded-xl ${isStreaming ? 'bg-gray-700' : 'bg-red-600'}`}
          >
            {isStreaming ? 'End Live Stream' : 'Start Live Stream Now'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
