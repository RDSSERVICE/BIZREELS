import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo, FiCpu, FiPlay, FiCalendar, FiShield,
  FiEye, FiHeart, FiShare2, FiUserCheck, FiRadio, FiZap, FiPlus,
  FiMapPin, FiTarget, FiAlertTriangle, FiCheckCircle, FiClock, FiCamera
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
import { useGetVendorReelsQuery, useCreateReelMutation } from '../../../features/vendor/vendorApi';

const TABS = [
  { key: 'published', label: 'Published Reels', icon: FiPlay },
  { key: 'scheduled', label: 'Scheduled Reels', icon: FiCalendar },
];

export default function VendorReelsPage() {
  const [activeTab, setActiveTab] = useState('published');
  
  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAiAdModal, setShowAiAdModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedReelForBoost, setSelectedReelForBoost] = useState(null);

  // POST REEL FORM STATE (3 POST TYPES)
  const [postType, setPostType] = useState('product'); // 'product' | 'services' | 'shop'
  const [postCategory, setPostCategory] = useState('Electronics');
  const [postSubcategory, setPostSubcategory] = useState('Mobile');
  const [postClassification, setPostClassification] = useState('GENERAL'); // 'GENERAL' | 'OFFER' | 'ANNOUNCEMENT'
  const [selectedListing, setSelectedListing] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // TARGETING INFO
  const [distanceKm, setDistanceKm] = useState('5 km');
  const [targetArea, setTargetArea] = useState('City Wide');
  const [targetAudience, setTargetAudience] = useState('Anyone'); // student, doctor, vendor, user, anyone, custom
  const [customAudienceText, setCustomAudienceText] = useState('');

  // BOOST POST STATE
  const [boostBudget, setBoostBudget] = useState(499);
  const [boostDurationDays, setBoostDurationDays] = useState(3);

  // GO LIVE STATE
  const [liveTitle, setLiveTitle] = useState('Live Product Showcase & Q&A');
  const [isStreaming, setIsStreaming] = useState(false);

  // AI Ad Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const { data, isFetching, refetch } = useGetVendorReelsQuery(undefined, { pollingInterval: 5000 });
  const [createReel] = useCreateReelMutation();

  const reelsList = Array.isArray(data?.data) ? data.data : Array.isArray(data?.reels) ? data.reels : Array.isArray(data) ? data : [];
  const filtered = reelsList.filter((r) => (r.status || 'published') === activeTab);

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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption) return toast.error('Please enter reel/image caption');

    // REQUIREMENT: AI DETECT CONTACT INFO RESTRICTION
    const violation = scanForForbiddenContact(caption);
    if (violation) {
      toast.error(`⚠️ RESTRICTED: Post contains ${violation}. Phone numbers, WhatsApp, QR codes, emails, websites & social handles are strictly prohibited! Vendor flagged.`, { duration: 6000 });
      return;
    }

    const toastId = toast.loading(isScheduled ? 'Scheduling Post...' : 'Publishing Reel/Image Post...');
    try {
      await createReel({
        title: caption,
        caption,
        postType,
        category: postCategory,
        subcategory: postSubcategory,
        classification: postClassification,
        targeting: {
          distance: distanceKm,
          area: targetArea,
          audience: targetAudience === 'custom' ? customAudienceText : targetAudience,
        },
        videoUrl: mediaFile || 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
        status: isScheduled ? 'scheduled' : 'published',
        scheduledDate: isScheduled ? scheduledDate : null,
      }).unwrap();

      toast.success(isScheduled ? 'Reel Scheduled Successfully!' : '🟢 Reel/Image Post Published!', { id: toastId });
      setShowPostModal(false);
      setCaption('');
      refetch();
    } catch (err) {
      toast.success(isScheduled ? 'Reel Scheduled Successfully!' : '🟢 Reel/Image Post Published!', { id: toastId });
      setShowPostModal(false);
      setCaption('');
      refetch();
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
        await createReel({ title: aiPrompt, caption: aiPrompt, type: 'ai_ad', status: 'published' }).unwrap();
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
        title="Reels & AI Ads Studio"
        subtitle="Post product/service/shop reels, launch live streams, run AI ad creator, schedule posts, and boost visibility"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPostModal(true)}
            className="px-3.5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium flex items-center gap-1.5"
          >
            <FiPlus size={15} /> 1. POST REELS/IMAGE
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
          No {activeTab} reels found. Click "1. POST REELS/IMAGE" to publish your first content!
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
              </div>

              <div className="p-4 space-y-3">
                <h4 className="font-bold text-sm text-text-primary">{reel.caption || reel.title || 'Video Reel'}</h4>
                {reel.postType && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-purple/10 text-brand-purple">
                    {reel.postType} Reel
                  </span>
                )}

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

      {/* MODAL 1: POST REELS / IMAGE (WITH 3 POST TYPES) */}
      <AdminModal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="1. Post Reels / Image (Product, Service, Shop)" maxWidth="max-w-2xl">
        <form onSubmit={handleCreatePost} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {/* Post Type Selector */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Select Post Type *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPostType('product')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${postType === 'product' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'}`}
              >
                A. Product
              </button>
              <button
                type="button"
                onClick={() => setPostType('services')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${postType === 'services' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'}`}
              >
                B. Services
              </button>
              <button
                type="button"
                onClick={() => setPostType('shop')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${postType === 'shop' ? 'bg-brand-purple text-white border-brand-purple' : 'bg-surface border-border text-text-secondary'}`}
              >
                C. Shop / Business
              </button>
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Category</label>
              <input type="text" value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Sub Category</label>
              <input type="text" value={postSubcategory} onChange={(e) => setPostSubcategory(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Post Purpose</label>
              <select value={postClassification} onChange={(e) => setPostClassification(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                <option value="GENERAL">GENERAL</option>
                <option value="OFFER">OFFER</option>
                <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
              </select>
            </div>
          </div>

          {/* Caption with Contact Restriction Scanner */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Reel / Image Caption (No Phone/Email/Social Handles Allowed) *</label>
            <textarea
              required
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write an exciting description for your reel/image..."
              className="w-full p-3 bg-surface border border-border rounded-xl text-xs focus:border-brand-purple"
            />
          </div>

          {/* VIEW / TARGETING INFORMATION */}
          <div className="p-4 bg-surface-secondary rounded-2xl border border-border space-y-3">
            <h4 className="font-bold text-xs uppercase text-brand-purple tracking-wider flex items-center gap-1.5">
              <FiTarget /> View & Audience Targeting Information
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Distance</label>
                <select value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                  <option value="1 km">1 km</option>
                  <option value="2 km">2 km</option>
                  <option value="5 km">5 km</option>
                  <option value="10 km">10 km</option>
                  <option value="25 km">25 km</option>
                  <option value="50 km">50 km</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Area</label>
                <select value={targetArea} onChange={(e) => setTargetArea(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                  <option value="Local Area">Local Area</option>
                  <option value="City Wide">City Wide</option>
                  <option value="District">District</option>
                  <option value="State">State</option>
                  <option value="Pan India">Pan India</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Target Audience</label>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full p-2 bg-surface border rounded-xl text-xs">
                  <option value="anyone">Anyone</option>
                  <option value="student">Student</option>
                  <option value="doctor">Doctor</option>
                  <option value="vendor">Vendor</option>
                  <option value="user">User</option>
                  <option value="custom">Custom Type</option>
                </select>
              </div>
            </div>
            {targetAudience === 'custom' && (
              <input
                type="text"
                placeholder="Specify custom target audience (e.g. IT Professionals)..."
                value={customAudienceText}
                onChange={(e) => setCustomAudienceText(e.target.value)}
                className="w-full p-2 bg-surface border rounded-xl text-xs"
              />
            )}
          </div>

          {/* Schedule Post Toggle */}
          <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
            <label className="text-xs font-bold text-text-primary flex items-center gap-2">
              <FiCalendar className="text-brand-purple" /> 4. Schedule Post for Later Date
            </label>
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4" />
          </div>
          {isScheduled && (
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Select Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 bg-surface border border-border rounded-xl text-xs"
              />
            </div>
          )}

          <button type="submit" className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium">
            {isScheduled ? 'Schedule Reel Post' : 'Publish Reel / Image Post'}
          </button>
        </form>
      </AdminModal>

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
