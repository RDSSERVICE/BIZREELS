import React from 'react';
import { FiCalendar, FiAlertTriangle, FiSend, FiPercent, FiBell, FiTag } from 'react-icons/fi';
import AdminModal from '../../../features/admin/components/AdminModal';

export default function ReelPreviewModal({
  isOpen,
  onClose,
  postType,
  postCategory,
  postSubcategory,
  postPurpose,
  discountPercent,
  couponCode,
  discountValidity,
  announcementTagline,
  caption,
  mediaOption,
  selectedServiceMediaUrls,
  customMediaList,
  customMediaUrl,
  promotionArea,
  selectedTargetAudiences,
  customTargetAudience,
  isScheduled,
  setIsScheduled,
  scheduledDate,
  setScheduledDate,
  isPublishing,
  selectedServiceData,
  selectedProductData,
  onPublish
}) {
  const getMinDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const activeTitle = postType === 'product'
    ? (selectedProductData?.title || caption?.slice(0, 40) || 'Product Promotion')
    : postType === 'services'
      ? (selectedServiceData?.title || caption?.slice(0, 40) || 'Service Promotion')
      : (caption?.slice(0, 40) || 'Shop Promotion');

  const mediaList = (mediaOption === 'service_media' ? selectedServiceMediaUrls : customMediaList) || [];
  const mainMedia = customMediaList?.[0]?.url || customMediaUrl || selectedServiceMediaUrls?.[0];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${postType === 'product' ? 'Product' : postType === 'services' ? 'Service' : 'Shop'} Reel / Post Preview & Publish`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
        
        {/* PREVIEW CARD */}
        <div className="bg-[#2b2d36] rounded-2xl border border-amber-500/25 p-5 space-y-4 text-slate-100">
          
          {/* Header Info */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                {postCategory} → {postSubcategory}
              </span>
              <h3 className="font-extrabold text-base text-white mt-1.5">
                {activeTitle}
              </h3>
            </div>
            <span className="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase shadow-sm">
              {postPurpose}
            </span>
          </div>

          {/* Purpose Extra Info Banner (Offer / Announcement) */}
          {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && discountPercent && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs">
              <FiPercent className="text-emerald-400 flex-shrink-0" size={14} />
              <span className="font-extrabold text-emerald-300">{discountPercent}% OFF</span>
              {couponCode && (
                <span className="flex items-center gap-1 font-mono bg-black/40 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg text-emerald-300 font-bold">
                  <FiTag size={11} /> {couponCode}
                </span>
              )}
              {discountValidity && (
                <span className="text-emerald-300 font-medium">Valid till {new Date(discountValidity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          )}

          {announcementTagline && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs">
              <FiBell className="text-amber-400 flex-shrink-0 mt-0.5" size={14} />
              <span className="font-semibold text-amber-200 leading-snug">{announcementTagline}</span>
            </div>
          )}

          {/* Media & Caption Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative max-h-52 flex items-center justify-center border border-white/15 shadow-md">
                {mainMedia ? (
                  mainMedia.match(/\.(mp4|webm|mov)(\?.*)?$/i) || mainMedia.startsWith('data:video/') ? (
                    <video src={mainMedia} muted autoPlay loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={mainMedia} alt="Post Media" className="w-full h-full object-cover" />
                  )
                ) : (
                  <video src="https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4" muted autoPlay loop className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-extrabold text-amber-300 border border-amber-400/30">
                  📷 {mediaList.length || 1} Media Item(s) Attached
                </div>
              </div>
              {mediaList.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {mediaList.map((item, mIdx) => {
                    const mUrl = typeof item === 'object' ? item.url : item;
                    return (
                      <div key={mIdx} className="w-10 h-10 rounded-lg bg-black border border-amber-500 overflow-hidden flex-shrink-0">
                        {mUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || mUrl.startsWith('data:video/') ? (
                          <video src={mUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={mUrl} alt={`Media ${mIdx}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-amber-300 block mb-1">Caption</span>
                <p className="text-slate-200 bg-[#1c1d22] p-3 rounded-xl border border-white/12 line-clamp-4 leading-relaxed">
                  {caption || 'No caption entered.'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-amber-300 block mb-1">Targeting Summary</span>
                <p className="text-slate-300 font-medium">📍 Area: <span className="font-bold text-white">{promotionArea}</span></p>
                <p className="text-slate-300 font-medium">👥 Audience: <span className="font-bold text-white">{selectedTargetAudiences.join(', ')}</span></p>
                {customTargetAudience && <p className="text-amber-300 font-medium">🏷️ Custom: {customTargetAudience}</p>}
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-[#1c1d22] p-3.5 rounded-2xl text-center border border-white/12">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Reach</span>
              <span className="font-extrabold text-xs text-emerald-400">5,000 - 25,000 Users</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Credit Required</span>
              <span className="font-extrabold text-xs text-amber-400">1 Credit</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Post Validity</span>
              <span className="font-extrabold text-xs text-slate-200">30 Days</span>
            </div>
          </div>
        </div>

        {/* CONFIRMATION MESSAGE */}
        <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-200 flex items-center gap-2.5">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>Publishing this post will consume 1 credit. Do you want to continue?</span>
        </div>

        {/* SCHEDULE OPTION TOGGLE */}
        <div className="p-4 bg-[#2b2d36] border border-amber-500/25 rounded-2xl space-y-2.5">
          <label className="text-xs font-bold text-white flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2"><FiCalendar className="text-amber-400" /> Schedule for Later Date</span>
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer" />
          </label>
          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTimeString()}
              className="w-full p-3 bg-[#1c1d22] border border-white/15 rounded-xl text-xs text-white outline-none focus:border-amber-500"
            />
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish(isScheduled ? 'scheduled' : 'published')}
            className="py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-400"
          >
            <FiSend size={14} /> {isScheduled ? 'Schedule' : 'Publish Now'}
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish('draft')}
            className="py-3.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-full flex items-center justify-center gap-1 cursor-pointer transition"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3.5 bg-white/10 border border-white/10 text-slate-300 font-bold text-xs rounded-full hover:bg-white/15 hover:text-white cursor-pointer transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </AdminModal>
  );
}

