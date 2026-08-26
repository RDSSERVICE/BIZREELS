import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiGrid, FiZap, FiChevronRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import InterestSelector from '../../../components/app/InterestSelector';

export default function InterestSelectionPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { refetch } = useGetMeQuery();
  const [selected, setSelected] = useState([]); // array of { category, subcategory }
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (selected.length < 5) {
      toast.error('Please select at least 5 interests to personalize your feed');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/v1/users/me/interests', { interests: selected });
      toast.success('Interests saved! Your feed is now personalized 🎯');
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
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-[85vh] animate-fade-in pb-20">
      {/* ── 1. HEADER BANNER IN PERSONAL INFO / ONBOARDING STYLE ── */}
      <div className="bg-[#241b15] text-white p-6 sm:p-8 rounded-2xl border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            CUSTOMER ONBOARDING • PERSONALIZED EXPERIENCE
          </span>
          <h1
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-xl sm:text-2xl uppercase tracking-wide text-white"
          >
            CHOOSE YOUR FEED INTERESTS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Select at least <strong className="text-[#d99a3d]">5 categories &amp; subcategories</strong> that you love. 
            We'll customize your reels, marketplace listings, and local promotions based on your choices.
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a] shadow-xs">
          <FiGrid size={22} />
        </div>
      </div>

      {/* ── 2. SELECTION COUNTER BAR ── */}
      <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
            selected.length >= 5
              ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] shadow-2xs'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {selected.length}
          </div>
          <div>
            <p className="text-xs font-black text-[#1a1a1a] uppercase tracking-wide">
              {selected.length >= 5 ? '✨ Minimum Requirement Met!' : `${5 - selected.length} more needed to continue`}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {selected.length >= 5
                ? 'Great choices! You can continue now or add more categories below.'
                : 'Search or browse categories below to choose your interests.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className={`text-[10.5px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
            selected.length >= 5
              ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border border-[#d99a3d]/40'
              : 'bg-red-500/10 text-red-700 border border-red-200'
          }`}>
            {selected.length} / 5 Selected
          </span>

          <button
            onClick={handleContinue}
            disabled={selected.length < 5 || saving}
            className="px-5 py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-black rounded-xl text-xs uppercase tracking-wider shadow-2xs transition cursor-pointer flex items-center gap-2 border border-[#1a1a1a] disabled:opacity-50"
          >
            <FiZap size={14} />
            <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
          </button>
        </div>
      </div>

      {/* ── 3. MAIN INTEREST SELECTOR WITH LIVE SEARCH & FILTERING MENU ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e3dccb] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d99a3d]" />
              Explore All Categories &amp; Subcategories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Use the search bar to quickly find any specific product or service niche
            </p>
          </div>
        </div>

        <InterestSelector 
          selected={selected} 
          setSelected={setSelected} 
          showSearch={true}
          theme="settings"
        />
      </div>

      {/* ── 4. STICKY BOTTOM SUBMIT ACTION ── */}
      <div className="sticky bottom-4 z-20 pt-2">
        <button
          onClick={handleContinue}
          disabled={selected.length < 5 || saving}
          className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
            selected.length >= 5
              ? 'bg-[#241b15] text-[#d99a3d] hover:bg-[#1a1a1a] border border-[#241b15] cursor-pointer'
              : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-[#d99a3d]/30 border-t-[#d99a3d] rounded-full animate-spin" />
              <span>Saving Your Interests...</span>
            </>
          ) : (
            <>
              <FiZap size={16} />
              <span>
                {selected.length >= 5
                  ? `Save & Continue with ${selected.length} Interests`
                  : `Select ${5 - selected.length} More Categories to Continue`}
              </span>
              <FiChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
