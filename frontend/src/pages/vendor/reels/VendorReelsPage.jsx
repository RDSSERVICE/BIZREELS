import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiVideo, FiPlay, FiCalendar, FiShield,
  FiEye, FiHeart, FiUserCheck, FiPlus, FiTrash2, FiFileText, FiZap
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
import ReelBoostModal from './ReelBoostModal';
import ReelBoostPromptModal from './ReelBoostPromptModal';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorReelsPage() {
  const { bi, t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');
  
  // Main Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedReelForBoost, setSelectedReelForBoost] = useState(null);
  const [showBoostPromptModal, setShowBoostPromptModal] = useState(false);

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
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // POST DETAILS
  const [caption, setCaption] = useState('');

  // 6. PROMOTION & TARGET AUDIENCE SETTINGS
  const [promotionArea, setPromotionArea] = useState('Within 5 KM');
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState(['Anyone (All Users)']);
  const [customTargetAudience, setCustomTargetAudience] = useState('');

  // SCHEDULING
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // API QUERIES & MUTATIONS
  const { data: reelsData, isFetching, refetch } = useGetVendorReelsQuery(undefined, { pollingInterval: 10000 });
  const { data: listingsData } = useGetVendorListingsQuery(undefined);
  const [createReel, { isLoading: isPublishing }] = useCreateReelMutation();
  const [deleteReel] = useDeleteReelMutation();

  useEffect(() => {
    refetch();
  }, [refetch]);

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

  const unboostedPublishedReels = React.useMemo(() => {
    return reelsList.filter(
      r => (r.status || 'published') === 'published' && !r.isBoosted && !r.is_boosted
    );
  }, [reelsList]);

  // Trigger popup when reels page opens if there are unboosted published reels (checked per session)
  useEffect(() => {
    if (unboostedPublishedReels.length > 0) {
      const isDismissedThisSession = sessionStorage.getItem('vendor_reel_boost_prompt_dismissed');
      if (!isDismissedThisSession) {
        const timer = setTimeout(() => {
          setShowBoostPromptModal(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [unboostedPublishedReels.length]);

  const handleDismissBoostPrompt = () => {
    setShowBoostPromptModal(false);
    sessionStorage.setItem('vendor_reel_boost_prompt_dismissed', 'true');
  };

  const handleSelectReelToBoostFromPrompt = (reel) => {
    setShowBoostPromptModal(false);
    sessionStorage.setItem('vendor_reel_boost_prompt_dismissed', 'true');
    handleOpenBoostModal(reel);
  };

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
        thumbnailUrl: thumbnailUrl || finalMedia[0],
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
      {/* VENDOR CONTENT POLICY & COMPLIANCE BANNER */}
      <div className="p-4 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] flex items-start gap-3 text-xs text-slate-700 font-medium shadow-2xs font-sans">
        <FiShield className="w-5 h-5 text-[#d99a3d] flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <div>
            <strong style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#241b15] uppercase tracking-wide mr-1">
              {bi('Vendor Content Policy & Guidelines:', 'विक्रेता सामग्री नीति और दिशानिर्देश:')}
            </strong>
            <span>
              {bi(
                'Only genuine business-related reels and images (products, services, shop promotions, and offers) can be posted by vendors. Any unrelated content (such as comedy clips, TV serials, cartoons, memes, or non-business activities) will be blocked and removed by the admin.',
                'विक्रेताओं द्वारा केवल वास्तविक व्यवसाय-संबंधित रील्स और चित्र (उत्पाद, सेवाएं, दुकान के प्रचार और ऑफ़र) पोस्ट किए जा सकते हैं। किसी भी असंबद्ध सामग्री (जैसे कॉमेडी क्लिप, टीवी धारावाहिक, कार्टून, मीम्स, या गैर-व्यावसायिक गतिविधियों) को एडमिन द्वारा ब्लॉक और हटा दिया जाएगा।'
              )}
            </span>
          </div>
          <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1 mt-0.5">
            <span>{bi('⚠️ Posting vulgar, violent, threatening, blackmail, or any criminal material is strictly forbidden and will result in immediate vendor account blacklisting along with legal action.', '⚠️ अश्लील, हिंसक, धमकी भरी, ब्लैकमेल या किसी भी आपराधिक सामग्री को पोस्ट करना सख्त मना है और इसके परिणामस्वरूप तुरंत विक्रेता खाता ब्लैकलिस्ट किया जाएगा और कानूनी कार्रवाई होगी।')}</span>
          </p>
        </div>
      </div>

      <AdminPageHeader
        icon={FiVideo}
        title={bi('Service Reels Studio', 'सर्विस रील्स स्टूडियो (Reels Studio)')}
        subtitle={`${bi('Live catalog', 'लाइव कैटलॉग')} (${reelsList.length} ${bi('total posts', 'कुल पोस्ट')}) • ${publishedCount} ${bi('Published', 'प्रकाशित')} • ${scheduledCount} ${bi('Scheduled', 'निर्धारित')} • ${draftCount} ${bi('Drafts', 'ड्राफ्ट')} • ${reelsList.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()} ${bi('Total Views', 'कुल देखा गया')}`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPostModal(true)}
            className="px-4.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
          >
            <FiPlus size={15} /> <span className="hidden sm:inline">{bi('CREATE REEL / POST', '+ रील / पोस्ट बनाएं')}</span><span className="sm:hidden">{bi('CREATE REEL', '+ रील बनाएं')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendor/hire-creator')}
            className="px-4.5 py-2.5 rounded-full bg-[#2b2d36] text-white border border-white/12 font-bold text-xs shadow-md hover:bg-[#353844] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiUserCheck size={15} /> <span className="hidden sm:inline">{bi('HIRE CREATOR', 'क्रिएटर हायर करें')}</span><span className="sm:hidden">{bi('HIRE', 'हायर')}</span>
          </button>
        </div>
      </AdminPageHeader>

      {/* REAL-TIME REEL CATALOG STATS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-sans">
        <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] text-center space-y-1 shadow-2xs">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest block">{bi('TOTAL REELS', 'कुल रील्स')}</span>
          <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] block">{reelsList.length}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{bi('Catalog Posts', 'कैटलॉग पोस्ट')}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] text-center space-y-1 shadow-2xs">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest block">{bi('PUBLISHED', 'प्रकाशित')}</span>
          <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-emerald-700 block">{publishedCount}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{bi('Live Feed', 'लाइव फीड')}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] text-center space-y-1 shadow-2xs">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest block">{bi('SCHEDULED', 'निर्धारित')}</span>
          <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-blue-700 block">{scheduledCount}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{bi('Upcoming', 'आगामी')}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] text-center space-y-1 shadow-2xs">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest block">{bi('DRAFTS', 'ड्राफ्ट')}</span>
          <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-amber-700 block">{draftCount}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{bi('Saved Drafts', 'सहेजे गए ड्राफ्ट')}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] text-center space-y-1 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-widest block">{bi('TOTAL VIEWS', 'कुल देखा गया')}</span>
          <span style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#241b15] block">{reelsList.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-500 font-bold block">{bi('Customer Views', 'ग्राहक दृश्य')}</span>
        </div>
      </div>

      <AdminTabBar tabs={dynamicTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Reels Grid */}
      {isFetching && !reelsList.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 bg-[#f8f4ec] animate-pulse rounded-2xl border border-[#e3dccb]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-500 font-bold border border-[#e3dccb] font-sans shadow-2xs">
          No {activeTab} reels found. Click "CREATE REEL / POST" to publish your first content!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {filtered.map((reel) => (
            <div key={reel._id || reel.id} className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs hover:shadow-md transition-all overflow-hidden">
              <ReelCardMediaCarousel reel={reel} />

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs text-[#1a1a1a] line-clamp-2 uppercase">{reel.caption || reel.title || 'Service Reel'}</h4>
                  <div className="flex items-center gap-1">
                    {reel.isBoosted && (
                      <span className="bg-[#241b15] text-[#d99a3d] border border-[#241b15] px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5" title={`Boost active until ${new Date(reel.boostExpiresAt).toLocaleDateString()}`}>
                        <FiZap size={11} className="fill-[#d99a3d]" />
                        Boosted
                      </span>
                    )}
                    {!reel.isBoosted && reel.status === 'published' && (
                      <button
                        type="button"
                        onClick={() => handleOpenBoostModal(reel)}
                        className="p-1.5 rounded-lg hover:bg-[#f8f4ec] text-slate-500 hover:text-[#d99a3d] transition flex-shrink-0 flex items-center gap-1 cursor-pointer"
                        title="Boost Reel"
                      >
                        <FiZap size={15} />
                        <span className="text-[10px] font-black">Boost</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel._id || reel.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition flex-shrink-0 cursor-pointer"
                      title="Delete Reel"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#f8f4ec] text-[#241b15] border border-[#e3dccb]">
                    {reel.category || 'Service'} • {reel.subcategory || 'General'}
                  </span>
                  {reel.promotionArea && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                      📍 {reel.promotionArea}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-[#e3dccb] pt-2">
                  <span className="flex items-center gap-1"><FiEye size={13} /> {reel.views !== undefined ? reel.views.toLocaleString() : 0}</span>
                  <span className="flex items-center gap-1"><FiHeart size={13} className="text-rose-600" /> {reel.likesCount || 0}</span>
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
        thumbnailUrl={thumbnailUrl}
        setThumbnailUrl={setThumbnailUrl}
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

      {/* MODAL 3: BOOST REEL */}
      <ReelBoostModal
        isOpen={showBoostModal}
        onClose={() => {
          setShowBoostModal(false);
          setSelectedReelForBoost(null);
        }}
        reel={selectedReelForBoost}
        refetchReels={refetch}
      />

      {/* MODAL 4: UNBOOSTED REEL PROMOTION PROMPT */}
      <ReelBoostPromptModal
        isOpen={showBoostPromptModal}
        onClose={handleDismissBoostPrompt}
        unboostedReels={unboostedPublishedReels}
        onSelectReelToBoost={handleSelectReelToBoostFromPrompt}
      />
    </div>
  );
}
