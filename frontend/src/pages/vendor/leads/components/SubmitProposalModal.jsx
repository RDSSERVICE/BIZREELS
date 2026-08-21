import React, { useState, useEffect } from 'react';
import { FiDollarSign } from 'react-icons/fi';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { useLanguage } from '../../../../context/LanguageContext';

export default function SubmitProposalModal({
  isOpen,
  onClose,
  proposalReq,
  displayProposalReq,
  currentCredits = 0,
  onSubmit,
  isSubmitting = false
}) {
  const { bi } = useLanguage();
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDelivery, setQuoteDelivery] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteAttachment, setQuoteAttachment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuotePrice('');
      setQuoteDelivery('');
      setQuoteNotes('');
      setQuoteAttachment('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      quotePrice,
      quoteDelivery,
      quoteNotes,
      quoteAttachment
    });
  };

  const req = displayProposalReq || proposalReq;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${bi('Submit Proposal:', 'प्रस्ताव सबमिट करें:')} ${req?.title || ''}`}
    >
      {req && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-surface-secondary p-3.5 rounded-xl border border-border space-y-1.5">
            <div className="flex justify-between">
              <span className="text-text-tertiary">{bi('Max Customer Budget:', 'अधिकतम ग्राहक बजट:')}</span>
              <strong className="text-emerald-600 font-bold">₹{(req.budget || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">{bi('Required Quantity:', 'आवश्यक मात्रा:')}</span>
              <strong className="text-text-primary">{req.quantity || 1} {bi('units', 'इकाइयां')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">{bi('Customer City:', 'ग्राहक का शहर:')}</span>
              <strong className="text-text-primary">{req.location?.city || 'Local'}</strong>
            </div>
            <div className="border-t border-border/50 pt-2 mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">{bi('Your Credit Balance:', 'आपका क्रेडिट बैलेंस:')}</span>
                <strong className={`font-bold ${currentCredits < 5 ? 'text-error' : 'text-emerald-600'}`}>
                  {currentCredits} {bi('Credits', 'क्रेडिट')}
                </strong>
              </div>
              <div className="flex justify-between text-text-secondary text-[11px]">
                <span>{bi('Submission Cost:', 'प्रस्ताव लागत:')}</span>
                <strong className="text-error">-5 {bi('Credits', 'क्रेडिट')}</strong>
              </div>
            </div>
          </div>

          {currentCredits < 5 && (
            <div className="bg-error/10 border border-error/20 rounded-xl p-3 text-error flex items-start gap-2 text-xs font-semibold">
              <span className="mt-0.5">⚠️</span>
              <div>
                <strong className="block text-error font-bold">{bi('Insufficient Credits', 'अपर्याप्त क्रेडिट')}</strong>
                {bi('You do not have enough credits to submit a proposal. Please recharge your wallet balance.', 'आपके पास प्रस्ताव जमा करने के लिए पर्याप्त क्रेडिट नहीं हैं। कृपया अपना वॉलेट बैलेंस रिचार्ज करें।')}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{bi('Your Price Quotation (₹) *', 'आपका मूल्य कोटेशन (₹) *')}</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
              <input
                type="number"
                required
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder={bi("e.g. 45000", "उदा. 45000")}
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{bi('Estimated Delivery Date *', 'अनुमानित डिलीवरी तिथि *')}</label>
            <input
              type="date"
              required
              value={quoteDelivery}
              onChange={(e) => setQuoteDelivery(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{bi('Proposal Message / Notes', 'प्रस्ताव संदेश / टिप्पणियां')}</label>
            <textarea
              rows={3}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder={bi("Explain why you are the best fit, warranty information, custom options, etc...", "व्याख्या करें कि आप सबसे उपयुक्त क्यों हैं, वारंटी जानकारी, कस्टम विकल्प, आदि...")}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">{bi('Proposal Document URL (Optional)', 'प्रस्ताव दस्तावेज यूआरएल (वैकल्पिक)')}</label>
            <input
              type="url"
              value={quoteAttachment}
              onChange={(e) => setQuoteAttachment(e.target.value)}
              placeholder={bi("Link to brochures, pricing tables, or portfolio images...", "ब्रोशर, मूल्य तालिकाओं या पोर्टफोलियो छवियों का लिंक...")}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-brand-purple"
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
              disabled={isSubmitting || currentCredits < 5}
              className={`px-5 py-2 gradient-brand text-white font-bold rounded-xl shadow-premium transition ${
                currentCredits < 5 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isSubmitting ? bi('Submitting proposal...', 'प्रस्ताव भेजा जा रहा है...') : bi('Submit Proposal Now', 'अभी प्रस्ताव सबमिट करें')}
            </button>
          </div>
        </form>
      )}
    </AdminModal>
  );
}
