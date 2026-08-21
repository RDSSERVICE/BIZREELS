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
import { api } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorPortfolioPage() {
  const { bi } = useLanguage();
  const [activeTab, setActiveTab] = useState('reels');
  const [showModal, setShowModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'link'
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  const TABS = [
    { key: 'reels', label: bi('Sample Reels', 'सैंपल रील्स'), icon: FiFilm },
    { key: 'images', label: bi('Shoot Images', 'शूट फोटो'), icon: FiImage },
  ];

  const { data, isFetching } = useGetCreatorPortfolioQuery(undefined, { pollingInterval: 300000 });
  const [uploadReel, { isLoading: isUploadingReel }] = useUploadPortfolioReelMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadPortfolioImageMutation();
  const [deleteItem] = useDeletePortfolioItemMutation();

  const sampleReels = Array.isArray(data?.reels) ? data.reels : [];
  const sampleImages = Array.isArray(data?.images) ? data.images : [];

  const handleOpenUploadModal = () => {
    if (activeTab === 'reels' && sampleReels.length >= 10) {
      return toast.error(bi('Maximum limit of 10 sample reels reached', 'अधिकतम 10 सैंपल रील्स की सीमा समाप्त'));
    }
    if (activeTab === 'images' && sampleImages.length >= 50) {
      return toast.error(bi('Maximum limit of 50 portfolio images reached', 'अधिकतम 50 पोर्टफोलियो फोटो की सीमा समाप्त'));
    }
    setTitleInput('');
    setUrlInput('');
    setFileToUpload(null);
    setUploadMode('file');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      return toast.error(bi('Please enter a title for your portfolio item', 'कृपया शीर्षक दर्ज करें'));
    }

    if (uploadMode === 'file' && !fileToUpload) {
      return toast.error(bi('Please select a file to upload', 'कृपया अपलोड के लिए फ़ाइल चुनें'));
    }

    setUploading(true);
    const toastId = toast.loading(bi('Uploading portfolio item...', 'फ़ाइल अपलोड हो रही है...'));

    try {
      let finalUrl = '';
      if (uploadMode === 'file') {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('folder', 'listings/misc');
        formData.append('resource_type', activeTab === 'reels' ? 'video' : 'image');

        const uploadRes = await api.post('/v1/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        finalUrl = uploadRes.data?.secure_url || uploadRes.data?.url;
        if (!finalUrl) {
          throw new Error('Upload succeeded but did not return a valid URL.');
        }
      } else {
        finalUrl = urlInput.trim() || (activeTab === 'reels' 
          ? 'https://res.cloudinary.com/demo/video/upload/v1689234567/sample.mp4' 
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop');
      }

      if (activeTab === 'reels') {
        await uploadReel({ title: titleInput, url: finalUrl }).unwrap();
      } else {
        await uploadImage({ title: titleInput, url: finalUrl }).unwrap();
      }

      toast.success(bi('Portfolio item uploaded!', 'पोर्टफोलियो आइटम सफलतापूर्वक अपलोड हुआ!'), { id: toastId });
      setShowModal(false);
      setTitleInput('');
      setUrlInput('');
      setFileToUpload(null);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err?.data?.message || err?.message || bi('Failed to upload item', 'अपलोड विफल रहा'), { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm(bi('Are you sure you want to remove this item?', 'क्या आप निश्चित रूप से इसे हटाना चाहते हैं?'))) return;
    const toastId = toast.loading(bi('Removing item...', 'हटाया जा रहा है...'));
    try {
      await deleteItem({ type, itemId }).unwrap();
      toast.success(bi('Item removed!', 'आइटम हटा दिया गया!'), { id: toastId });
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(bi('Failed to remove item', 'आइटम हटाना विफल रहा'), { id: toastId });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16 font-sans">
      <AdminPageHeader
        icon={FiFilm}
        title={bi('Creator Portfolio & Work Samples', 'क्रिएटर पोर्टफोलियो और कार्य नमूने (Portfolio)')}
        subtitle={bi('Showcase your sample video reels and professional shoot images to attract brand sponsorships', 'ब्रांड स्पॉन्सरशिप आकर्षित करने के लिए अपनी सैंपल वीडियो रील्स और तस्वीरें दिखाएं')}
      >
        <button
          onClick={handleOpenUploadModal}
          className="px-4 py-2.5 bg-[#241b15] text-[#d99a3d] rounded-xl text-xs font-black hover:bg-[#342820] transition shadow-2xs flex items-center gap-2 cursor-pointer border-none"
        >
          <FiPlus size={16} />
          <span>{activeTab === 'reels' ? bi('Upload Sample Reel (Max 10)', 'सैंपल रील अपलोड करें (अधिकतम 10)') : bi('Upload Shoot Image (Max 50)', 'शूट फोटो अपलोड करें (अधिकतम 50)')}</span>
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
            <p className="font-bold text-text-primary text-sm">{bi('No sample reels added yet', 'अभी तक कोई सैंपल रील नहीं जोड़ी गई है')}</p>
            <p className="text-xs text-text-tertiary max-w-md mx-auto">{bi('Click "Upload Sample Reel" to add video samples to your creator profile.', 'अपनी क्रिएटर प्रोफ़ाइल में वीडियो नमूने जोड़ने के लिए "सैंपल रील अपलोड करें" पर क्लिक करें।')}</p>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition"
            >
              {bi('Add Your First Sample Reel', 'अपनी पहली सैंपल रील जोड़ें')}
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
                    title={bi('Remove', 'हटाएं')}
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
            <p className="font-bold text-text-primary text-sm">{bi('No shoot images added yet', 'अभी तक कोई फोटो नहीं जोड़ी गई है')}</p>
            <p className="text-xs text-text-tertiary max-w-md mx-auto">{bi('Click "Upload Shoot Image" to add portfolio photos for vendors.', 'विक्रेताओं के लिए पोर्टफोलियो फोटो जोड़ने के लिए "शूट फोटो अपलोड करें" पर क्लिक करें।')}</p>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-md hover:opacity-90 transition"
            >
              {bi('Add Your First Shoot Image', 'अपनी पहली फोटो जोड़ें')}
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
                    title={bi('Remove', 'हटाएं')}
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
        title={activeTab === 'reels' ? bi('Upload Sample Reel', 'सैंपल रील अपलोड करें') : bi('Upload Portfolio Shoot Image', 'पोर्टफोलियो फोटो अपलोड करें')}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-surface-secondary rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${uploadMode === 'file' ? 'bg-brand-purple text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {bi('Upload Local File', 'लोकल फ़ाइल अपलोड करें')}
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('link')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${uploadMode === 'link' ? 'bg-brand-purple text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {bi('External Link', 'बाहरी यूआरएल लिंक')}
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              {bi('Title / Caption *', 'शीर्षक / विवरण *')}
            </label>
            <input
              type="text"
              required
              placeholder={activeTab === 'reels' ? bi('e.g. Neon Fashion Model Shoot Reel', 'उदा. फैशन मॉडल शूट रील') : bi('e.g. Traditional Jewelry Shoot', 'उदा. ज्वेलरी शूट फोटो')}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          {uploadMode === 'file' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                {bi('Select File *', 'फ़ाइल चुनें *')}
              </label>
              <div className="border-2 border-dashed border-border hover:border-brand-purple rounded-xl p-6 text-center cursor-pointer relative bg-surface-secondary/40 transition">
                <input
                  type="file"
                  required
                  accept={activeTab === 'reels' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FiUploadCloud size={24} className="mx-auto text-text-tertiary mb-2" />
                {fileToUpload ? (
                  <p className="text-xs font-bold text-brand-purple truncate px-2">{fileToUpload.name}</p>
                ) : (
                  <>
                    <p className="text-xs font-bold text-text-secondary">{bi('Click to choose a file', 'फ़ाइल चुनने के लिए क्लिक करें')}</p>
                    <p className="text-[9px] text-text-tertiary mt-1">{bi('Max size: ', 'अधिकतम आकार: ')}{activeTab === 'reels' ? '50MB' : '10MB'}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                {activeTab === 'reels' ? bi('Video File URL', 'वीडियो फ़ाइल यूआरएल') : bi('Image File URL', 'इमेज फ़ाइल यूआरएल')}
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || isUploadingReel || isUploadingImage}
            className="w-full py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-premium"
          >
            <FiUploadCloud size={16} />
            <span>{uploading || isUploadingReel || isUploadingImage ? bi('Uploading...', 'अपलोड हो रहा है...') : bi('Upload to Portfolio', 'पोर्टफोलियो में सबमिट करें')}</span>
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
