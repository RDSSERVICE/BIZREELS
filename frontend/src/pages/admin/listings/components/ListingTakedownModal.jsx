import React, { useState } from 'react';
import { FiAlertTriangle, FiSlash, FiX, FiShield } from 'react-icons/fi';

const PRESET_TAKEDOWN_REASONS = [
  'Counterfeit or Replica Goods',
  'Prohibited or Illegal Items',
  'Misleading Pricing or Fraudulent Offer',
  'Copyright / Trademark / IP Infringement',
  'Adult or Inappropriate Content',
  'Defective, Damaged, or Expired Product',
  'Vendor Operating Policy Violation',
  'Duplicate or Spam Listing',
  'Other Safety Violation'
];

export default function ListingTakedownModal({
  listing,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) {
  if (!isOpen || !listing) return null;

  const [reason, setReason] = useState(PRESET_TAKEDOWN_REASONS[0]);
  const [comments, setComments] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      id: listing.id || listing._id,
      reason,
      comments: comments.trim()
    });
  };

  const isBulk = Array.isArray(listing);
  const count = isBulk ? listing.length : 1;
  const title = isBulk ? `${count} Selected Listings` : (listing.title || 'Untitled Listing');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e3dccb] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a1a1a] font-['Archivo_Black']">
                Content Safety Takedown
              </h3>
              <p className="text-[11px] text-slate-500 font-['Outfit']">
                Record reason and hide listing from the public marketplace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#1a1a1a] hover:bg-slate-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 font-['Outfit'] text-xs">
          {/* Target Listing Summary */}
          <div className="p-3 bg-white border border-[#e3dccb] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <FiSlash className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-[#1a1a1a] truncate text-sm">
                {title}
              </div>
              <div className="text-[11px] text-slate-500">
                {isBulk ? 'Bulk takedown action' : `ID: ${listing.id || listing._id}`}
              </div>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5 tracking-wider">
              Primary Violation Reason <span className="text-rose-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e3dccb] rounded-xl font-bold text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] shadow-2xs"
            >
              {PRESET_TAKEDOWN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Feedback */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1.5 tracking-wider">
              Specific Audit Notes & Vendor Feedback
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Explain the specific issue found so the vendor can rectify or understand the takedown..."
              className="w-full p-3 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e3dccb]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#e3dccb] text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiSlash className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Processing...' : 'Confirm Takedown'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
