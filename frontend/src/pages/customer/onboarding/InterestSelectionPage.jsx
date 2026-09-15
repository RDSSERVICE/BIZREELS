import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiZap, FiChevronRight, FiCheck, FiTarget, FiStar, FiCheckCircle } from 'react-icons/fi';
import { HiSparkles as FiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import InterestSelector from '../../../components/app/InterestSelector';

const POPULAR_PACKS = [
  {
    name: '🤖 AI & Tech Explorer',
    items: [
      { category: 'AI & Technology Services', subcategory: 'AI Video Generation & Editing' },
      { category: 'AI & Technology Services', subcategory: 'AI Chatbot & Automation Setup' },
      { category: 'Electronics & Tech', subcategory: 'Laptops & Computers' },
      { category: 'IT, Design & Marketing', subcategory: 'Website & App Development' },
      { category: 'Electronics & Tech', subcategory: 'Mobile Phones' },
    ]
  },
  {
    name: '🛍️ Fashion & Lifestyle',
    items: [
      { category: 'Fashion & Apparel', subcategory: 'Men Clothing' },
      { category: 'Fashion & Apparel', subcategory: 'Women Clothing' },
      { category: 'Fashion & Apparel', subcategory: 'Footwear' },
      { category: 'Beauty & Salon', subcategory: 'Spa & Wellness' },
      { category: 'Beauty & Salon', subcategory: 'Women Beauty & Makeup' },
    ]
  },
  {
    name: '🍕 Food & Entertainment',
    items: [
      { category: 'Food & Grocery', subcategory: 'Restaurants & Cafes' },
      { category: 'Food & Grocery', subcategory: 'Bakery & Sweets' },
      { category: 'Events & Wedding Services', subcategory: 'DJ & Sound System' },
      { category: 'Events & Wedding Services', subcategory: 'Catering & Food Counter' },
      { category: 'Food & Grocery', subcategory: 'Fresh Grocery' },
    ]
  }
];

export default function InterestSelectionPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { refetch } = useGetMeQuery();
  const [selected, setSelected] = useState([]); // array of { category, subcategory }
  const [saving, setSaving] = useState(false);

  const minRequired = 5;
  const progressPercent = Math.min(100, Math.round((selected.length / minRequired) * 100));

  const handleApplyPack = (packItems) => {
    // Merge new pack items into selected without duplicates
    const merged = [...selected];
    packItems.forEach(item => {
      const exists = merged.some(
        s => s.category === item.category && s.subcategory === (item.subcategory || null)
      );
      if (!exists) {
        merged.push(item);
      }
    });
    setSelected(merged);
    toast.success(`Applied ${packItems.length} interest recommendations! ✨`);
  };

  const handleContinue = async () => {
    if (selected.length < minRequired) {
      toast.error(`Please select at least ${minRequired} interests to personalize your feed`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/v1/users/me/interests', { interests: selected });
      toast.success('Interests saved! Your feed is now fully personalized 🎯');
      const refetchRes = await refetch();
      const updatedUser = refetchRes.data?.user || refetchRes.data || res.data?.user || res.data?.data?.user;
      if (updatedUser) {
        dispatch(setCredentials({ user: updatedUser }));
      }
      navigate('/customer/home', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save interests';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans p-3 sm:p-6 min-h-[85vh] animate-fade-in pb-28">
      {/* ── 1. PREMIUM HERO BANNER WITH GRADIENT ACCENTS ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1c140e] via-[#241b15] to-[#120d09] text-white p-6 sm:p-8 rounded-3xl border-2 border-[#38281d] shadow-xl">
        {/* Glow ambient circle */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#d99a3d]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d99a3d]/20 border border-[#d99a3d]/40 text-[#d99a3d] text-[10px] font-black uppercase tracking-widest">
              <FiSparkles size={12} className="animate-pulse" />
              <span>Personalized Recommendation Engine</span>
            </div>

            <h1
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-2xl sm:text-3xl uppercase tracking-wide text-white drop-shadow-xs"
            >
              Curate Your Video Feed &amp; Market
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pick at least <strong className="text-[#d99a3d] font-black">{minRequired} categories &amp; subcategories</strong> that reflect your taste. We use these preferences to rank local Reels, exclusive offers, and business leads tailored just for you.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4 bg-[#140e0a]/80 p-4 rounded-2xl border border-[#38281d] shadow-inner">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-[#d99a3d] transition-all duration-500 ease-out"
                  fill="transparent"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black text-[#d99a3d]">
                {selected.length}/{minRequired}
              </span>
            </div>

            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">
                {selected.length >= minRequired ? '✨ Goal Unlocked!' : 'Selection Progress'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {selected.length >= minRequired ? 'Ready to launch feed!' : `${minRequired - selected.length} more needed`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. QUICK RECOMENDED STARTER PACKS ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e3dccb] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
            Quick One-Click Starter Packs:
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Instantly add curated category bundles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POPULAR_PACKS.map((pack) => (
            <button
              key={pack.name}
              type="button"
              onClick={() => handleApplyPack(pack.items)}
              className="p-3 bg-slate-50 hover:bg-[#f8f4ec] border border-slate-200 hover:border-[#d99a3d] rounded-xl text-left transition duration-200 cursor-pointer group flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-black text-[#1a1a1a] group-hover:text-[#241b15]">
                  {pack.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Includes {pack.items.length} top categories
                </p>
              </div>
              <span className="text-xs font-black text-[#d99a3d] bg-white group-hover:bg-[#241b15] px-2 py-1 rounded-lg border border-slate-200 group-hover:border-[#241b15] transition">
                + Add
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. LIVE SEARCH & CATEGORY SELECTOR CARD ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d]" />
              Explore All Categories &amp; Subcategories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any category or specific subcategories to customize your personal feed algorithm
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10.5px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
              selected.length >= minRequired
                ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border border-[#d99a3d]/40'
                : 'bg-red-500/10 text-red-700 border border-red-200'
            }`}>
              {selected.length} / {minRequired} Minimum
            </span>
          </div>
        </div>

        <InterestSelector 
          selected={selected} 
          setSelected={setSelected} 
          showSearch={true}
          theme="onboarding"
        />
      </div>

      {/* ── 4. STICKY FLOATING ACTION BAR ── */}
      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 max-w-5xl mx-auto pointer-events-none">
        <div className="pointer-events-auto bg-[#241b15]/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#38281d] shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
              selected.length >= minRequired
                ? 'bg-[#d99a3d] text-[#1a1a1a] shadow-xs'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selected.length >= minRequired ? <FiCheckCircle size={20} /> : selected.length}
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">
                {selected.length >= minRequired
                  ? `🎯 Ready to Launch (${selected.length} Selected)`
                  : `Pick ${minRequired - selected.length} More Categories`}
              </p>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                {selected.length >= minRequired
                  ? 'Click continue to apply algorithm changes to your Reels feed.'
                  : `At least ${minRequired} choices are required for best content matching.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={selected.length < minRequired || saving}
            className={`px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer shrink-0 border ${
              selected.length >= minRequired
                ? 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] border-[#1a1a1a]'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin" />
                <span>Applying Preferences...</span>
              </>
            ) : (
              <>
                <FiZap size={16} />
                <span>
                  {selected.length >= minRequired
                    ? 'Save Preferences & View Feed'
                    : `Select ${minRequired - selected.length} More`}
                </span>
                <FiChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
