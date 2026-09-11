import React, { useState } from 'react';
import {
  FiX,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle
} from 'react-icons/fi';

const PRESET_REASONS = [
  'Inappropriate or Adult Content',
  'Misleading Information or Scam',
  'Copyright / Intellectual Property Violation',
  'Spam or Repetitive Low-Quality Media',
  'Prohibited or Regulated Goods',
  'Hate Speech or Harassment',
  'Other Policy Violation'
];

export default function ReelModerateModal({
  reel,
  onClose,
  onSubmit,
  isLoading
}) {
  if (!reel) return null;

  const [status, setStatus] = useState('approved');
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [comments, setComments] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      status,
      comments: comments.trim() || (status === 'rejected' ? reason : 'Approved by admin review.')
    };
    onSubmit(reel.id || reel._id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e3dccb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <FiShield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a1a1a] font-['Archivo_Black']">
                Content Moderation Audit
              </h3>
              <p className="text-[11px] text-[#1a1a1a]/60 font-['Outfit']">
                Review safety compliance and record formal audit log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#e3dccb]/40 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 font-['Outfit'] text-xs">
          {/* Reel snippet info */}
          <div className="bg-[#fbf9f4] border border-[#e3dccb] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[#1a1a1a]/50 uppercase tracking-wider block mb-1">
              Target Reel
            </span>
            <p className="font-bold text-[#1a1a1a] truncate mb-0.5">
              {reel.creator_name || reel.creator?.name || 'Creator'}
            </p>
            <p className="text-[#1a1a1a]/70 line-clamp-2 italic">
              "{reel.caption || 'No caption'}"
            </p>
          </div>

          {/* Decision Selection */}
          <div>
            <label className="text-[11px] font-bold text-[#1a1a1a]/70 uppercase tracking-wider block mb-1.5">
              Moderation Decision
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  status === 'approved'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/10'
                    : 'bg-[#fbf9f4] border-[#e3dccb] hover:border-[#1a1a1a]/40 text-[#1a1a1a]'
                }`}
              >
                <FiCheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-xs">Approve Content</span>
                  <span className="text-[10px] text-[#1a1a1a]/60">
                    Clear flags & keep video live in public catalog
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  status === 'rejected'
                    ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-600/10'
                    : 'bg-[#fbf9f4] border-[#e3dccb] hover:border-[#1a1a1a]/40 text-[#1a1a1a]'
                }`}
              >
                <FiXCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-xs">Reject & Takedown</span>
                  <span className="text-[10px] text-[#1a1a1a]/60">
                    Remove from feed and notify creator
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Preset violation reason (if rejecting) */}
          {status === 'rejected' && (
            <div>
              <label className="text-[11px] font-bold text-[#1a1a1a]/70 uppercase tracking-wider block mb-1.5">
                Primary Policy Violation
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-[#fbf9f4] border border-[#e3dccb] rounded-xl text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] text-xs font-medium"
              >
                {PRESET_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Admin comment */}
          <div>
            <label className="text-[11px] font-bold text-[#1a1a1a]/70 uppercase tracking-wider block mb-1.5">
              Reviewer Notes / Feedback
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                status === 'rejected'
                  ? 'Explain why this content violates community guidelines...'
                  : 'Optional internal audit comments...'
              }
              className="w-full p-2.5 bg-[#fbf9f4] border border-[#e3dccb] rounded-xl text-[#1a1a1a] placeholder-[#1a1a1a]/40 focus:outline-none focus:border-[#1a1a1a] text-xs resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[#fbf9f4] hover:bg-[#e3dccb]/40 border border-[#e3dccb] text-[#1a1a1a] font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                status === 'rejected'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-emerald-700 hover:bg-emerald-600'
              }`}
            >
              {isLoading ? 'Saving...' : status === 'rejected' ? 'Confirm Takedown' : 'Approve Reel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
