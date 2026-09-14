import React, { useState } from 'react';
import {
  FiMapPin, FiClock, FiEye, FiCheck, FiFileText,
  FiBookmark, FiTrash2, FiPackage, FiTool, FiZap,
  FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';
import { calculateBidCreditCost } from './SubmitProposalModal';

export default function RequirementCard({
  requirement,
  currentUserId,
  isSaved,
  onViewDetail,
  onOpenProposal,
  onToggleSave,
  onMarkNotInterested,
}) {
  const { bi } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const reqId = requirement._id || requirement.id;
  const location = requirement.location || {};
  const isRemote = location.area === 'Remote' || (location.city === 'Online' && location.state === 'Remote');
  const locationText = isRemote 
    ? 'Remote (Online)' 
    : (typeof location === 'string' ? location : `${location.city || 'Local'}${location.state ? `, ${location.state}` : ''}`);

  const isService = requirement.type === 'service' || requirement.requirementType === 'service';

  const hasResponded = requirement.vendorsResponded && requirement.vendorsResponded.some(
    vId => (vId._id || vId).toString() === currentUserId?.toString()
  );

  const budget = Number(requirement.budget || requirement.budget_max || requirement.budget_min || 0);
  const estimatedBidCost = calculateBidCreditCost(budget);

  const renderCountdown = (expiryDate) => {
    if (!expiryDate) return bi('Flexible Timeline', 'लचीली समयसीमा');
    const difference = +new Date(expiryDate) - +new Date();
    if (difference <= 0) return bi('Expired', 'समाप्त');

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return bi(`${days}d remaining`, `${days} दिन शेष`);
    return bi(`${hours}h remaining`, `${hours} घंटे शेष`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] hover:border-amber-400 hover:shadow-md transition-all flex flex-col gap-3.5 group">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#e3dccb]/70 pb-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Type Badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              isService
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {isService ? <FiTool size={11} /> : <FiPackage size={11} />}
              {isService ? bi('Service Requirement', 'सेवा आवश्यकता') : bi('Product Requirement', 'उत्पाद आवश्यकता')}
            </span>

            {/* Category */}
            <span className="text-[10px] font-extrabold text-slate-700 uppercase bg-[#f8f4ec] border border-[#e3dccb] px-2.5 py-0.5 rounded-full">
              {requirement.category || 'General'}
            </span>

            {requirement.subcategory && (
              <span className="text-[10px] font-medium text-slate-500 bg-[#f8f4ec] px-2 py-0.5 rounded-full">
                {requirement.subcategory}
              </span>
            )}

            {isSaved && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <FiBookmark size={10} className="fill-amber-800" /> {bi('Bookmarked', 'सहेजा गया')}
              </span>
            )}
          </div>

          <h4 className="font-extrabold text-sm sm:text-base text-[#1a1a1a] mt-1 group-hover:text-amber-900 transition leading-snug">
            {requirement.title}
          </h4>

          <p className={`text-xs text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {requirement.description}
          </p>

          {requirement.description?.length > 140 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 transition"
            >
              {expanded ? (
                <><span>{bi('Show less', 'कम दिखाएं')}</span> <FiChevronUp size={12} /></>
              ) : (
                <><span>{bi('Read more', 'और पढ़ें')}</span> <FiChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>

        {/* Budget & Bid Fee Column */}
        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 bg-[#f8f4ec] sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-[#e3dccb]">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              {bi('Customer Budget', 'ग्राहक बजट')}
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300 inline-block mt-0.5 shadow-2xs">
              {requirement.budget_min || requirement.budget_max ? (
                `₹${(requirement.budget_min || 0).toLocaleString('en-IN')} - ₹${(requirement.budget_max || 0).toLocaleString('en-IN')}`
              ) : (
                `₹${budget.toLocaleString('en-IN')}`
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] mt-1">
            <span className="text-slate-500">{isService ? 'Scope:' : 'Quantity:'}</span>
            <strong className="text-[#1a1a1a] font-black">
              {requirement.quantity || 1} {isService ? 'deliverables' : 'units'}
            </strong>
          </div>

          {/* Section 11 Fee Estimate Pill */}
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md mt-0.5 shadow-2xs">
            <FiZap size={10} className="text-amber-600 fill-amber-500" />
            {bi('Bid Fee:', 'बिड शुल्क:')} ~{estimatedBidCost.toFixed(1)} Cr
          </span>
        </div>
      </div>

      {/* Card Footer Info & Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between text-[11px] text-slate-500 gap-3">
        {/* Badges and metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <FiMapPin className="text-amber-700" size={13} /> {locationText}
            {requirement.distance !== undefined && (
              <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                {(requirement.distance / 1000).toFixed(1)} km away
              </span>
            )}
          </span>

          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <FiClock className="text-slate-400" size={12} />
            {renderCountdown(requirement.expires_at || requirement.deadline)}
          </span>

          <span className="text-slate-600">
            {bi('Proposals:', 'प्रस्ताव:')} <strong className="text-[#1a1a1a]">{requirement.quotesCount || requirement.proposals_count || 0}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onViewDetail(requirement)}
            className="px-3 py-1.5 bg-white border border-[#e3dccb] text-slate-700 text-xs font-bold rounded-xl hover:bg-[#ede5d8] hover:text-[#1a1a1a] transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <FiEye size={13} />
            <span>{bi('Details', 'विवरण')}</span>
          </button>

          {hasResponded ? (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-300 flex items-center gap-1 shadow-2xs">
              <FiCheck size={13} />
              <span>{bi('Proposal Sent', 'प्रस्ताव भेजा')}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenProposal(requirement)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer border border-amber-400 hover:scale-[1.01]"
            >
              <FiZap size={13} className="fill-white" />
              <span>{bi('Bid Proposal', 'प्रस्ताव बिड करें')}</span>
            </button>
          )}

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => onToggleSave(reqId)}
            className={`p-2 border rounded-xl transition cursor-pointer shadow-2xs ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-white border-[#e3dccb] text-slate-500 hover:text-amber-800 hover:bg-[#ede5d8]'
            }`}
            title={isSaved ? bi('Remove bookmark', 'बुकमार्क हटाएं') : bi('Save requirement', 'आवश्यकता सहेजें')}
          >
            <FiBookmark size={13} className={isSaved ? 'fill-amber-800' : ''} />
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => onMarkNotInterested(reqId)}
            className="p-2 border border-[#e3dccb] bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition cursor-pointer shadow-2xs"
            title={bi('Not interested', 'रुचि नहीं है')}
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
