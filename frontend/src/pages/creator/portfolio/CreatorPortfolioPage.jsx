import React, { useState } from 'react';
import { FiFilm, FiImage, FiPlus, FiTrash2, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatorPortfolioPage() {
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' | 'images'

  const [sampleReels, setSampleReels] = useState([
    { id: '1', title: 'Fashion Brand Commercial Reel', views: '45.2K', url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4' },
    { id: '2', title: 'Smart Watch Unboxing Video Ad', views: '28.9K', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4' }
  ]);

  const [sampleImages, setSampleImages] = useState([
    { id: '1', title: 'Jewellery Model Photoshoot', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
    { id: '2', title: 'Furniture Store Ad Shoot', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' }
  ]);

  const handleUploadReel = () => {
    if (sampleReels.length >= 10) {
      toast.error('Maximum limit of 10 sample reels reached');
      return;
    }
    toast.success('Sample reel added to portfolio!');
  };

  const handleUploadImage = () => {
    if (sampleImages.length >= 50) {
      toast.error('Maximum limit of 50 portfolio images reached');
      return;
    }
    toast.success('Portfolio image added!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiFilm className="text-purple-400" />
            <span>Creator Work Portfolio</span>
          </h2>
          <p className="text-xs text-slate-400">Showcase sample reels (Max 10) and high-res shoot images (Max 50) for vendor hires</p>
        </div>

        <button
          onClick={activeTab === 'reels' ? handleUploadReel : handleUploadImage}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
        >
          <FiPlus size={16} />
          <span>Upload {activeTab === 'reels' ? 'Sample Reel (Max 10)' : 'Image (Max 50)'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'reels' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FiFilm size={15} />
          <span>Sample Reels ({sampleReels.length} / 10)</span>
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs border-b-2 transition ${
            activeTab === 'images' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FiImage size={15} />
          <span>Shoot Images ({sampleImages.length} / 50)</span>
        </button>
      </div>

      {/* Grid */}
      {activeTab === 'reels' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleReels.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3">
              <div className="aspect-[9/16] bg-black">
                <video src={r.url} muted autoPlay loop playsInline className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">{r.title}</h4>
                  <span className="text-[10px] text-slate-400">{r.views} Views</span>
                </div>
                <button onClick={() => setSampleReels(sampleReels.filter(item => item.id !== r.id))} className="text-rose-400 p-1.5 bg-rose-500/10 rounded-lg">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sampleImages.map((img) => (
            <div key={img.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-2">
              <div className="aspect-square bg-slate-950">
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <h4 className="font-bold text-xs text-white truncate">{img.title}</h4>
                <button onClick={() => setSampleImages(sampleImages.filter(item => item.id !== img.id))} className="text-rose-400 p-1 bg-rose-500/10 rounded-lg">
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
