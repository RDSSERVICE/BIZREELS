import React from 'react';
import { FiCalendar, FiAlertTriangle, FiSend, FiPercent, FiBell, FiTag, FiVideo, FiMapPin, FiUsers } from 'react-icons/fi';
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
      <div className="space-y-5 font-sans">

        {/* PREVIEW CARD CONTAINER */}
        <div className="bg-[#f8f4ec] rounded-2xl border border-[#e3dccb] p-5 space-y-4 shadow-2xs">

          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dccb] pb-3.5">
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                {postCategory} → {postSubcategory}
              </span>
              <h3 className="font-black text-sm sm:text-base text-[#1a1a1a] mt-1.5">
                {activeTitle}
              </h3>
            </div>
            <span className="px-3.5 py-1 bg-white text-amber-800 border border-amber-300 rounded-full text-xs font-bold uppercase shadow-2xs">
              {postPurpose}
            </span>
          </div>

          {/* Purpose Extra Info Banner (Offer / Announcement) */}
          {(postPurpose === 'Offer / Discount' || postPurpose === 'Flash Sale') && discountPercent && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs">
              <FiPercent className="text-emerald-700 flex-shrink-0" size={14} />
              <span className="font-extrabold text-emerald-900">{discountPercent}% OFF</span>
              {couponCode && (
                <span className="flex items-center gap-1 font-mono bg-white border border-emerald-300 px-2.5 py-0.5 rounded-lg text-emerald-800 font-bold">
                  <FiTag size={11} /> {couponCode}
                </span>
              )}
              {discountValidity && (
                <span className="text-emerald-800 font-medium">Valid till {new Date(discountValidity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          )}

          {announcementTagline && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs">
              <FiBell className="text-amber-700 flex-shrink-0 mt-0.5" size={14} />
              <span className="font-semibold text-amber-900 leading-snug">{announcementTagline}</span>
            </div>
          )}

          {/* Media & Caption Preview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-2">
              <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden relative max-h-60 flex items-center justify-center border-2 border-[#e3dccb] shadow-md">
                {mainMedia ? (
                  mainMedia.match(/\.(mp4|webm|mov)(\?.*)?$/i) || mainMedia.startsWith('data:video/') ? (
                    <video src={mainMedia} muted autoPlay loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={mainMedia} alt="Post Media" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-slate-400">
                    <FiVideo size={28} className="text-amber-500" />
                    <span className="text-[11px] font-semibold text-slate-300">No media attached</span>
                    <span className="text-[9px] text-slate-500">Attach an image or video to preview</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-black text-amber-300 border border-amber-400/40">
                  📷 {mediaList.length || 1} Media File(s)
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
              <div className="bg-white p-3.5 rounded-xl border border-[#e3dccb] shadow-2xs">
                <span className="text-[10px] uppercase font-black text-amber-800 block mb-1">
                  Caption &amp; Message
                </span>
                <p className="text-[#1a1a1a] line-clamp-4 leading-relaxed font-medium">
                  {caption || 'No caption entered.'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#e3dccb] shadow-2xs space-y-1.5">
                <span className="text-[10px] uppercase font-black text-amber-800 block mb-1">
                  Targeting &amp; Distribution
                </span>
                <p className="text-slate-700 flex items-center gap-1.5">
                  <FiMapPin className="text-amber-600 flex-shrink-0" size={13} />
                  <span>Area: <strong className="text-[#1a1a1a]">{promotionArea}</strong></span>
                </p>
                <p className="text-slate-700 flex items-start gap-1.5">
                  <FiUsers className="text-amber-600 flex-shrink-0 mt-0.5" size={13} />
                  <span>Audience: <strong className="text-[#1a1a1a]">{selectedTargetAudiences.join(', ')}</strong></span>
                </p>
                {customTargetAudience && (
                  <p className="text-amber-800 font-medium pl-4 text-[11px]">
                    🏷️ Custom: {customTargetAudience}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Metrics Row */}
          <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-xl text-center border border-[#e3dccb] shadow-2xs">
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Estimated Reach</span>
              <span className="font-black text-xs text-emerald-700">5,000 - 25,000</span>
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Cost / Debit</span>
              <span className="font-black text-xs text-amber-700">1 Credit</span>
            </div>
            <div>
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block">Post Validity</span>
              <span className="font-black text-xs text-[#1a1a1a]">30 Days</span>
            </div>
          </div>

        </div>

        {/* CONFIRMATION ALERT MESSAGE */}
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2.5">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>Publishing this post will consume 1 credit from your vendor wallet. Do you wish to continue?</span>
        </div>

        {/* SCHEDULE OPTION TOGGLE */}
        <div className="p-4 bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl space-y-2.5 shadow-2xs">
          <label className="text-xs font-bold text-[#1a1a1a] flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2">
              <FiCalendar className="text-amber-600" /> Schedule for Later Date
            </span>
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer"
            />
          </label>
          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTimeString()}
              className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] outline-none focus:border-amber-500 shadow-2xs"
            />
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish(isScheduled ? 'scheduled' : 'published')}
            className="py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-400"
          >
            <FiSend size={14} /> {isPublishing ? 'Publishing...' : isScheduled ? 'Schedule' : 'Publish Now'}
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={() => onPublish('draft')}
            className="py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-full flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3.5 bg-white border border-[#e3dccb] text-slate-700 font-bold text-xs rounded-full hover:bg-[#ede5d8] cursor-pointer transition shadow-2xs"
          >
            Cancel
          </button>
        </div>

      </div>
    </AdminModal>
  );
}
