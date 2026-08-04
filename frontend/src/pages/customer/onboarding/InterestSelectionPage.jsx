import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiGrid, FiZap, FiChevronRight } from 'react-icons/fi';
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
    <div className="min-h-[80vh] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 mx-auto rounded-2xl gradient-brand flex items-center justify-center shadow-premium mb-4"
        >
          <FiGrid className="text-white" size={28} />
        </motion.div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-black text-text-primary font-display"
        >
          Choose Your <span className="gradient-text">Interests</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-text-tertiary mt-2 max-w-md mx-auto"
        >
          Select at least <strong className="text-brand-purple">5 categories</strong> that interest you.
          We'll personalize your reels & posts feed based on your choices.
        </motion.p>
      </div>

      {/* Selection Counter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 border border-white/40 shadow-card mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
            selected.length >= 5
              ? 'gradient-brand text-white shadow-premium'
              : 'bg-surface-tertiary text-text-tertiary'
          }`}>
            {selected.length}
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary">
              {selected.length >= 5 ? '✨ Great selection!' : `${5 - selected.length} more needed`}
            </p>
            <p className="text-[10px] text-text-tertiary">
              {selected.length >= 5
                ? 'You can continue or add more interests'
                : 'Select categories & subcategories below'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(Math.min(10, Math.max(5, selected.length)))].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < selected.length ? 'bg-brand-purple scale-110' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Reusable Category Selector Grid */}
      <div className="mb-8">
        <InterestSelector selected={selected} setSelected={setSelected} />
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="sticky bottom-6 z-20"
      >
        <button
          onClick={handleContinue}
          disabled={selected.length < 5 || saving}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-premium ${
            selected.length >= 5
              ? 'gradient-brand text-white hover:opacity-95 hover:shadow-lg'
              : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Your Interests...
            </>
          ) : (
            <>
              <FiZap size={16} />
              {selected.length >= 5
                ? `Continue with ${selected.length} Interests`
                : `Select ${5 - selected.length} More to Continue`}
              <FiChevronRight size={14} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
