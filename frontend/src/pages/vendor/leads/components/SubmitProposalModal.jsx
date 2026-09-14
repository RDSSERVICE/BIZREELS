import React, { useState, useEffect, useMemo } from 'react';
import {
  FiZap, FiX, FiCalendar, FiFileText, FiInfo,
  FiAlertCircle, FiCheckCircle, FiShield, FiPercent, FiClock,
  FiExternalLink
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext';

export default function SubmitProposalModal({
  isOpen,
  onClose,
  proposalReq,
  displayProposalReq,
  currentCredits = 0,
  calculateBidCreditCost,
  bidMultiplier = 0.002,
  bidCapCredits = 20,
  onSubmit,
  isSubmitting = false,
}) {
  const { bi } = useLanguage();
  const navigate = useNavigate();

  const req = displayProposalReq || proposalReq;

  const [quotePrice, setQuotePrice] = useState('');
  const [quoteDelivery, setQuoteDelivery] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteAttachment, setQuoteAttachment] = useState('');

  // Reset or initialize fields when modal opens
  useEffect(() => {
    if (isOpen && req) {
      const defaultBudget = req.budget || req.budget_max || req.budget_min || '';
      setQuotePrice(defaultBudget ? String(defaultBudget) : '');

      // Default delivery date: 5 days from today
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setQuoteDelivery(d.toISOString().split('T')[0]);

      setQuoteNotes('');
      setQuoteAttachment('');
    }
  }, [isOpen, req]);

  // Dynamic Bid Calculation Formula driven by Admin Settings
  const computeBidCost = (p) => {
    if (typeof calculateBidCreditCost === 'function') {
      return calculateBidCreditCost(p);
    }
    const price = Math.max(0, parseFloat(p) || 0);
    if (price <= 0) return 0;
    return Math.min(Math.max(0.10, Number((price * bidMultiplier).toFixed(2))), bidCapCredits);
  };

  const quotedPriceNum = Number(quotePrice) || 0;
  const bidCreditCost = useMemo(() => computeBidCost(quotedPriceNum), [quotedPriceNum, bidMultiplier, bidCapCredits, calculateBidCreditCost]);
  const isCapped = (quotedPriceNum * bidMultiplier) >= bidCapCredits;

  const hasEnoughCredits = currentCredits >= bidCreditCost;
  const remainingAfterBid = Math.max(0, Number((currentCredits - bidCreditCost).toFixed(2)));

  if (!isOpen || !req) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quotePrice || Number(quotePrice) <= 0) return;
    if (!quoteDelivery) return;
    if (!hasEnoughCredits) return;

    onSubmit({
      quotePrice: Number(quotePrice),
      quoteDelivery,
      quoteNotes,
      quoteAttachment,
      bidCreditCost,
    });
  };

  // Quick pre-fills for quote price
  const maxBudget = Number(req.budget || req.budget_max || 0);
  const handleSetPricePreset = (multiplier) => {
    if (!maxBudget) return;
    setQuotePrice(String(Math.round(maxBudget * multiplier)));
  };

  // Quick pre-fills for timeline
  const handleSetTimelineDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setQuoteDelivery(d.toISOString().split('T')[0]);
  };

  const formulaPercentLabel = `${(bidMultiplier * 100).toFixed(1).replace(/\.0$/, '')}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white text-[#1a1a1a] border border-[#e3dccb] shadow-2xl rounded-t-3xl sm:rounded-3xl p-6 max-w-lg w-full space-y-4 relative max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3.5 bg-[#f8f4ec] -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300 shadow-2xs">
              <FiZap size={18} className="text-amber-700" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#1a1a1a] leading-tight">
                {bi('Submit Quotation Proposal', 'कोटेशन प्रस्ताव सबमिट करें')}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                {req.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#ede5d8] text-[#1a1a1a] transition border border-[#e3dccb] cursor-pointer shadow-2xs"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Customer Requirement Summary Card */}
        <div className="bg-[#f8f4ec] rounded-2xl p-3.5 border border-[#e3dccb] space-y-2.5 shadow-2xs text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                req.type === 'service' || req.requirementType === 'service'
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}>
                {req.type || req.requirementType || 'Product Requirement'}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase ml-1.5">
                {req.category} {req.subcategory ? `• ${req.subcategory}` : ''}
              </span>
              <p className="font-bold text-xs text-[#1a1a1a] mt-1 line-clamp-1">{req.title}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 block">{bi('Max Budget', 'अधिकतम बजट')}</span>
              <span className="font-black text-xs sm:text-sm text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                ₹{(req.budget || req.budget_max || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e3dccb]/70 text-[11px]">
            <div>
              <span className="text-slate-500">{bi('Required Scope:', 'आवश्यक मात्रा:')}</span>{' '}
              <strong className="text-[#1a1a1a] font-bold">
                {req.quantity || 1} {req.type === 'service' || req.requirementType === 'service' ? 'deliverables' : 'units'}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500">{bi('Target City:', 'स्थान:')}</span>{' '}
              <strong className="text-[#1a1a1a] font-bold">{req.location?.city || 'Local Area'}</strong>
            </div>
          </div>
        </div>

        {/* ═══ Section 11 Bidding System Calculator ═══ */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-3.5 border border-amber-300 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wider">
              <FiPercent className="text-amber-700" size={13} />
              {bi('Bidding Credit Calculator', 'बिडिंग क्रेडिट कैलकुलेटर')}
            </span>
            <span className="text-[10px] font-bold text-amber-900 bg-white border border-amber-300 px-2 py-0.5 rounded-full">
              MIN(Price × {bidMultiplier}, {bidCapCredits} Cr)
            </span>
          </div>

          {/* Pricing Chips Reference Table dynamically computed */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">₹1,000</span>
              <strong className="font-extrabold text-amber-900">{computeBidCost(1000).toFixed(1)} Cr</strong>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">₹5,000</span>
              <strong className="font-extrabold text-amber-900">{computeBidCost(5000).toFixed(1)} Cr</strong>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">₹10,000</span>
              <strong className="font-extrabold text-amber-900">{computeBidCost(10000).toFixed(1)} Cr</strong>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">Capped Max</span>
              <strong className="font-extrabold text-emerald-800">{bidCapCredits} Cr Max</strong>
            </div>
          </div>

          {/* Live Calculated Fee & Balance Breakdown */}
          <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">{bi('Quoted Amount:', 'कोट की गई राशि:')}</span>
              <span className="font-bold text-[#1a1a1a]">
                {quotedPriceNum > 0 ? `₹${quotedPriceNum.toLocaleString('en-IN')}` : '₹0'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                {bi('Required Bid Fee:', 'प्रस्ताव बिड शुल्क:')}
                {isCapped && (
                  <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                    CAPPED AT {bidCapCredits}
                  </span>
                )}
              </span>
              <span className="font-black text-sm text-amber-800 flex items-center">
                <FiZap size={13} className="mr-0.5 fill-amber-500 text-amber-600" />
                {bidCreditCost.toFixed(2)} Credits
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
              <span className="text-slate-500">{bi('Your Available Wallet:', 'उपलब्ध वॉलेट बैलेंस:')}</span>
              <span className={`font-bold ${hasEnoughCredits ? 'text-emerald-700' : 'text-rose-600'}`}>
                {currentCredits.toFixed(2)} Credits
              </span>
            </div>

            {hasEnoughCredits && quotedPriceNum > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>{bi('Balance After Submission:', 'बिड के बाद शेष:')}</span>
                <span className="font-bold text-slate-700">{remainingAfterBid.toFixed(2)} Credits</span>
              </div>
            )}
          </div>
        </div>

        {/* Insufficient Credits Alert Banner */}
        {!hasEnoughCredits && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-fade-in shadow-2xs">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 space-y-1.5">
              <p className="font-extrabold text-rose-800">{bi('Insufficient Credits to Bid', 'बिड करने के लिए अपर्याप्त क्रेडिट')}</p>
              <p className="text-[11px] leading-relaxed text-rose-700">
                {bi(
                  `You need ${bidCreditCost.toFixed(2)} credits to bid on this requirement, but your balance is ${currentCredits.toFixed(2)} credits. Top up your non-expiring recharge pack to proceed.`,
                  `इस आवश्यकता पर बिड करने के लिए आपको ${bidCreditCost.toFixed(2)} क्रेडिट की आवश्यकता है, लेकिन आपका बैलेंस ${currentCredits.toFixed(2)} क्रेडिट है। जारी रखने के लिए अपने पैक को रीचार्ज करें।`
                )}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/vendor/wallet?tab=plans');
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                >
                  {bi('Recharge Wallet', 'वॉलेट रीचार्ज करें')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/pricing');
                  }}
                  className="px-3 py-1 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                >
                  {bi('View Plans', 'योजनाएं देखें')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Proposal Input Form ═══ */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Price Quotation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
                {bi('Your Price Quotation (₹) *', 'आपका मूल्य कोटेशन (₹) *')}
              </label>
              {maxBudget > 0 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetPricePreset(1.0)}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded text-slate-700 hover:bg-amber-100 hover:border-amber-400 transition"
                  >
                    Exact ₹{maxBudget.toLocaleString('en-IN')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPricePreset(0.95)}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition"
                  >
                    -5% Best Price
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-extrabold text-[#1a1a1a] focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Delivery Date with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
                {bi('Estimated Delivery / Completion Date *', 'अनुमानित पूर्ति तिथि *')}
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleSetTimelineDays(2)}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded text-slate-700 hover:bg-amber-100"
                >
                  2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTimelineDays(7)}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded text-slate-700 hover:bg-amber-100"
                >
                  1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTimelineDays(14)}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f8f4ec] border border-[#e3dccb] rounded text-slate-700 hover:bg-amber-100"
                >
                  2 Weeks
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                required
                value={quoteDelivery}
                onChange={(e) => setQuoteDelivery(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Message Notes */}
          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1">
              {bi('Proposal Pitch & Terms', 'प्रस्ताव संदेश व शर्तें')}
            </label>
            <textarea
              rows={3}
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder={bi(
                'Explain why you are the best fit, product brand, warranty details, turnaround time, custom options...',
                'व्याख्या करें कि आप सबसे उपयुक्त क्यों हैं, वारंटी, डिलीवरी समय, आदि...'
              )}
              className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-2xs leading-relaxed"
            />
          </div>

          {/* Optional Document URL */}
          <div>
            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block mb-1">
              {bi('Proposal Document / Catalog URL (Optional)', 'प्रस्ताव दस्तावेज / कैटलॉग लिंक (वैकल्पिक)')}
            </label>
            <input
              type="url"
              value={quoteAttachment}
              onChange={(e) => setQuoteAttachment(e.target.value)}
              placeholder="https://drive.google.com/... or catalog link"
              className="w-full px-3.5 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:bg-white focus:border-amber-500 outline-none shadow-2xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex gap-3 pt-3 border-t border-[#e3dccb]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-[#e3dccb] rounded-full text-xs font-bold text-slate-700 hover:text-black hover:bg-[#ede5d8] transition cursor-pointer shadow-2xs"
            >
              {bi('Cancel', 'रद्द करें')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasEnoughCredits || quotedPriceNum <= 0}
              className={`flex-1 py-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400 ${
                isSubmitting || !hasEnoughCredits || quotedPriceNum <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300 shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:shadow-amber-500/30 hover:scale-[1.01]'
              }`}
            >
              <FiZap size={14} className="fill-white" />
              {isSubmitting
                ? bi('Submitting Proposal...', 'प्रस्ताव भेजा जा रहा है...')
                : `${bi('Submit Proposal', 'प्रस्ताव भेजें')} (-${bidCreditCost.toFixed(2)} Cr)`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
