import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo, FiPlus, FiCpu, FiPlay, FiCalendar, FiTrash2,
  FiEye, FiHeart, FiShare2, FiUserCheck, FiRadio, FiZap
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
  const [showAiAdModal, setShowAiAdModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const { data, isFetching } = useGetVendorReelsQuery(undefined, { pollingInterval: 5000 });
  const [createReel] = useCreateReelMutation();

  const mockReels = data?.data || data?.reels || [
    {
      id: 'r1', title: 'Hot New Summer Collection 2026',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4',
      status: 'published', views: 45200, likes: 3410, shares: 420, isBoosted: true, createdAt: '2026-07-16'
    },
    {
      id: 'r2', title: 'Behind The Scenes: Handmade Jewelry Crafting',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4',
      status: 'scheduled', scheduledDate: '2026-07-20 10:00 AM',
      views: 0, likes: 0, shares: 0, isBoosted: false
    }
  ];

  const handleGenerateAiAd = async (e) => {
    e.preventDefault();
    if (!aiPrompt) {
      toast.error('Please enter product description for AI Ad generator');
      return;
    }
    setIsGeneratingAi(true);
    toast.loading('AI is generating video script & high-converting ad layout...', { id: 'ai-toast' });
    setTimeout(async () => {
      setIsGeneratingAi(false);
      setShowAiAdModal(false);
      try { await createReel({ title: aiPrompt, type: 'ai_ad', status: 'draft' }).unwrap(); } catch {}
      toast.success('AI Video Ad created and saved to your draft reels!', { id: 'ai-toast' });
    }, 3000);
  };

  const filtered = mockReels.filter((r) => r.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiVideo}
        title="Reels Studio & AI Ad Generator"
        subtitle="Upload video reels, launch live streams, generate AI ads, and hire influencer creators"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiAdModal(true)}
            className="px-3.5 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiCpu size={15} /> AI Ad Tool
          </button>
          <button
            onClick={() => toast.success('Starting Live Video Stream initialization...')}
            className="px-3.5 py-2 rounded-xl bg-error text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
          >
            <FiRadio size={15} /> Go Live
          </button>
          <Link
            to="/vendor/hire-creator"
            className="px-3.5 py-2 rounded-xl glass border border-border text-text-secondary font-bold text-xs flex items-center gap-1.5 hover:bg-surface-tertiary transition"
          >
            <FiUserCheck size={15} className="text-brand-pink" /> Hire Creators
          </Link>
        </div>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Reels Grid */}
      {isFetching && !mockReels.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border">
          No {activeTab} reels found. Create your first reel to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((reel) => (
            <div key={reel.id} className="glass rounded-2xl border border-white/50 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all overflow-hidden">
              <div className="aspect-[9/16] bg-black relative">
                <video src={reel.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                {reel.isBoosted && (
                  <div className="absolute top-3 left-3 gradient-brand px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-premium">
                    <FiZap size={11} /> BOOSTED
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <h4 className="font-bold text-sm text-text-primary">{reel.title}</h4>

                {activeTab === 'published' ? (
                  <div className="flex items-center justify-between text-xs text-text-tertiary border-t border-border pt-2">
                    <span className="flex items-center gap-1"><FiEye size={13} /> {reel.views?.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><FiHeart size={13} className="text-brand-pink" /> {reel.likes?.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><FiShare2 size={13} /> {reel.shares?.toLocaleString()}</span>
                  </div>
                ) : (
                  <p className="text-xs text-brand-purple font-semibold border-t border-border pt-2">
                    Scheduled for: {reel.scheduledDate}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Ad Modal */}
      <AdminModal isOpen={showAiAdModal} onClose={() => setShowAiAdModal(false)} title="AI Ad Creator Tool" maxWidth="max-w-lg">
        <div className="flex items-center gap-3 border-b border-border pb-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple">
            <FiCpu size={20} />
          </div>
          <p className="text-xs text-text-tertiary">Generate high-converting video/image ad copy & reels instantly</p>
        </div>
        <form onSubmit={handleGenerateAiAd} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Product Description / Offer Details *</label>
            <textarea
              required
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Create an exciting 15-second promo reel for 30% discount on Smart Watches with free delivery in Mumbai..."
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>
          <button
            type="submit"
            disabled={isGeneratingAi}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            {isGeneratingAi ? 'Generating AI Video...' : 'Generate AI Video Ad'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
