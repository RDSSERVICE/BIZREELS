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
        <div className="glass rounded-2xl border border-border p-4 space-y-4 bg-surface">
          
          {/* Header Info */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="px-2.5 py-1 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase">
                {postCategory} → {postSubcategory}
              </span>
              <h3 className="font-bold text-base text-text-primary mt-1">
                {activeTitle}
              </h3>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-full text-xs font-bold uppercase">
              {postPurpose}
            </span>
          </div>

          {/* Purpose Extra Info Banner (Offer / Announcement) */}
          {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && discountPercent && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs">
              <FiPercent className="text-emerald-600 flex-shrink-0" size={13} />
              <span className="font-extrabold text-emerald-700">{discountPercent}% OFF</span>
              {couponCode && (
                <span className="flex items-center gap-1 font-mono bg-white/60 dark:bg-black/20 border border-emerald-300 px-2 py-0.5 rounded-lg text-emerald-700 font-bold">
                  <FiTag size={10} /> {couponCode}
                </span>
              )}
              {discountValidity && (
                <span className="text-emerald-600 font-medium">Valid till {new Date(discountValidity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          )}

          {announcementTagline && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs">
              <FiBell className="text-blue-600 flex-shrink-0 mt-0.5" size={13} />
              <span className="font-semibold text-blue-700 leading-snug">{announcementTagline}</span>
            </div>
          )}

          {/* Media & Caption Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-2">
              <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative max-h-48 flex items-center justify-center border shadow-sm">
                {mainMedia ? (
                  mainMedia.match(/\.(mp4|webm|mov)(\?.*)?$/i) || mainMedia.startsWith('data:video/') ? (
                    <video src={mainMedia} muted autoPlay loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={mainMedia} alt="Post Media" className="w-full h-full object-cover" />
                  )
                ) : (
                  <video src="https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4" muted autoPlay loop className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-amber-400 border border-amber-400/30">
                  📷 {mediaList.length || 1} Media Item(s) Attached
                </div>
              </div>
              {mediaList.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {mediaList.map((item, mIdx) => {
                    const mUrl = typeof item === 'object' ? item.url : item;
                    return (
                      <div key={mIdx} className="w-10 h-10 rounded-lg bg-black border border-brand-purple overflow-hidden flex-shrink-0">
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
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Caption</span>
                <p className="text-text-secondary bg-surface-secondary p-2.5 rounded-xl border border-border line-clamp-4">
                  {caption || 'No caption entered.'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Targeting Summary</span>
                <p className="text-text-primary font-medium">📍 Area: {promotionArea}</p>
                <p className="text-text-primary font-medium">👥 Audience: {selectedTargetAudiences.join(', ')}</p>
                {customTargetAudience && <p className="text-brand-purple font-medium">🏷️ Custom: {customTargetAudience}</p>}
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-surface-secondary p-3 rounded-xl text-center border border-border">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-tertiary block">Estimated Reach</span>
              <span className="font-extrabold text-xs text-emerald-600">5,000 - 25,000 Users</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-tertiary block">Credit Required</span>
              <span className="font-extrabold text-xs text-amber-600">1 Credit</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-tertiary block">Post Validity</span>
              <span className="font-extrabold text-xs text-brand-purple">30 Days</span>
            </div>
          </div>
        </div>

        {/* CONFIRMATION MESSAGE */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-2">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>Publishing this post will consume 1 credit. Do you want to continue?</span>
        </div>

        {/* SCHEDULE OPTION TOGGLE */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
          <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-1.5"><FiCalendar className="text-brand-purple" /> Schedule for Later Date</span>
            <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4" />
          </label>
          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTimeString()}
              className="w-full p-2 bg-surface border border-border rounded-xl text-xs"
            />
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish(isScheduled ? 'scheduled' : 'published')}
            className="py-3 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium flex items-center justify-center gap-1 hover:brightness-110"
          >
            <FiSend size={13} /> {isScheduled ? 'Schedule' : 'Publish Now'}
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish('draft')}
            className="py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-surface border border-border text-text-secondary font-bold text-xs rounded-xl hover:bg-surface-secondary"
          >
            Cancel
          </button>
        </div>

      </div>
    </AdminModal>
  );
}
