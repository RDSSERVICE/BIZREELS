import React from 'react';
import { FiStar } from 'react-icons/fi';

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  rating,
  setRating,
  comment,
  setComment,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <form onSubmit={onSubmit} className="glass max-w-md w-full rounded-2xl p-6 border border-white/40 shadow-premium space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiStar className="text-yellow-500" /> Submit Vendor Review
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary bg-surface rounded-lg border border-border"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Select Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2 pt-1 text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition"
                >
                  <FiStar size={24} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Write your review / comments
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your purchase experience, quality of service, or shipping feedback..."
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-95 transition"
        >
          Submit Official Review
        </button>
      </form>
    </div>
  );
}
