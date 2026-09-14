import React from 'react';
import {
  FiCheck, FiX, FiMapPin, FiCalendar, FiClock,
  FiZap, FiPackage, FiTool, FiUser, FiInfo,
  FiExternalLink, FiAlertCircle
} from 'react-icons/fi';
import { resolveMediaUrl } from '../../../../lib/api';
import { useLanguage } from '../../../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function RequirementDetailModal({
  isOpen,
  onClose,
  detailReq,
  displayReq,
  currentUserId,
  currentCredits = 0,
  respondedReqIds = [],
  calculateBidCreditCost,
  bidMultiplier = 0.002,
  bidCapCredits = 20,
  onOpenProposal
}) {
  const { bi } = useLanguage();
  const navigate = useNavigate();

  const req = displayReq || detailReq;

  if (!isOpen || !req) return null;

  const reqId = req._id || req.id;
  const isService = req.type === 'service' || req.requirementType === 'service';
  const hasResponded = (req.vendorsResponded && req.vendorsResponded.some(
    vId => (vId._id || vId).toString() === currentUserId?.toString()
  )) || (respondedReqIds && respondedReqIds.includes(reqId?.toString()));

  const budget = Number(req.budget || req.budget_max || req.budget_min || 0);
  const estimatedBidCost = typeof calculateBidCreditCost === 'function'
    ? calculateBidCreditCost(budget)
    : Math.min(Math.max(0.10, Number((budget * bidMultiplier).toFixed(2))), bidCapCredits);
  const hasEnoughCredits = currentCredits >= estimatedBidCost;

  const isRemote = req.location?.area === 'Remote' || (req.location?.city === 'Online' && req.location?.state === 'Remote');
  const locationText = isRemote
    ? 'Remote (Online)'
    : `${req.location?.city || 'Local'}${req.location?.state ? `, ${req.location?.state}` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 relative max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e3dccb] pb-3.5 bg-[#f8f4ec] -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 px-5 sm:px-6 py-4 rounded-t-3xl gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                isService
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                {isService ? <FiTool size={11} /> : <FiPackage size={11} />}
                {isService ? bi('Service Requirement', 'सेवा आवश्यकता') : bi('Product Requirement', 'उत्पाद आवश्यकता')}
              </span>
              <span className="text-[10px] font-extrabold text-slate-700 uppercase bg-white border border-[#e3dccb] px-2.5 py-0.5 rounded-full">
                {req.category} {req.subcategory ? `• ${req.subcategory}` : ''}
              </span>
              <span className="text-[10px] font-bold text-amber-950 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full">
                {req.status || 'Active'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#1a1a1a] leading-snug">
              {req.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition border border-[#e3dccb] cursor-pointer shadow-2xs shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ═══ Budget & Bidding Highlight Card ═══ */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 border border-amber-300 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                {bi('Target Customer Budget', 'ग्राहक का बजट')}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 inline-block mt-0.5">
                {req.budget_min || req.budget_max ? (
                  `₹${(req.budget_min || 0).toLocaleString('en-IN')} - ₹${(req.budget_max || 0).toLocaleString('en-IN')}`
                ) : (
                  `₹${budget.toLocaleString('en-IN')}`
                )}
              </span>
            </div>

            {/* Estimated Bidding Fee Pill */}
            <div className="sm:text-right bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[10px] font-bold text-amber-900 block flex items-center sm:justify-end gap-1">
                <FiZap size={12} className="text-amber-600 fill-amber-500" />
                {bi('Section 11 Proposal Fee:', 'प्रस्ताव बिडिंग शुल्क:')}
              </span>
              <span className="font-black text-xs sm:text-sm text-amber-950">
                ~{estimatedBidCost.toFixed(2)} Credits
              </span>
              <span className="text-[9px] text-slate-500 block">
                MIN(Price × 0.002, 20 Cr)
              </span>
            </div>
          </div>

          {/* Credits status check */}
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {bi('Your Available Credits:', 'आपका उपलब्ध क्रेडिट:')}{' '}
              <strong className={hasEnoughCredits ? 'text-emerald-700' : 'text-rose-600'}>
                {currentCredits.toFixed(2)} Credits
              </strong>
            </span>
            {!hasEnoughCredits && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/vendor/wallet?tab=plans');
                }}
                className="text-[11px] font-black text-amber-900 underline hover:text-black transition"
              >
                {bi('Recharge Wallet Now', 'वॉलेट रीचार्ज करें')}
              </button>
            )}
          </div>
        </div>

        {/* ═══ Key Parameters Grid ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              {isService ? bi('Scope / Deliverables', 'सेवा दायरा') : bi('Quantity Requested', 'मात्रा')}
            </span>
            <strong className="text-sm font-extrabold text-[#1a1a1a]">
              {req.quantity || 1} {isService ? 'deliverables' : 'units'}
            </strong>
          </div>

          <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
              <FiMapPin size={11} className="text-amber-700" />
              {bi('Target Location', 'स्थान')}
            </span>
            <strong className="text-sm font-extrabold text-[#1a1a1a] truncate block">
              {locationText}
            </strong>
          </div>

          <div className="p-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
              <FiCalendar size={11} className="text-slate-500" />
              {bi('Expected Date', 'अपेक्षित तिथि')}
            </span>
            <strong className="text-sm font-extrabold text-[#1a1a1a]">
              {req.expectedDeliveryDate
                ? new Date(req.expectedDeliveryDate).toLocaleDateString('en-IN')
                : bi('Flexible', 'लचीली')}
            </strong>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 bg-[#f8f4ec] rounded-xl border border-[#e3dccb] space-y-1.5 text-xs">
          <h5 className="font-extrabold text-xs text-[#1a1a1a] uppercase tracking-wider">
            {bi('Requirement Overview', 'आवश्यकता विवरण')}
          </h5>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {req.description}
          </p>
        </div>

        {/* Detailed Specifications */}
        {(req.detailedSpecifications || req.address || req.productCondition || req.serviceModel) && (
          <div className="p-4 bg-white border border-[#e3dccb] rounded-xl space-y-2 text-xs">
            <h5 className="font-extrabold text-xs text-[#1a1a1a] uppercase tracking-wider">
              {bi('Detailed Specifications', 'विस्तृत विनिर्देश')}
            </h5>
            {req.detailedSpecifications && (
              <div className="bg-[#f8f4ec] p-3 rounded-lg border border-[#e3dccb]/70 font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                {req.detailedSpecifications}
              </div>
            )}
            {req.address && (
              <div className="flex gap-2">
                <span className="text-slate-500 font-medium">{bi('Address / Site:', 'साइट पता:')}</span>
                <strong className="text-[#1a1a1a]">{req.address}</strong>
              </div>
            )}
            {req.productCondition && (
              <div className="flex gap-2">
                <span className="text-slate-500 font-medium">{bi('Condition Preference:', 'स्थिति वरीयता:')}</span>
                <strong className="capitalize text-[#1a1a1a]">{req.productCondition}</strong>
              </div>
            )}
            {req.serviceModel && (
              <div className="flex gap-2">
                <span className="text-slate-500 font-medium">{bi('Service Model:', 'सेवा मॉडल:')}</span>
                <strong className="capitalize text-[#1a1a1a]">{req.serviceModel}</strong>
              </div>
            )}
          </div>
        )}

        {/* Media Attachments */}
        {((req.photos && req.photos.length > 0) || req.video) && (
          <div className="p-4 bg-white border border-[#e3dccb] rounded-xl space-y-2.5 text-xs">
            <h5 className="font-extrabold text-xs text-[#1a1a1a] uppercase tracking-wider">
              {bi('Media Attachments', 'संलग्न मीडिया')}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {req.photos && req.photos.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">Photos ({req.photos.length})</span>
                  <div className="grid grid-cols-3 gap-2">
                    {req.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={resolveMediaUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-[#e3dccb] hover:border-amber-400 transition bg-[#f8f4ec] flex items-center justify-center group"
                      >
                        <img
                          src={resolveMediaUrl(url)}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {req.video && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">Reference Video</span>
                  <div className="rounded-lg overflow-hidden border border-[#e3dccb] bg-black">
                    <video
                      src={resolveMediaUrl(req.video)}
                      controls
                      className="max-h-[140px] w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Context */}
        <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-[#1a1a1a]">
            <FiUser size={13} className="text-amber-800" />
            <span>{bi('Buyer Context Details', 'खरीदार संदर्भ')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-500">{bi('Buyer Name:', 'नाम:')}</span>{' '}
              <strong className="text-[#1a1a1a]">{req.customer?.name || 'Verified Customer'}</strong>
            </div>
            <div>
              <span className="text-slate-500">{bi('Contact Info:', 'संपर्क:')}</span>{' '}
              <span className="text-slate-700 italic">
                {bi('Unlocked after proposal acceptance', 'प्रस्ताव स्वीकार होने पर दिखाई देगा')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e3dccb]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#e3dccb] text-slate-700 hover:text-black hover:bg-[#ede5d8] rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            {bi('Close', 'बंद करें')}
          </button>

          {hasResponded ? (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <FiCheck size={14} />
              <span>{bi('Proposal Already Submitted', 'प्रस्ताव पहले ही भेजा जा चुका है')}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProposal(req);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer border border-amber-400 hover:scale-[1.01]"
            >
              <FiZap size={14} className="fill-white" />
              <span>
                {bi('Submit Proposal', 'प्रस्ताव बिड करें')} (~{estimatedBidCost.toFixed(1)} Cr)
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
