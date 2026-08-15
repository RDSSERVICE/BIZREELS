import React from 'react';
import {
  FiMapPin, FiClock, FiEye, FiCheck, FiFileText,
  FiArchive, FiTrash
} from 'react-icons/fi';

export default function RequirementCard({
  requirement,
  currentUserId,
  isSaved,
  onViewDetail,
  onOpenProposal,
  onToggleSave,
  onMarkNotInterested
}) {
  const reqId = requirement._id || requirement.id;
  const location = requirement.location || {};
  const isRemote = location.area === 'Remote' || (location.city === 'Online' && location.state === 'Remote');
  const locationText = isRemote 
    ? 'Remote (Online)' 
    : (typeof location === 'string' ? location : `${location.city || 'Local'}${location.state ? `, ${location.state}` : ''}`);

  const hasResponded = requirement.vendorsResponded && requirement.vendorsResponded.some(
    vId => (vId._id || vId).toString() === currentUserId?.toString()
  );

  const renderCountdown = (expiryDate) => {
    if (!expiryDate) return 'Flexible';
    const difference = +new Date(expiryDate) - +new Date();
    if (difference <= 0) return 'Expired';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    
    if (days > 0) return `${days} Days remaining`;
    return `${hours} Hours remaining`;
  };

  return (
    <div className="glass rounded-2xl p-5 border border-white/30 hover:border-brand-purple/40 shadow-sm transition-all flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
              requirement.type === 'service' || requirement.requirementType === 'service'
                ? 'bg-brand-purple/10 text-brand-purple'
                : 'bg-brand-orange/10 text-brand-orange'
            }`}>
              {requirement.type || requirement.requirementType || 'product'}
            </span>
            <span className="text-[9px] font-black text-text-tertiary uppercase bg-surface-secondary px-2 py-0.5 rounded">
              {requirement.category || 'General'}
            </span>
            {requirement.subcategory && (
              <span className="text-[9px] font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded">
                {requirement.subcategory}
              </span>
            )}
            {isSaved && (
              <span className="text-[9px] font-bold text-white bg-brand-purple px-2 py-0.5 rounded">
                Saved
              </span>
            )}
          </div>
          <h4 className="font-bold text-sm text-text-primary mt-2 font-display">{requirement.title}</h4>
          <p className="text-xs text-text-tertiary mt-1.5 line-clamp-2 leading-relaxed">{requirement.description}</p>
        </div>

        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
          <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Budget: {requirement.budget_min || requirement.budget_max ? (
              `₹${(requirement.budget_min || 0).toLocaleString('en-IN')} - ₹${(requirement.budget_max || 0).toLocaleString('en-IN')}`
            ) : (
              `₹${(requirement.budget || 0).toLocaleString('en-IN')}`
            )}
          </span>
          <span className="text-[10px] text-text-tertiary block mt-1">
            {requirement.type === 'service' || requirement.requirementType === 'service' ? 'Service Scope' : 'Requested Qty'}: <strong>{requirement.quantity || 1} {requirement.type === 'service' || requirement.requirementType === 'service' ? 'deliverables/days' : 'units'}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between text-[10px] text-text-tertiary gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <FiMapPin className="text-brand-orange" /> {locationText}
            {requirement.distance !== undefined && (
              <span className="font-bold text-brand-purple">({(requirement.distance / 1000).toFixed(1)} km away)</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <FiClock /> {renderCountdown(requirement.expires_at || requirement.deadline)}
          </span>
          <span>Proposals: <strong>{requirement.quotesCount || requirement.proposals_count || 0}</strong></span>
          <span>Date: <strong>{requirement.createdAt ? new Date(requirement.createdAt).toLocaleDateString() : 'Recent'}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => onViewDetail(requirement)}
            className="px-2.5 sm:px-3 py-1.5 bg-surface border border-border text-text-secondary text-[11px] sm:text-xs font-semibold rounded-lg hover:text-brand-purple transition flex items-center gap-1"
          >
            <FiEye size={12} />
            <span>View Detail</span>
          </button>
          {hasResponded ? (
            <span className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 text-[11px] sm:text-xs font-bold rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <FiCheck size={12} />
              <span>Proposal Sent</span>
            </span>
          ) : (
            <button
              onClick={() => onOpenProposal(requirement)}
              className="px-2.5 sm:px-3.5 py-1.5 gradient-brand text-white text-[11px] sm:text-xs font-bold rounded-lg shadow hover:opacity-95 transition flex items-center gap-1"
            >
              <FiFileText size={12} />
              <span>Submit Proposal</span>
            </button>
          )}
          <button
            onClick={() => onToggleSave(reqId)}
            className={`p-1.5 border rounded-lg transition ${
              isSaved ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/20' : 'bg-surface border-border text-text-tertiary hover:text-brand-purple'
            }`}
            title="Save Requirement"
          >
            <FiArchive size={13} />
          </button>
          <button
            onClick={() => onMarkNotInterested(reqId)}
            className="p-1.5 border border-border bg-surface text-text-tertiary hover:text-error hover:border-error/20 rounded-lg transition"
            title="Mark Not Interested"
          >
            <FiTrash size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
