import React, { useState, useRef, useEffect } from 'react';
import {
  FiVideo, FiCpu, FiPlay, FiCalendar, FiShield,
  FiEye, FiHeart, FiRadio, FiPlus, FiTrash2, FiFileText, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import {
  useGetVendorReelsQuery,
  useCreateReelMutation,
  useDeleteReelMutation,
  useGetVendorListingsQuery
} from '../../../features/vendor/vendorApi';

// Subcomponents
import ReelCardMediaCarousel from './ReelCardMediaCarousel';
import CreateReelWizardModal from './CreateReelWizardModal';
import ReelPreviewModal from './ReelPreviewModal';
import AiReelGeneratorModal from './AiReelGeneratorModal';
import InteractiveLiveModal from './InteractiveLiveModal';
import ReelBoostModal from './ReelBoostModal';

export default function VendorReelsPage() {
  const [activeTab, setActiveTab] = useState('published');
  
  // Main Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAiAdModal, setShowAiAdModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedReelForBoost, setSelectedReelForBoost] = useState(null);

  const handleOpenBoostModal = (reel) => {
    setSelectedReelForBoost(reel);
    setShowBoostModal(true);
  };

  // 1. SELECT CONTENT TYPE
  const [postType, setPostType] = useState('services'); // 'product' | 'services' | 'shop'

  // 2. DEPENDENT CATEGORY & SUB CATEGORY
  const [postCategory, setPostCategory] = useState('');
  const [postSubcategory, setPostSubcategory] = useState('');

  // 3. SELECT POST PURPOSE + PURPOSE-SPECIFIC EXTRA FIELDS
  const [postPurpose, setPostPurpose] = useState('General Promotion');
  // Extra fields shown conditionally by purpose
  const [discountPercent, setDiscountPercent] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountValidity, setDiscountValidity] = useState('');
  const [announcementTagline, setAnnouncementTagline] = useState('');

  // 4. SELECT SERVICE / PRODUCT (OPTION A & B)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductData, setSelectedProductData] = useState(null);

  // 5. SELECT MEDIA (OPTION A & B - UP TO 5 IMAGES/VIDEOS PER POST)
  const [mediaOption, setMediaOption] = useState('service_media'); // 'service_media' | 'upload_new'
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [selectedServiceMediaUrls, setSelectedServiceMediaUrls] = useState([]);
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [customMediaList, setCustomMediaList] = useState([]); // Array of { url, name, type } (up to 5)
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [saveToServiceGallery, setSaveToServiceGallery] = useState(false);

  // POST DETAILS
  const [caption, setCaption] = useState('');

  // 6. PROMOTION & TARGET AUDIENCE SETTINGS
  const [promotionArea, setPromotionArea] = useState('Within 5 KM');
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState(['Anyone (All Users)']);
  const [customTargetAudience, setCustomTargetAudience] = useState('');

  // SCHEDULING
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // GO LIVE STATE & WEBCAM STREAM
  const [liveTitle, setLiveTitle] = useState('Live Product Showcase & Q&A');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const liveVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize & Stop Camera Media Stream
  const startCameraStream = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      } else {
        setCameraError('Camera access is not supported on this browser.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera/microphone. Please check browser permissions.');
      toast.error('Camera access permission denied or device busy');
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  // Start/Stop stream when showLiveModal toggles
  useEffect(() => {
    if (showLiveModal) {
      startCameraStream();
    } else {
      stopCameraStream();
      setIsStreaming(false);
      setActiveStreamId(null);
    }
    return () => {
      stopCameraStream();
    };
  }, [showLiveModal]);

  const handleToggleLiveStream = async () => {
    if (isStreaming && activeStreamId) {
      const toastId = toast.loading('Ending live stream...');
      try {
        await api.post(`/v1/live/${activeStreamId}/end`);
        setIsStreaming(false);
        setActiveStreamId(null);
        toast.success('Live stream ended.', { id: toastId });
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to end live stream', { id: toastId });
      }
    } else {
      if (!liveTitle.trim()) {
        toast.error('Live title is required');
        return;
      }
      const toastId = toast.loading('Starting live stream...');
      try {
        const res = await api.post('/v1/live', {
          title: liveTitle.trim(),
          description: 'Live Interactive Session'
        });
        const stream = res.data?.data?.stream || res.data?.stream || res.data;
        const streamId = stream?._id || stream?.id;
        if (streamId) {
          setActiveStreamId(streamId);
          setIsStreaming(true);
          toast.success('🔴 Live stream started! Video broadcast active.', { id: toastId });
        } else {
          toast.error('Failed to retrieve live stream ID', { id: toastId });
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to start live stream', { id: toastId });
      }
    }
  };

  // API QUERIES & MUTATIONS
  const { data: reelsData, isFetching, refetch } = useGetVendorReelsQuery(undefined, { pollingInterval: 300000 });
  const { data: listingsData } = useGetVendorListingsQuery(undefined);
  const [createReel, { isLoading: isPublishing }] = useCreateReelMutation();
  const [deleteReel] = useDeleteReelMutation();

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

  const handleDeleteReel = async (reelId) => {
    if (!reelId) return;
    if (window.confirm('Are you sure you want to delete this Reel / Post?')) {
      const toastId = toast.loading('Deleting Reel in real-time...');
      try {
        await deleteReel(reelId).unwrap();
        toast.success('Reel deleted in real-time!', { id: toastId });
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err?.message || 'Failed to delete reel', { id: toastId });
      }
    }
  };

  const reelsList = Array.isArray(reelsData?.data) ? reelsData.data : Array.isArray(reelsData?.reels) ? reelsData.reels : Array.isArray(reelsData) ? reelsData : [];

  const publishedCount = reelsList.filter(r => (r.status || 'published') === 'published').length;
  const scheduledCount = reelsList.filter(r => r.status === 'scheduled').length;
  const draftCount = reelsList.filter(r => r.status === 'draft').length;

  const dynamicTabs = [
    { key: 'published', label: 'Published Reels', icon: FiPlay, count: publishedCount },
    { key: 'scheduled', label: 'Scheduled Reels', icon: FiCalendar, count: scheduledCount },
    { key: 'draft', label: 'Drafts', icon: FiFileText, count: draftCount },
  ];

  const filtered = reelsList.filter((r) => (r.status || 'published') === activeTab);
  const vendorListings = Array.isArray(listingsData?.data) ? listingsData.data : Array.isArray(listingsData?.listings) ? listingsData.listings : Array.isArray(listingsData) ? listingsData : [];

  const handlePublishReelPost = async (publishStatus = 'published') => {
    if (!caption) return toast.error('Please enter Reel / Image post caption');

    const violation = scanForForbiddenContact(caption);
    if (violation) {
      toast.error(`⚠️ RESTRICTED: Post contains ${violation}. Phone numbers, WhatsApp, QR codes, emails, websites & social handles are strictly prohibited! Vendor flagged.`, { duration: 6000 });
      return;
    }

    if (publishStatus === 'scheduled') {
      if (!scheduledDate) {
        return toast.error('Please select a date and time to schedule the post');
      }
      const selected = new Date(scheduledDate);
      if (isNaN(selected.getTime())) {
        return toast.error('Invalid scheduled date/time selected');
      }
      if (selected <= new Date()) {
        return toast.error('Scheduled date and time must be in the future');
      }
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

    // Auto-detect mediaType based on finalMedia content
    const hasVideo = finalMedia.some(url => {
      if (!url) return false;
      if (url.startsWith('data:video/')) return true;
      try {
        const path = url.split('?')[0].split('#')[0];
        return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)$/i.test(path);
      } catch {
        return /\.(mp4|webm|mov|m4v|avi|mkv|3gp|flv|ogv)/i.test(url);
      }
    });
    const finalMediaType = hasVideo ? 'video' : 'image';

    const toastId = toast.loading(
      publishStatus === 'scheduled' ? 'Scheduling Post...' :
      publishStatus === 'draft' ? 'Saving Draft...' : 'Publishing Reel/Image Post...'
    );

    const targetListingId = postType === 'product'
      ? selectedProductId
      : postType === 'services'
        ? selectedServiceId
        : null;

    try {
      await createReel({
        title: caption,
        caption,
        postType: postType === 'services' ? 'service' : postType,
        category: postCategory,
        subcategory: postSubcategory,
        classification: postPurpose,
        postPurpose,
        // Purpose-specific extra metadata
        offerDetails: postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale' ? {
          discountPercent: parseFloat(discountPercent) || null,
          couponCode: couponCode.trim() || null,
          validTill: discountValidity || null,
        } : null,
        announcementTagline: (postPurpose === 'Announcement' || postPurpose === 'New Service Launch' ||
          postPurpose === 'New Arrival' || postPurpose === 'Grand Opening' ||
          postPurpose === 'Special Event' || postPurpose === 'Business Update')
          ? announcementTagline.trim() || null
          : null,
        targetListing: targetListingId || null,
        targeting: {
          distance: promotionArea,
          area: promotionArea,
          audience: selectedTargetAudiences,
          customAudience: customTargetAudience,
        },
        customAudience: customTargetAudience,
        mediaUrls: finalMedia,
        videoUrl: finalMedia[0],
        mediaType: finalMediaType,
        saveToServiceGallery,
        status: publishStatus,
        scheduledDate: publishStatus === 'scheduled' ? scheduledDate : null,
      }).unwrap();

      toast.success(
        publishStatus === 'scheduled' ? '🟢 Reel Scheduled Successfully!' :
        publishStatus === 'draft' ? '📝 Post Saved as Draft!' :
        '🟢 Reel/Image Post Published Successfully!',
        { id: toastId }
      );

      setShowPreviewModal(false);
      setShowPostModal(false);
      setCaption('');
      setCustomMediaUrl('');
      setCustomMediaList([]);
      setSelectedServiceMediaUrls([]);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to publish post', { id: toastId });
    }
  };


  // Reset helper when content type switches to ensure correct default option selections
  useEffect(() => {
    setSelectedServiceId('');
    setSelectedServiceData(null);
    setSelectedProductId('');
    setSelectedProductData(null);
    setSelectedServiceMediaUrls([]);
    setMediaOption('upload_new');
    // Reset purpose to the first option of that post type
    setPostPurpose('General Promotion');
    setDiscountPercent('');
    setCouponCode('');
    setDiscountValidity('');
    setAnnouncementTagline('');
  }, [postType]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* AI RESTRICTION NOTICE BANNER */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-amber-700 font-medium">
        <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">
          <strong>AI Content Guard Active:</strong> <span className="hidden sm:inline">Phone numbers, WhatsApp numbers, QR codes, emails, websites & social media handles are strictly blocked. Violations will result in vendor account blacklisting.</span><span className="sm:hidden">Contact info strictly blocked in posts.</span>
        </span>
      </div>

      <AdminPageHeader
        icon={FiVideo}
        title="Service Reels & AI Ads Studio"
        subtitle={`Live catalog (${reelsList.length} total posts) • ${publishedCount} Published • ${scheduledCount} Scheduled • ${draftCount} Drafts • ${reelsList.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()} Total Views`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPostModal(true)}
            className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl gradient-brand text-white font-bold text-[11px] sm:text-xs shadow-premium flex items-center gap-1.5 hover:brightness-110"
          >
            <FiPlus size={15} /> <span className="hidden sm:inline">CREATE REEL / POST</span><span className="sm:hidden">CREATE REEL</span>
          </button>
          <button
            onClick={() => setShowAiAdModal(true)}
            className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-brand-purple text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 hover:bg-brand-purple/90"
          >
            <FiCpu size={15} /> <span className="hidden sm:inline">CREATE REELS (AI)</span><span className="sm:hidden">AI REEL</span>
          </button>
          <button
            onClick={() => setShowLiveModal(true)}
            className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-red-600 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 hover:bg-red-700"
          >
            <FiRadio size={15} /> <span className="hidden sm:inline">GO LIVE</span><span className="sm:hidden">LIVE</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* REAL-TIME REEL CATALOG STATS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-brand-purple/20 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-text-tertiary tracking-wider block">TOTAL REELS</span>
          <span className="text-xl sm:text-2xl font-black text-brand-purple">{reelsList.length}</span>
          <span className="text-[9px] sm:text-[10px] text-text-secondary block">Catalog Posts</span>
        </div>
        <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-500/20 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-text-tertiary tracking-wider block">PUBLISHED</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-500">{publishedCount}</span>
          <span className="text-[9px] sm:text-[10px] text-text-secondary block">Live Feed</span>
        </div>
        <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-500/20 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-text-tertiary tracking-wider block">SCHEDULED</span>
          <span className="text-xl sm:text-2xl font-black text-blue-500">{scheduledCount}</span>
          <span className="text-[9px] sm:text-[10px] text-text-secondary block">Upcoming</span>
        </div>
        <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/20 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-text-tertiary tracking-wider block">DRAFTS</span>
          <span className="text-xl sm:text-2xl font-black text-amber-500">{draftCount}</span>
          <span className="text-[9px] sm:text-[10px] text-text-secondary block">Saved Drafts</span>
        </div>
        <div className="glass p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-violet-500/20 text-center space-y-0.5 sm:space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-text-tertiary tracking-wider block">TOTAL VIEWS</span>
          <span className="text-xl sm:text-2xl font-black text-violet-500">{reelsList.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()}</span>
          <span className="text-[9px] sm:text-[10px] text-text-secondary block">Customer Views</span>
        </div>
      </div>

      <AdminTabBar tabs={dynamicTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Reels Grid */}
      {isFetching && !reelsList.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No {activeTab} reels found. Click "CREATE REEL / POST" to publish your first content!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((reel) => (
            <div key={reel._id || reel.id} className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover transition-all overflow-hidden">
              <ReelCardMediaCarousel reel={reel} />

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-text-primary line-clamp-2">{reel.caption || reel.title || 'Service Reel'}</h4>
                  <div className="flex items-center gap-1">
                    {reel.isBoosted && (
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5" title={`Boost active until ${new Date(reel.boostExpiresAt).toLocaleDateString()}`}>
                        <FiZap size={11} className="fill-amber-500" />
                        Boosted
                      </span>
                    )}
                    {!reel.isBoosted && reel.status === 'published' && (
                      <button
                        type="button"
                        onClick={() => handleOpenBoostModal(reel)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-tertiary hover:text-amber-500 transition flex-shrink-0 flex items-center gap-1"
                        title="Boost Reel"
                      >
                        <FiZap size={15} />
                        <span className="text-[10px] font-bold">Boost</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel._id || reel.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition flex-shrink-0"
                      title="Delete Reel"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

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
                  <span className="flex items-center gap-1"><FiEye size={13} /> {reel.views !== undefined ? reel.views.toLocaleString() : 0}</span>
                  <span className="flex items-center gap-1"><FiHeart size={13} className="text-brand-pink" /> {reel.likesCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE SERVICE REEL / IMAGE POST FLOW (3-STEP WIZARD) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <CreateReelWizardModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        vendorListings={vendorListings}
        onOpenPreview={() => setShowPreviewModal(true)}
        
        postType={postType}
        setPostType={setPostType}
        postCategory={postCategory}
        setPostCategory={setPostCategory}
        postSubcategory={postSubcategory}
        setPostSubcategory={setPostSubcategory}
        postPurpose={postPurpose}
        setPostPurpose={setPostPurpose}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        discountValidity={discountValidity}
        setDiscountValidity={setDiscountValidity}
        announcementTagline={announcementTagline}
        setAnnouncementTagline={setAnnouncementTagline}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        selectedServiceData={selectedServiceData}
        setSelectedServiceData={setSelectedServiceData}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedProductData={selectedProductData}
        setSelectedProductData={setSelectedProductData}
        mediaOption={mediaOption}
        setMediaOption={setMediaOption}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
        selectedServiceMediaUrls={selectedServiceMediaUrls}
        setSelectedServiceMediaUrls={setSelectedServiceMediaUrls}
        customMediaUrl={customMediaUrl}
        setCustomMediaUrl={setCustomMediaUrl}
        customMediaList={customMediaList}
        setCustomMediaList={setCustomMediaList}
        mediaType={mediaType}
        setMediaType={setMediaType}
        saveToServiceGallery={saveToServiceGallery}
        setSaveToServiceGallery={setSaveToServiceGallery}
        caption={caption}
        setCaption={setCaption}
        promotionArea={promotionArea}
        setPromotionArea={setPromotionArea}
        selectedTargetAudiences={selectedTargetAudiences}
        setSelectedTargetAudiences={setSelectedTargetAudiences}
        customTargetAudience={customTargetAudience}
        setCustomTargetAudience={setCustomTargetAudience}
      />

      {/* MODAL 2: PREVIEW & PUBLISH SUMMARY */}
      <ReelPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        postType={postType}
        postCategory={postCategory}
        postSubcategory={postSubcategory}
        postPurpose={postPurpose}
        discountPercent={discountPercent}
        couponCode={couponCode}
        discountValidity={discountValidity}
        announcementTagline={announcementTagline}
        caption={caption}
        mediaOption={mediaOption}
        selectedServiceMediaUrls={selectedServiceMediaUrls}
        customMediaList={customMediaList}
        customMediaUrl={customMediaUrl}
        promotionArea={promotionArea}
        selectedTargetAudiences={selectedTargetAudiences}
        customTargetAudience={customTargetAudience}
        isScheduled={isScheduled}
        setIsScheduled={setIsScheduled}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        isPublishing={isPublishing}
        selectedServiceData={selectedServiceData}
        selectedProductData={selectedProductData}
        onPublish={handlePublishReelPost}
      />

      {/* MODAL 3: CREATE REELS AI */}
      <AiReelGeneratorModal
        isOpen={showAiAdModal}
        onClose={() => setShowAiAdModal(false)}
        refetch={refetch}
        createReel={createReel}
      />

      {/* MODAL 4: GO LIVE Interactive simulator */}
      <InteractiveLiveModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        liveVideoRef={liveVideoRef}
        isStreaming={isStreaming}
        cameraError={cameraError}
        liveTitle={liveTitle}
        setLiveTitle={setLiveTitle}
        handleToggleLiveStream={handleToggleLiveStream}
      />

      {/* MODAL 5: BOOST REEL */}
      <ReelBoostModal
        isOpen={showBoostModal}
        onClose={() => {
          setShowBoostModal(false);
          setSelectedReelForBoost(null);
        }}
        reel={selectedReelForBoost}
        refetchReels={refetch}
      />
    </div>
  );
}
