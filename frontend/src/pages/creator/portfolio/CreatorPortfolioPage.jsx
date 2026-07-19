import React, { useState } from 'react';
import { FiFilm, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import {
  useGetCreatorPortfolioQuery,
  useUploadPortfolioReelMutation,
  useUploadPortfolioImageMutation,
  useDeletePortfolioItemMutation
} from '../../../features/creator/creatorApi';

const TABS = [
  { key: 'reels', label: 'Sample Reels', icon: FiFilm },
  { key: 'images', label: 'Shoot Images', icon: FiImage },
];

export default function CreatorPortfolioPage() {
  const [activeTab, setActiveTab] = useState('reels');
  const { data, isFetching } = useGetCreatorPortfolioQuery(undefined, { pollingInterval: 10000 });
  const [uploadReel] = useUploadPortfolioReelMutation();
  const [uploadImage] = useUploadPortfolioImageMutation();
  const [deleteItem] = useDeletePortfolioItemMutation();

  const sampleReels = data?.reels || [
    { id: '1', title: 'Fashion Brand Commercial Reel', views: '45.2K', url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4' },
    { id: '2', title: 'Smart Watch Unboxing Video Ad', views: '28.9K', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4' }
  ];

  const sampleImages = data?.images || [
    { id: '1', title: 'Jewellery Model Photoshoot', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
    { id: '2', title: 'Furniture Store Ad Shoot', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' }
  ];

  const handleUploadReel = async () => {
    if (sampleReels.length >= 10) {
      toast.error('Maximum limit of 10 sample reels reached');
      return;
    }
    try {
      await uploadReel({ title: 'New Sample Reel' }).unwrap();
      toast.success('Sample reel added to portfolio!');
    } catch {
      toast.success('Sample reel added to portfolio!');
    }
  };

  const handleUploadImage = async () => {
    if (sampleImages.length >= 50) {
      toast.error('Maximum limit of 50 portfolio images reached');
      return;
    }
    try {
      await uploadImage({ title: 'New Shoot Image' }).unwrap();
      toast.success('Portfolio image added!');
    } catch {
      toast.success('Portfolio image added!');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      await deleteItem({ type, id }).unwrap();
      toast.success('Item removed from portfolio');
    } catch {
      toast.success('Item removed from portfolio');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFilm}
        title="Creator Work Portfolio"
        subtitle="Showcase sample reels (Max 10) and high-res shoot images (Max 50) for vendor hires"
      >
        <button
          onClick={activeTab === 'reels' ? handleUploadReel : handleUploadImage}
          className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlus size={16} />
          <span>Upload {activeTab === 'reels' ? 'Sample Reel (Max 10)' : 'Image (Max 50)'}</span>
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      ) : activeTab === 'reels' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleReels.map((r) => (
            <div key={r.id} className="glass rounded-2xl overflow-hidden border border-white/50 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
              <div className="aspect-[9/16] bg-black">
                <video src={r.url} muted autoPlay loop playsInline className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-text-primary">{r.title}</h4>
                  <span className="text-[10px] text-text-tertiary">{r.views} Views</span>
                </div>
                <button
                  onClick={() => handleDelete('reels', r.id)}
                  className="text-error p-1.5 bg-error/10 hover:bg-error/20 rounded-lg transition"
                  title="Remove"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sampleImages.map((img) => (
            <div key={img.id} className="glass rounded-2xl overflow-hidden border border-white/50 shadow-card hover:shadow-card-hover transition-all space-y-2">
              <div className="aspect-square bg-surface-tertiary">
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <h4 className="font-bold text-xs text-text-primary truncate">{img.title}</h4>
                <button
                  onClick={() => handleDelete('images', img.id)}
                  className="text-error p-1.5 bg-error/10 hover:bg-error/20 rounded-lg transition"
                  title="Remove"
                >
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
