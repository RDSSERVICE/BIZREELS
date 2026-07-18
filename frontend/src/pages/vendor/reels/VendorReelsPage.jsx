import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo, FiPlus, FiCpu, FiPlay, FiCalendar, FiEdit, FiTrash2,
  FiEye, FiHeart, FiShare2, FiUserCheck, FiRadio, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VendorReelsPage() {
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'scheduled'
  const [showAiAdModal, setShowAiAdModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const mockReels = [
    {
      id: 'r1',
      title: 'Hot New Summer Collection 2026',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4',
      status: 'published',
      views: 45200,
      likes: 3410,
      shares: 420,
      isBoosted: true,
      createdAt: '2026-07-16'
    },
    {
      id: 'r2',
      title: 'Behind The Scenes: Handmade Jewelry Crafting',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4',
      status: 'scheduled',
      scheduledDate: '2026-07-20 10:00 AM',
      views: 0,
      likes: 0,
      shares: 0,
      isBoosted: false
    }
  ];

  const handleGenerateAiAd = (e) => {
    e.preventDefault();
    if (!aiPrompt) {
      toast.error('Please enter product description for AI Ad generator');
      return;
    }

    setIsGeneratingAi(true);
    toast.loading('AI is generating video script & high-converting ad layout...', { id: 'ai-toast' });

    setTimeout(() => {
      setIsGeneratingAi(false);
      setShowAiAdModal(false);
      toast.success('AI Video Ad created and saved to your draft reels!', { id: 'ai-toast' });
    }, 3000);
  };

  const filtered = mockReels.filter((r) => r.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiVideo className="text-pink-400" />
            <span>Reels Studio & AI Ad Generator</span>
          </h2>
          <p className="text-xs text-slate-400">Upload video reels, launch live streams, generate AI ads, and hire influencer creators</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAiAdModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition"
          >
            <FiCpu size={15} />
            <span>AI Ad Tool Generator</span>
          </button>

          <button
            onClick={() => toast.success('Starting Live Video Stream initialization...')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition"
          >
            <FiRadio size={15} />
            <span>Go Live Video</span>
          </button>

          <Link
            to="/vendor/hire-creator"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <FiUserCheck size={15} className="text-pink-400" />
            <span>Hire Creators</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('published')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'published' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FiPlay size={15} />
          <span>Published Reels</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'scheduled' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FiCalendar size={15} />
          <span>Scheduled Reels</span>
        </button>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((reel) => (
          <div key={reel.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3">
            <div className="aspect-[9/16] bg-black relative">
              <video src={reel.videoUrl} muted autoPlay loop playsInline className="w-full h-full object-cover" />
              {reel.isBoosted && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-pink-500 px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-lg">
                  <FiZap size={11} /> BOOSTED
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h4 className="font-bold text-sm text-white">{reel.title}</h4>

              {activeTab === 'published' ? (
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                  <span className="flex items-center gap-1"><FiEye size={13} /> {reel.views}</span>
                  <span className="flex items-center gap-1"><FiHeart size={13} className="text-pink-500" /> {reel.likes}</span>
                  <span className="flex items-center gap-1"><FiShare2 size={13} /> {reel.shares}</span>
                </div>
              ) : (
                <p className="text-xs text-purple-400 font-semibold border-t border-slate-800 pt-2">
                  Scheduled for: {reel.scheduledDate}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Ad Tool Modal */}
      {showAiAdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                <FiCpu size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Ad Creator Tool</h3>
                <p className="text-xs text-slate-400">Generate high-converting video/image ad copy & reels instantly</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAiAd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Description / Offer Details *</label>
                <textarea
                  required
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Create an exciting 15-second promo reel for 30% discount on Smart Watches with free delivery in Mumbai..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiAdModal(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  {isGeneratingAi ? 'Generating AI Video...' : 'Generate AI Video Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
