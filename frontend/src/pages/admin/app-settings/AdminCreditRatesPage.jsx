import React, { useState, useEffect } from 'react';
import { FiZap, FiCheck, FiSliders, FiPackage, FiVideo, FiImage, FiCpu, FiInbox, FiTrendingUp, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

export default function AdminCreditRatesPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper mappings for icons
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

  const keys = Object.keys(form);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans p-2 sm:p-4 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiZap}
        title="CREDIT CONSUMPTION RATES"
        subtitle="Manage dynamic admin rates for vendor listings, reel posts, AI generation, boosting, and lead acquisitions"
      >
        <button
          type="button"
          onClick={() => fetchRates(true)}
          className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none"
        >
          <FiRefreshCw size={14} /> Sync Database Rates
        </button>
      </AdminPageHeader>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs font-bold text-slate-400 border border-[#e3dccb] shadow-2xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#241b15] border-t-transparent rounded-full animate-spin" />
          <span>Fetching credit configuration parameters...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e3dccb] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3 mb-2">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xs sm:text-sm uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <FiSliders className="text-[#d99a3d]" size={18} /> CONFIGURATION DASHBOARD
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase text-[#241b15] bg-[#f8f4ec] border border-[#e3dccb] rounded">
                {keys.length} ACTIVE RATES
              </span>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400">
                No credit rates found in database. Click Save to initialize defaults.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keys.map((key, index) => {
                  const Icon = getIcon(key);
                  const val = form[key] || 0;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="bg-[#f8f4ec] p-4.5 rounded-2xl border border-[#e3dccb] flex gap-4 items-start hover:border-[#241b15] transition-all shadow-2xs relative group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#241b15] text-[#d99a3d] border border-[#241b15] flex items-center justify-center shrink-0 shadow-xs">
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-center gap-2">
                          <label className="text-xs font-black text-[#1a1a1a] truncate">
                            {formatLabel(key)}
                          </label>
                          
                          <div className="flex items-center bg-white border border-[#e3dccb] rounded-xl px-1 py-0.5 shrink-0 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => adjustValue(key, -1)}
                              className="p-1 hover:bg-[#241b15] hover:text-[#d99a3d] text-[#1a1a1a] rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              required
                              value={val}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-10 bg-transparent border-0 text-xs font-black text-center text-[#1a1a1a] focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => adjustValue(key, 1)}
                              className="p-1 hover:bg-[#241b15] hover:text-[#d99a3d] text-[#1a1a1a] rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] text-slate-400 font-black pr-1 pl-0.5 select-none uppercase">CR</span>
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {getDesc(key)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t border-[#e3dccb] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-amber-900 font-bold bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-300 w-full sm:w-auto">
                <FiTrendingUp className="text-amber-700 shrink-0" />
                <span>Changes update active vendor credit consumption thresholds instantly.</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer border-none"
              >
                <FiCheck size={16} /> {saving ? 'Updating Config...' : 'Update Credit Rates'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

