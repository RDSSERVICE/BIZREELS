import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import { FiPlus, FiTrash2, FiVideo, FiImage, FiFileText, FiLink, FiInfo } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const CreatorPortfolioTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [reels, setReels] = useState(
    user?.creatorProfile?.sampleReels?.length > 0
      ? user.creatorProfile.sampleReels.map((r, i) => ({ id: i.toString(), ...r }))
      : [
          { id: '1', title: 'Street Fashion walk lookbook', url: 'https://example.com/reel1.mp4' },
          { id: '2', title: 'Tech smartphone unboxing edit', url: 'https://example.com/reel2.mp4' }
        ]
  );
  const [images, setImages] = useState(
    user?.creatorProfile?.sampleImages?.length > 0
      ? user.creatorProfile.sampleImages.map((img, i) => ({ id: i.toString(), ...img }))
      : [
          { id: 'img-1', title: 'Brand styling photoshoot #1', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
          { id: 'img-2', title: 'Cafe ambience interior portfolio', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400' }
        ]
  );
  const [previousWork, setPreviousWork] = useState(
    user?.creatorProfile?.previousWork?.length > 0
      ? user.creatorProfile.previousWork.map((w, i) => ({ id: i.toString(), ...w }))
      : [
          { id: 'pw-1', brand: 'Electra Inc.', result: '40K views conversion campaign' }
        ]
  );

  // Form states
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newImgTitle, setNewImgTitle] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newResult, setNewResult] = useState('');

  const savePortfolioLists = async (updatedReels, updatedImages, updatedWork) => {
    try {
      const res = await updateProfileApi({
        creatorProfile: {
          sampleReels: updatedReels.map(r => ({ title: r.title, url: r.url })),
          sampleImages: updatedImages.map(i => ({ title: i.title, url: i.url })),
          previousWork: updatedWork.map(w => ({ brand: w.brand, result: w.result }))
        }
      }).unwrap();
      dispatch(updateUser(res.data.user));
    } catch (e) {
      toast.error('Failed to sync updates with database.');
    }
  };

  const handleAddReel = async (e) => {
    e.preventDefault();
    if (reels.length >= 10) {
      return toast.error('Maximum limit of 10 sample reels reached.');
    }
    if (!newReelTitle || !newReelUrl) return;
    const updated = [...reels, { id: Date.now().toString(), title: newReelTitle, url: newReelUrl }];
    setReels(updated);
    setNewReelTitle('');
    setNewReelUrl('');
    toast.success('Sample Reel added to portfolio.');
    await savePortfolioLists(updated, images, previousWork);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (images.length >= 50) {
      return toast.error('Maximum limit of 50 images reached.');
    }
    if (!newImgTitle || !newImgUrl) return;
    const updated = [...images, { id: Date.now().toString(), title: newImgTitle, url: newImgUrl }];
    setImages(updated);
    setNewImgTitle('');
    setNewImgUrl('');
    toast.success('Sample Image added to portfolio.');
    await savePortfolioLists(reels, updated, previousWork);
  };

  const handleAddPreviousWork = async (e) => {
    e.preventDefault();
    if (!newBrand || !newResult) return;
    const updated = [...previousWork, { id: Date.now().toString(), brand: newBrand, result: newResult }];
    setPreviousWork(updated);
    setNewBrand('');
    setNewResult('');
    toast.success('Previous work history added.');
    await savePortfolioLists(reels, images, updated);
  };

  const handleDeleteItem = async (listName, itemId) => {
    let updatedReels = reels;
    let updatedImages = images;
    let updatedWork = previousWork;

    if (listName === 'reels') {
      updatedReels = reels.filter(r => r.id !== itemId);
      setReels(updatedReels);
    }
    if (listName === 'images') {
      updatedImages = images.filter(i => i.id !== itemId);
      setImages(updatedImages);
    }
    if (listName === 'work') {
      updatedWork = previousWork.filter(w => w.id !== itemId);
      setPreviousWork(updatedWork);
    }
    toast.success('Item removed from portfolio preview.');
    await savePortfolioLists(updatedReels, updatedImages, updatedWork);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Reels Catalog */}
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <FiVideo className="text-brand-purple" /> Sample Reels ({reels.length} / 10)
            </h4>
          </div>

          <form onSubmit={handleAddReel} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Sample Video Title"
              value={newReelTitle}
              onChange={(e) => setNewReelTitle(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Video URL"
                value={newReelUrl}
                onChange={(e) => setNewReelUrl(e.target.value)}
                className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-purple text-white hover:bg-brand-purple-800 text-xs font-bold rounded-xl shadow-premium cursor-pointer transition-colors whitespace-nowrap"
              >
                Add Reel
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2 mt-2">
            {reels.map((reel) => (
              <div key={reel.id} className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex justify-between items-center text-xs">
                <span className="font-semibold text-brand-navy truncate max-w-[200px]">{reel.title}</span>
                <div className="flex items-center gap-2">
                  <a href={reel.url} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline font-bold">
                    View
                  </a>
                  <button type="button" onClick={() => handleDeleteItem('reels', reel.id)} className="text-red-500 hover:text-red-700">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Photos Showcase */}
        <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <FiImage className="text-brand-pink" /> Portfolio Images ({images.length} / 50)
            </h4>
          </div>

          <form onSubmit={handleAddImage} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Photo Description"
              value={newImgTitle}
              onChange={(e) => setNewImgTitle(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Image URL"
                value={newImgUrl}
                onChange={(e) => setNewImgUrl(e.target.value)}
                className="flex-grow p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-pink text-white hover:bg-brand-pink-600 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors whitespace-nowrap"
              >
                Add Image
              </button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 border border-slate-200/50">
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between items-start text-white text-[10px]">
                  <span className="line-clamp-2 font-bold">{img.title}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('images', img.id)}
                    className="p-1 hover:bg-red-500 rounded text-white self-end transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Previous Work History list */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiFileText className="text-brand-orange" /> Previous Work Collaboration Campaigns
        </h4>

        <form onSubmit={handleAddPreviousWork} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Brand Partner Name (e.g. Puma)"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Result Metrices (e.g. 50K Views boost)"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-purple text-white hover:bg-brand-purple-800 text-xs font-bold rounded-xl shadow-premium cursor-pointer transition-colors"
          >
            Add Case Study
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-2">
          {previousWork.map((work) => (
            <div key={work.id} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex justify-between items-center text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-brand-purple">{work.brand}</span>
                <span className="text-slate-500 mt-0.5">{work.result}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem('work', work.id)}
                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorPortfolioTab;
