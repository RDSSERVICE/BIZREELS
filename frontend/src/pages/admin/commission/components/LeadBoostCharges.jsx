import React, { useState, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useGetCommissionConfigQuery, useUpdateLeadBoostConfigMutation } from '../../../../features/admin/adminApi';

export default function LeadBoostCharges() {
  const { data: config, isFetching: loading } = useGetCommissionConfigQuery();
  const [updateLeadBoost, { isLoading: updating }] = useUpdateLeadBoostConfigMutation();

  const [form, setForm] = useState({
    lead_cost_credits: '',
    featured_listing_credits: '',
    reel_boost_credits: '',
    ai_promotion_credits: '',
    ad_charge_credits: '',
    reason: '',
  });

  useEffect(() => {
    if (config?.lead_boost) {
      setForm({
        lead_cost_credits: config.lead_boost.lead_cost_credits?.toString() || '10',
        featured_listing_credits: config.lead_boost.featured_listing_credits?.toString() || '50',
        reel_boost_credits: config.lead_boost.reel_boost_credits?.toString() || '25',
        ai_promotion_credits: config.lead_boost.ai_promotion_credits?.toString() || '15',
        ad_charge_credits: config.lead_boost.ad_charge_credits?.toString() || '100',
        reason: '',
      });
    }
  }, [config]);

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason) return toast.error('Audit trail reason is required');

    const body = {
      lead_cost_credits: parseInt(form.lead_cost_credits),
      featured_listing_credits: parseInt(form.featured_listing_credits),
      reel_boost_credits: parseInt(form.reel_boost_credits),
      ai_promotion_credits: parseInt(form.ai_promotion_credits),
      ad_charge_credits: parseInt(form.ad_charge_credits),
      reason: form.reason,
    };

    try {
      await updateLeadBoost(body).unwrap();
      toast.success('Lead and boosting credit rules updated!');
      handleChange('reason', '');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const fields = [
    { key: 'lead_cost_credits', label: 'Lead Cost (per lead)', desc: 'Credits deducted from vendors to unlock customer inquiries / RFQ details.' },
    { key: 'featured_listing_credits', label: 'Featured Listing Boost (per week)', desc: 'Credits charged to pin listings to top of categories & searches.' },
    { key: 'reel_boost_credits', label: 'Reel Boosting Charge', desc: 'Deducted when creators or vendors run outreach campaigns on video reels.' },
    { key: 'ai_promotion_credits', label: 'AI Sponsored Promotion Campaign', desc: 'Charges for utilizing AI assistant search-promoted listing positions.' },
    { key: 'ad_charge_credits', label: 'Banner & Custom Ad Credit Cost', desc: 'Credit deductions for running portal-wide display ads.' },
  ];

  return (
    <div className="max-w-3xl glass rounded-2xl p-5 border border-white/50 space-y-4 text-xs animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Lead Acquisition & Ad Boost Configurations</h3>
      <p className="text-[10px] text-text-tertiary">
        Configure the value of digital wallet credits charged for business actions and outreach boosts across the portal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="block text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                {f.label}
              </label>
              <p className="text-[9px] text-text-tertiary leading-normal">{f.desc}</p>
              <div className="relative pt-1">
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="w-full pl-3 pr-14 py-2 bg-surface border border-border rounded-xl font-bold focus:outline-none focus:border-brand-purple"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-[10px] font-bold text-text-tertiary">credits</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Reason for updates *</label>
          <textarea
            rows={2}
            placeholder="Audit trail logs require explanation for changing billing rules..."
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={updating || loading}
          className="w-full md:w-auto px-6 py-2.5 bg-brand-purple text-white font-bold rounded-xl hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-1.5 shadow-premium"
        >
          <FiCheck className="w-4 h-4" /> Save Boosting Configurations
        </button>
      </form>
    </div>
  );
}
