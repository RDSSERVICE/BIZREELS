import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import AdminModal from '../../../../features/admin/components/AdminModal';

export default function QuickReplyModal({
  inquiry,
  isOpen,
  onClose,
  onSendReply,
  isReplying = false
}) {
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (inquiry) {
      setReplyText(inquiry.replyMessage || '');
    } else {
      setReplyText('');
    }
  }, [inquiry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(inquiry, replyText.trim());
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reply to ${inquiry?.customer?.name || 'Customer'}`}
    >
      {inquiry && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-surface-secondary p-3 rounded-xl border border-border space-y-1">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Regarding Listing:</span>
              <strong className="text-text-primary">{inquiry.listing?.title || 'Listing'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Customer Message:</span>
              <span className="text-text-secondary italic">"{inquiry.message || inquiry.msg}"</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
              Your Reply Message *
            </label>
            <textarea
              rows={4}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the customer (they will receive an in-app notification)..."
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold hover:bg-surface-tertiary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReplying || !replyText.trim()}
              className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiSend size={13} />
              <span>{isReplying ? 'Sending...' : 'Send Reply'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminModal>
  );
}
