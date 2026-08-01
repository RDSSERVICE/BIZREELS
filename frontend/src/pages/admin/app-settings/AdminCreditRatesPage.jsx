import React, { useState, useEffect } from 'react';
import { FiZap, FiCheck, FiSliders, FiPackage, FiVideo, FiImage, FiCpu, FiInbox, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

export default function AdminCreditRatesPage() {
  const [form, setForm] = useState({
    productListing: 1,
    reelPost: 1,
    aiImage: 2,
    aiVideo30s: 15,
    reelBoost1Day: 10,
    validLead: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await api.get('/v1/admin/credit-rates');
        if (res.data?.success || res.success) {
          const rates = res.data?.data || res.data || res;
          setForm({
            productListing: Number(rates.productListing ?? 1),
            reelPost: Number(rates.reelPost ?? 1),
            aiImage: Number(rates.aiImage ?? 2),
            aiVideo30s: Number(rates.aiVideo30s ?? 15),
            reelBoost1Day: Number(rates.reelBoost1Day ?? 10),
            validLead: Number(rates.validLead ?? 1),
          });
        }
      } catch (err) {
        console.error('Failed to load credit rates:', err);
        toast.error('Failed to load current rates from database');
      } finally {
        setLoading(false);
      }
    };
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

  const rateConfig = [
    { key: 'productListing', label: '1 Product Listing', icon: FiPackage, color: 'purple', desc: 'Credits deducted when a vendor publishes a product listing.' },
    { key: 'reelPost', label: '1 Reel Post', icon: FiVideo, color: 'violet', desc: 'Credits consumed when uploading/publishing a business reel.' },
    { key: 'aiImage', label: '1 AI Image Generation', icon: FiImage, color: 'emerald', desc: 'Credits deducted for each AI image generated via AI Studio.' },
    { key: 'aiVideo30s', label: '30 sec AI Video Generation', icon: FiCpu, color: 'blue', desc: 'Credits charged to generate a short AI marketing/promotional video.' },
    { key: 'reelBoost1Day', label: '1 Reel Boost (1 Day)', icon: FiZap, color: 'amber', desc: 'Credits per day to highlight and pin a reel in local search & feeds.' },
    { key: 'validLead', label: '1 Valid Lead / Customer Contact', icon: FiInbox, color: 'rose', desc: 'Credits charged to unlock lead details / direct chat inquiries.' },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiZap}
        title="Credit Consumption Rates Configuration"
        subtitle="Manage dynamic admin rates for vendor listings, reel posts, AI generation, boosting, and lead acquisitions"
      />

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-xs text-text-tertiary">
          Fetching credit configuration parameters...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/50 shadow-glass space-y-6">
            <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-4 border-b border-border pb-3 flex items-center gap-2">
              <FiSliders /> Dynamic Admin Credit Consumption Rates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rateConfig.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="glass p-5 rounded-2xl border border-white/20 flex gap-4 items-start hover:border-white/40 transition-all">
                    <div className={`p-3 rounded-xl bg-${item.color}-500/10 text-${item.color}-500 shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-text-primary">{item.label}</label>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            required
                            value={form[item.key]}
                            onChange={(e) => handleChange(item.key, e.target.value)}
                            className="w-16 px-2 py-1 bg-surface border border-border rounded-lg text-xs font-bold text-center text-text-primary focus:outline-none focus:border-brand-purple"
                          />
                          <span className="text-[10px] text-text-tertiary font-bold uppercase">CR</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-tertiary leading-relaxed pr-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <FiTrendingUp />
                <span>Changes update active vendor consumption rates immediately.</span>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium disabled:opacity-50"
              >
                <FiCheck /> {saving ? 'Saving...' : 'Save Credit Rates'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
