import React, { useState, useEffect } from 'react';
import { FiCheck, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useGetCommissionConfigQuery, useUpdateGSTConfigMutation } from '../../../../features/admin/adminApi';

export default function GSTSettings() {
  const { data: config, isFetching: loading } = useGetCommissionConfigQuery();
  const [updateGST, { isLoading: updating }] = useUpdateGSTConfigMutation();

  const [form, setForm] = useState({
    gst_percentage: '',
    hsn_codes: '',
    tax_rules: '',
    reason: '',
  });

  useEffect(() => {
    if (config?.gst) {
      setForm({
        gst_percentage: config.gst.gst_percentage?.toString() || '18',
        hsn_codes: config.gst.hsn_codes?.join(', ') || '998314',
        tax_rules: config.gst.tax_rules || '',
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

    const formattedHSN = form.hsn_codes
      .split(',')
      .map(c => c.trim().replace(/\s+/g, ''))
      .filter(Boolean);

    const body = {
      gst_percentage: parseFloat(form.gst_percentage),
      hsn_codes: formattedHSN,
      tax_rules: form.tax_rules,
      reason: form.reason,
    };

    try {
      await updateGST(body).unwrap();
      toast.success('GST taxation rules updated successfully!');
      handleChange('reason', '');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="max-w-xl glass rounded-2xl p-5 border border-white/50 space-y-4 text-xs animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
        GST & Invoice Taxation Settings
      </h3>
      <p className="text-[10px] text-text-tertiary">
        Configure government tax compliance rules, active rates, and HSN codes used on subscription PDF invoices and wallet top-ups.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block mb-1 text-text-secondary font-bold uppercase tracking-wider text-[10px]">
            Global GST Rate (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 18"
              value={form.gst_percentage}
              onChange={(e) => handleChange('gst_percentage', e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-surface border border-border rounded-xl font-bold focus:outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-text-tertiary">%</span>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-text-secondary font-bold uppercase tracking-wider text-[10px]">
            HSN SAC Codes (comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. 998314, 998313"
            value={form.hsn_codes}
            onChange={(e) => handleChange('hsn_codes', e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl font-mono focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-text-secondary font-bold uppercase tracking-wider text-[10px]">
            Tax Invoice Description Rules
          </label>
          <textarea
            rows={3}
            placeholder="Describe how tax breakdown is displayed..."
            value={form.tax_rules}
            onChange={(e) => handleChange('tax_rules', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none resize-none"
          />
        </div>

        <div className="border-t border-border pt-4">
          <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Reason for Change *</label>
          <textarea
            rows={2}
            placeholder="Describe the legal compliance / business reason..."
            value={form.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={updating || loading}
          className="w-full px-6 py-2.5 bg-brand-purple text-white font-bold rounded-xl hover:bg-brand-purple/90 transition-all flex items-center justify-center gap-1.5 shadow-premium"
        >
          <FiCheck className="w-4 h-4" /> Save Taxation Policy
        </button>
      </form>
    </div>
  );
}
