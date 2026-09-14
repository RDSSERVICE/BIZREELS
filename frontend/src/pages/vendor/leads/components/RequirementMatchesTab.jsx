import React, { useState, useMemo } from 'react';
import {
  FiSliders, FiSearch, FiRefreshCw, FiZap, FiBookmark,
  FiPackage, FiTool, FiCheckCircle, FiInfo, FiChevronDown,
  FiChevronUp, FiCreditCard, FiX, FiExternalLink
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import RequirementCard from './RequirementCard';
import { useLanguage } from '../../../../context/LanguageContext';

export default function RequirementMatchesTab({
  requirements = [],
  distanceKm,
  setDistanceKm,
  sortBy,
  setSortBy,
  currentUserId,
  currentCredits = 0,
  savedIds = [],
  onViewDetail,
  onOpenProposal,
  onToggleSave,
  onMarkNotInterested,
  onRefresh
}) {
  const { bi } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'product' | 'service'
  const [onlySaved, setOnlySaved] = useState(false);
  const [showBiddingGuide, setShowBiddingGuide] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh with subtle spin animation
  const handleRefreshClick = async () => {
    if (typeof onRefresh === 'function') {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Counts by category type
  const productCount = useMemo(() => {
    return requirements.filter(r => r.type !== 'service' && r.requirementType !== 'service').length;
  }, [requirements]);

  const serviceCount = useMemo(() => {
    return requirements.filter(r => r.type === 'service' || r.requirementType === 'service').length;
  }, [requirements]);

  const savedCount = useMemo(() => {
    return requirements.filter(r => savedIds.includes(r._id || r.id)).length;
  }, [requirements, savedIds]);

  // Client-side filtering
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      const reqId = req._id || req.id;
      const isService = req.type === 'service' || req.requirementType === 'service';

      // Type filter
      if (selectedType === 'product' && isService) return false;
      if (selectedType === 'service' && !isService) return false;

      // Saved filter
      if (onlySaved && !savedIds.includes(reqId)) return false;

      // Keyword search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = (req.title || '').toLowerCase();
        const desc = (req.description || '').toLowerCase();
        const cat = (req.category || '').toLowerCase();
        const subcat = (req.subcategory || '').toLowerCase();
        const city = (req.location?.city || '').toLowerCase();
        const state = (req.location?.state || '').toLowerCase();

        const matchesQuery =
          title.includes(query) ||
          desc.includes(query) ||
          cat.includes(query) ||
          subcat.includes(query) ||
          city.includes(query) ||
          state.includes(query);

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [requirements, selectedType, onlySaved, searchQuery, savedIds]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'all' || onlySaved;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setOnlySaved(false);
  };

  return (
    <div className="space-y-4 font-sans animate-fade-in">
      {/* ═══ Header Banner & Wallet / Bidding Overview ═══ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                <FiZap size={16} className="text-amber-700 fill-amber-500" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1a1a1a]">
                {bi('Broadcast Customer Requirements', 'ग्राहक आवश्यकताएं (Customer Broadcasts)')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {bi(
                'Live buyer requirements matched to your category and operational area. Submit quotes directly using your wallet credits under the transparent 0.2% bidding system.',
                'आपकी श्रेणी और क्षेत्र से मेल खाती लाइव खरीदार आवश्यकताएं। पारदर्शी 0.2% बिडिंग सिस्टम के तहत सीधे कोटेशन सबमिट करें।'
              )}
            </p>
          </div>

          {/* Quick Wallet Balance & Recharge Pill */}
          <div className="flex items-center gap-2.5 bg-[#f8f4ec] p-2.5 sm:p-3 rounded-2xl border border-[#e3dccb] shrink-0 self-start md:self-auto">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                {bi('Available Credits', 'उपलब्ध क्रेडिट')}
              </span>
              <span className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-1">
                <FiCreditCard size={14} className="text-amber-700" />
                {currentCredits.toFixed(2)} Cr
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/vendor/wallet?tab=plans')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer border border-amber-400"
            >
              {bi('Top Up', 'रीचार्ज')}
            </button>
          </div>
        </div>

        {/* ═══ Section 11 Bidding System Transparent Banner ═══ */}
        <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 rounded-xl p-3 border border-amber-200 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-extrabold text-[11px] text-amber-950 uppercase tracking-wide">
                <FiInfo size={13} className="text-amber-700" />
                {bi('Section 11 Bidding System:', 'सेक्शन 11 बिडिंग सिस्टम:')}
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-900 bg-white/90 px-2 py-0.5 rounded-md border border-amber-300">
                Final Bid = MIN(Price × 0.002, 20 Credits)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBiddingGuide(!showBiddingGuide)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition cursor-pointer"
            >
              <span>{showBiddingGuide ? bi('Hide Rate Table', 'दर तालिका छुपाएं') : bi('View Bidding Rates', 'बिडिंग दरें देखें')}</span>
              {showBiddingGuide ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
            </button>
          </div>

          {/* Expandable Rate Guide */}
          {showBiddingGuide && (
            <div className="pt-2 border-t border-amber-200/80 space-y-2 animate-fade-in text-[11px]">
              <p className="text-slate-700 leading-relaxed">
                {bi(
                  'Vendors pay a transparent success-based credit fee only when submitting a quote proposal. No monthly subscription lock-in. Credits are deducted from your common non-expiring wallet.',
                  'कोटेशन सबमिट करते समय ही क्रेडिट कटते हैं। कोई मासिक लॉक-इन नहीं है। क्रेडिट आपके लाइफटाइम वॉलेट से काटे जाते हैं।'
                )}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-sans">
                <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] block">₹1,000 Quotation</span>
                  <strong className="text-amber-950 font-black">2.00 Credits</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] block">₹5,000 Quotation</span>
                  <strong className="text-amber-950 font-black">10.00 Credits</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] block">₹10,000 Quotation</span>
                  <strong className="text-amber-950 font-black">20.00 Credits</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] block">₹20,000+ Quotation</span>
                  <strong className="text-emerald-800 font-black">20.00 Cr (Capped Max)</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Filter & Search Toolbar ═══ */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e3dccb] shadow-2xs space-y-3">
        {/* Row 1: Search, Distance, Sort, Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={bi('Search by keyword, category, city...', 'कीवर्ड, श्रेणी, शहर से खोजें...')}
              className="w-full pl-9 pr-8 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] placeholder:text-slate-400 focus:bg-white focus:border-amber-500 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Distance Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
              {bi('Distance:', 'दूरी:')}
            </span>
            <select
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="any">Any distance</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 hidden md:inline">
              {bi('Sort:', 'क्रमबद्ध:')}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="distance">Proximity (Nearest)</option>
              <option value="latest">Latest Posted</option>
              <option value="budget_high_low">Budget: High → Low</option>
              <option value="budget_low_high">Budget: Low → High</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="p-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-slate-600 hover:text-[#1a1a1a] hover:bg-[#ede5d8] transition cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
            title={bi('Refresh requirements', 'रिफ्रेश करें')}
          >
            <FiRefreshCw size={14} className={isRefreshing ? 'animate-spin text-amber-700' : ''} />
          </button>
        </div>

        {/* Row 2: Type Filter Pills & Bookmark Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#e3dccb]/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* All */}
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-amber-600 text-white shadow-2xs border border-amber-600'
                  : 'bg-[#f8f4ec] text-slate-600 border border-[#e3dccb] hover:bg-[#ede5d8]'
              }`}
            >
              <span>{bi('All Matches', 'सभी')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedType === 'all' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {requirements.length}
              </span>
            </button>

            {/* Products */}
            <button
              type="button"
              onClick={() => setSelectedType('product')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'product'
                  ? 'bg-amber-600 text-white shadow-2xs border border-amber-600'
                  : 'bg-[#f8f4ec] text-slate-600 border border-[#e3dccb] hover:bg-[#ede5d8]'
              }`}
            >
              <FiPackage size={12} />
              <span>{bi('Products', 'उत्पाद')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedType === 'product' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {productCount}
              </span>
            </button>

            {/* Services */}
            <button
              type="button"
              onClick={() => setSelectedType('service')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'service'
                  ? 'bg-amber-600 text-white shadow-2xs border border-amber-600'
                  : 'bg-[#f8f4ec] text-slate-600 border border-[#e3dccb] hover:bg-[#ede5d8]'
              }`}
            >
              <FiTool size={12} />
              <span>{bi('Services', 'सेवाएं')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedType === 'service' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {serviceCount}
              </span>
            </button>

            {/* Bookmarked Only */}
            <button
              type="button"
              onClick={() => setOnlySaved(!onlySaved)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                onlySaved
                  ? 'bg-amber-100 text-amber-950 border border-amber-400'
                  : 'bg-[#f8f4ec] text-slate-600 border border-[#e3dccb] hover:bg-[#ede5d8]'
              }`}
            >
              <FiBookmark size={12} className={onlySaved ? 'fill-amber-800 text-amber-900' : ''} />
              <span>{bi('Bookmarked', 'सहेजे गए')}</span>
              {savedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-amber-200 text-amber-900">
                  {savedCount}
                </span>
              )}
            </button>
          </div>

          {/* Reset Filters action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline transition cursor-pointer"
            >
              {bi('Clear Filters', 'फ़िल्टर हटाएं')}
            </button>
          )}
        </div>
      </div>

      {/* ═══ Requirements List or Empty State ═══ */}
      {filteredRequirements.length === 0 ? (
        <div className="py-14 px-4 text-center bg-white rounded-2xl border border-[#e3dccb] shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <FiSliders size={26} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="font-black text-sm sm:text-base text-[#1a1a1a]">
              {hasActiveFilters
                ? bi('No requirements match your filters', 'फ़िल्टर के अनुसार कोई आवश्यकता नहीं मिली')
                : bi('No matched requirements found right now', 'वर्तमान में कोई उपयुक्त आवश्यकता नहीं है')}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {hasActiveFilters
                ? bi('Try clearing search terms or widening your distance filters to find more leads.', 'अधिक परिणाम देखने के लिए खोज शब्द साफ़ करें या दूरी का दायरा बढ़ाएं।')
                : bi('New broadcast requirements from buyers matching your business categories and service areas will automatically appear here.', 'आपकी श्रेणी व सेवा क्षेत्र से मेल खाने वाली नई ग्राहक आवश्यकताएं यहां स्वचालित रूप से दिखाई देंगी।')}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#f8f4ec] border border-[#e3dccb] hover:bg-[#ede5d8] text-xs font-bold text-[#1a1a1a] rounded-xl transition cursor-pointer shadow-2xs"
            >
              {bi('Reset All Filters', 'सभी फ़िल्टर रीसेट करें')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {bi('Showing', 'प्रदर्शित')}{' '}
              <strong className="text-[#1a1a1a] font-bold">{filteredRequirements.length}</strong>{' '}
              {bi('requirements', 'आवश्यकताएं')}
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredRequirements.map((m) => {
              const reqId = m._id || m.id;
              const isSaved = savedIds.includes(reqId);
              return (
                <RequirementCard
                  key={reqId}
                  requirement={m}
                  currentUserId={currentUserId}
                  isSaved={isSaved}
                  onViewDetail={onViewDetail}
                  onOpenProposal={onOpenProposal}
                  onToggleSave={onToggleSave}
                  onMarkNotInterested={onMarkNotInterested}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
