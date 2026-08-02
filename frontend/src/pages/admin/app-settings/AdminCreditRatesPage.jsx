import React, { useState, useEffect } from 'react';
import { FiZap, FiCheck, FiSliders, FiPackage, FiVideo, FiImage, FiCpu, FiInbox, FiTrendingUp, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

export default function AdminCreditRatesPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper mappings for icons, colors, and descriptions
  const getIcon = (key) => {
    const icons = {
      productListing: FiPackage,
      reelPost: FiVideo,
      aiImage: FiImage,
      aiVideo30s: FiCpu,
      reelBoost1Day: FiZap,
      validLead: FiInbox,
    };
    return icons[key] || FiZap;
  };

  const getColor = (key) => {
    const colors = {
      productListing: 'purple',
      reelPost: 'violet',
      aiImage: 'emerald',
      aiVideo30s: 'blue',
      reelBoost1Day: 'amber',
      validLead: 'rose',
    };
    return colors[key] || 'purple';
  };

  const getDesc = (key) => {
    const descs = {
      productListing: 'Credits deducted when a vendor publishes a product listing.',
      reelPost: 'Credits consumed when uploading/publishing a business reel.',
      aiImage: 'Credits deducted for each AI image generated via AI Studio.',
      aiVideo30s: 'Credits charged to generate a short AI marketing/promotional video.',
      reelBoost1Day: 'Credits per day to highlight and pin a reel in local search & feeds.',
      validLead: 'Credits charged to unlock lead details / direct chat inquiries.',
    };
    return descs[key] || 'Credits consumed for this action.';
  };

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const fetchRates = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/v1/admin/credit-rates');
      if (res.data?.success) {
        const rates = res.data?.data || {};
        setForm(rates);
        if (silent) toast.success('Rates synced with database!');
      } else {
        setForm(res.data || {});
      }
    } catch (err) {
      console.error('Failed to load credit rates:', err);
      toast.error('Failed to load current rates from database');
      setForm({
        productListing: 1,
        reelPost: 1,
        aiImage: 2,
        aiVideo30s: 15,
        reelBoost1Day: 10,
        validLead: 1,
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving credit rates...');
    try {
      await api.post('/v1/admin/credit-rates', { rates: form });
      toast.success('Credit consumption rates updated successfully!', { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Save failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, val) => {
    setForm((prev) => ({
      ...prev,
      [key]: Number(val) >= 0 ? Number(val) : 0,
    }));
  };

  const adjustValue = (key, delta) => {
    setForm((prev) => {
      const current = prev[key] || 0;
      const nextVal = current + delta;
      return {
        ...prev,
        [key]: nextVal >= 0 ? nextVal : 0,
      };
    });
  };

  // Generate dynamic array of configuration cards based on fetched keys
  const keys = Object.keys(form);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiZap}
        title="Credit Consumption Rates"
        subtitle="Manage dynamic admin rates for vendor listings, reel posts, AI generation, boosting, and lead acquisitions"
      >
        <button
          type="button"
          onClick={() => fetchRates(true)}
          className="px-4 py-2 bg-white border border-border text-brand-purple rounded-xl text-xs font-bold hover:bg-brand-purple/5 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <FiZap className="w-3.5 h-3.5" /> Refresh / Sync Rates
        </button>
      </AdminPageHeader>

      {loading ? (
        <div className="glass rounded-3xl p-12 text-center text-xs text-text-tertiary shadow-glass flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <span>Fetching credit configuration parameters...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/50 shadow-glass space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider flex items-center gap-2">
                <FiSliders className="text-brand-purple" /> Dynamic Configuration Dashboard
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-black uppercase text-brand-purple bg-brand-purple/15 rounded-full">
                {keys.length} Active Rates
              </span>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-tertiary">
                No credit rates found in database. Click Save to initialize defaults.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {keys.map((key, index) => {
                  const Icon = getIcon(key);
                  const color = getColor(key);
                  const val = form[key] || 0;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="glass p-5 rounded-2xl border border-white/20 flex gap-4 items-start hover:border-brand-purple/30 hover:shadow-md hover:scale-[1.01] transition-all duration-300 relative group"
                    >
                      {/* Left icon wrapper */}
                      <div className={`p-3.5 rounded-2xl shrink-0 bg-${color}-500/10 text-${color}-500 group-hover:bg-${color}-500/20 transition-colors duration-300`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content & Input controls */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <label className="text-xs font-bold text-brand-navy font-display leading-tight">
                            {formatLabel(key)}
                          </label>
                          
                          {/* Premium interactive numeric controller */}
                          <div className="flex items-center bg-surface-secondary border border-border rounded-xl px-1 py-0.5 shrink-0 shadow-inner">
                            <button
                              type="button"
                              onClick={() => adjustValue(key, -1)}
                              className="p-1 hover:bg-white text-text-secondary hover:text-brand-navy rounded-lg transition-colors cursor-pointer"
                            >
                              <FiMinus className="w-2.5 h-2.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              required
                              value={val}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-10 bg-transparent border-0 text-xs font-black text-center text-brand-navy focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => adjustValue(key, 1)}
                              className="p-1 hover:bg-white text-text-secondary hover:text-brand-navy rounded-lg transition-colors cursor-pointer"
                            >
                              <FiPlus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[8px] text-text-tertiary font-bold pr-1.5 pl-0.5 select-none uppercase">CR</span>
                          </div>
                        </div>
                        
                        <p className="text-[10px] text-text-secondary leading-relaxed pr-2 font-medium">
                          {getDesc(key)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Bottom actions row */}
            <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] text-amber-600 font-semibold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                <FiTrendingUp />
                <span>Changes update active vendor credit consumption thresholds instantly.</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-premium disabled:opacity-50 cursor-pointer"
              >
                <FiCheck className="w-4 h-4" /> {saving ? 'Updating Config...' : 'Update Credit Rates'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
