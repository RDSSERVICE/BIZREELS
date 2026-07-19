import React, { useState } from 'react';
import { FiFilm, FiImage, FiPlus, FiTrash2, FiVideo, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminModal from '../../../features/admin/components/AdminModal';
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
  const [showModal, setShowModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const { data, isFetching } = useGetCreatorPortfolioQuery(undefined, { pollingInterval: 5000 });
  const [uploadReel, { isLoading: isUploadingReel }] = useUploadPortfolioReelMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadPortfolioImageMutation();
  const [deleteItem] = useDeletePortfolioItemMutation();

  const sampleReels = Array.isArray(data?.reels) ? data.reels : [];
  const sampleImages = Array.isArray(data?.images) ? data.images : [];

  const handleOpenUploadModal = () => {
    if (activeTab === 'reels' && sampleReels.length >= 10) {
      return toast.error('Maximum limit of 10 sample reels reached');
    }
    if (activeTab === 'images' && sampleImages.length >= 50) {
      return toast.error('Maximum limit of 50 portfolio images reached');
    }
    setTitleInput('');
    setUrlInput('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      return toast.error('Please enter a title for your portfolio item');
    }

    try {
      if (activeTab === 'reels') {
        const videoUrl = urlInput.trim() || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4';
        await uploadReel({ title: titleInput.trim(), videoUrl }).unwrap();
        toast.success('Sample reel added to portfolio!');
      } else {
        const imageUrl = urlInput.trim() || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80';
        await uploadImage({ title: titleInput.trim(), url: imageUrl }).unwrap();
        toast.success('Portfolio shoot image added!');
      }
      setShowModal(false);
      setTitleInput('');
      setUrlInput('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload portfolio item');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to remove this item from your portfolio?')) return;
    try {
      await deleteItem({ type, id }).unwrap();
      toast.success('Item removed from portfolio');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove item');
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
          onClick={handleOpenUploadModal}
          className="px-4 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
        >
          <FiPlus size={16} />
          <span>Upload {activeTab === 'reels' ? 'Sample Reel (Max 10)' : 'Shoot Image (Max 50)'}</span>
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {isFetching && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      ) : activeTab === 'reels' ? (
        sampleReels.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border space-y-3">
            <FiVideo className="w-10 h-10 text-brand-purple mx-auto opacity-60" />
            <p className="font-bold text-text-primary text-sm">No sample reels added yet</p>
            <p className="text-xs text-text-tertiary max-w-md mx-auto">Click "Upload Sample Reel" to add video samples to your creator profile.</p>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition"
            >
              Add Your First Sample Reel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleReels.map((r) => (
              <div key={r.id || r._id} className="glass rounded-2xl overflow-hidden border border-white/50 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
                <div className="aspect-[9/16] bg-black relative">
                  <video src={r.url} controls muted loop playsInline className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">{r.title}</h4>
                    <span className="text-[10px] text-text-tertiary">{r.views}</span>
                  </div>
                  <button
                    onClick={() => handleDelete('reels', r.id || r._id)}
                    className="text-error p-1.5 bg-error/10 hover:bg-error/20 rounded-lg transition"
                    title="Remove"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        sampleImages.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-xs text-text-tertiary border border-border space-y-3">
            <FiImage className="w-10 h-10 text-brand-orange mx-auto opacity-60" />
            <p className="font-bold text-text-primary text-sm">No shoot images added yet</p>
            <p className="text-xs text-text-tertiary max-w-md mx-auto">Click "Upload Shoot Image" to add portfolio photos for vendors.</p>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition"
            >
              Add Your First Shoot Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleImages.map((img) => (
              <div key={img.id || img._id} className="glass rounded-2xl overflow-hidden border border-white/50 shadow-card hover:shadow-card-hover transition-all space-y-2">
                <div className="aspect-square bg-surface-tertiary">
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-text-primary truncate">{img.title}</h4>
                  <button
                    onClick={() => handleDelete('images', img.id || img._id)}
                    className="text-error p-1.5 bg-error/10 hover:bg-error/20 rounded-lg transition"
                    title="Remove"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Upload Modal Form */}
      <AdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={activeTab === 'reels' ? 'Upload Sample Reel' : 'Upload Portfolio Shoot Image'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              Title / Caption *
            </label>
            <input
              type="text"
              required
              placeholder={activeTab === 'reels' ? 'e.g. Neon Fashion Model Shoot Reel' : 'e.g. Traditional Jewelry Shoot'}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              {activeTab === 'reels' ? 'Video File URL' : 'Image File URL'}
            </label>
            <input
              type="url"
              placeholder={activeTab === 'reels' ? 'https://... (mp4 video url or leave empty for sample demo video)' : 'https://... (image url or leave empty for sample photo)'}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
            />
            <span className="text-[10px] text-text-tertiary mt-1 block">
              Tip: Paste an MP4 or image URL from Cloudinary/Unsplash or leave empty to use a demo asset.
            </span>
          </div>

          <button
            type="submit"
            disabled={isUploadingReel || isUploadingImage}
            className="w-full py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-premium"
          >
            <FiUploadCloud size={16} />
            <span>{isUploadingReel || isUploadingImage ? 'Uploading...' : `Upload to ${activeTab === 'reels' ? 'Reels' : 'Images'} Portfolio`}</span>
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
