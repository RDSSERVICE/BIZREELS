import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { useLanguage } from '../../../../context/LanguageContext';

export default function QuickReplyModal({
  inquiry,
  isOpen,
  onClose,
  onSendReply,
  isReplying = false
}) {
  const { bi } = useLanguage();
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
      title={`${bi('Reply to', 'उत्तर दें')} ${inquiry?.customer?.name || 'Customer'}`}
    >
      {inquiry && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-surface-secondary p-3 rounded-xl border border-border space-y-1">
            <div className="flex justify-between">
              <span className="text-text-tertiary">{bi('Regarding Listing:', 'संबंधित लिस्टिंग:')}</span>
              <strong className="text-text-primary">{inquiry.listing?.title || 'Listing'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">{bi('Customer Message:', 'ग्राहक संदेश:')}</span>
              <span className="text-text-secondary italic">"{inquiry.message || inquiry.msg}"</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
              {bi('Your Reply Message *', 'आपका उत्तर संदेश *')}
            </label>
            <textarea
              rows={4}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={bi("Type your response to the customer (they will receive an in-app notification)...", "ग्राहक को अपनी प्रतिक्रिया टाइप करें (उन्हें इन-ऐप सूचना प्राप्त होगी)...")}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 glass border border-border rounded-xl text-text-secondary font-bold hover:bg-surface-tertiary transition"
            >
              {bi('Cancel', 'रद्द करें')}
            </button>
            <button
              type="submit"
              disabled={isReplying || !replyText.trim()}
              className="px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <FiSend size={13} />
              <span>{isReplying ? bi('Sending...', 'भेजा जा रहा है...') : bi('Send Reply', 'उत्तर भेजें')}</span>
            </button>
          </div>
        </form>
      )}
    </AdminModal>
  );
}
