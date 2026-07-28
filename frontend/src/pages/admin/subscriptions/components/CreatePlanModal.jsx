import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { useCreateSubscriptionPlanMutation, useUpdateSubscriptionPlanMutation } from '../../../../features/admin/adminApi';

export default function CreatePlanModal({ isOpen, onClose, editingPlan }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    plan_type: 'basic',
    user_type: 'vendor',
    billing_cycle: 'monthly',
    price_inr: '',
    duration_days: '30',
    discount_percentage: '0',
    // Limits
    product_limit: '',
    service_limit: '',
    reels_limit: '',
    leads_limit: '',
    ai_credits: '0',
    // Feature flags
    verified_badge: true,
    priority_support: false,
    analytics_access: false,
    priority_ranking: false,
  });

  const [createPlan, { isLoading: creating }] = useCreateSubscriptionPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdateSubscriptionPlanMutation();

  useEffect(() => {
    if (editingPlan) {
      setForm({
        title: editingPlan.title || '',
        description: editingPlan.description || '',
        plan_type: editingPlan.plan_type || 'basic',
        user_type: editingPlan.user_type || 'vendor',
        billing_cycle: editingPlan.billing_cycle || 'monthly',
        price_inr: editingPlan.price_inr || '',
        duration_days: editingPlan.duration_days || '30',
        discount_percentage: editingPlan.discount_percentage || '0',
        product_limit: editingPlan.product_limit ?? '',
        service_limit: editingPlan.service_limit ?? '',
        reels_limit: editingPlan.reels_limit ?? '',
        leads_limit: editingPlan.leads_limit ?? '',
        ai_credits: editingPlan.ai_credits || '0',
        verified_badge: editingPlan.verified_badge ?? true,
        priority_support: editingPlan.priority_support ?? false,
        analytics_access: editingPlan.analytics_access ?? false,
        priority_ranking: editingPlan.priority_ranking ?? false,
      });
    } else {
      setForm({
        title: '',
        description: '',
        plan_type: 'basic',
        user_type: 'vendor',
        billing_cycle: 'monthly',
        price_inr: '',
        duration_days: '30',
        discount_percentage: '0',
        product_limit: '',
        service_limit: '',
        reels_limit: '',
        leads_limit: '',
        ai_credits: '0',
        verified_badge: true,
        priority_support: false,
        analytics_access: false,
        priority_ranking: false,
      });
    }
  }, [editingPlan, isOpen]);

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Plan title is required');
    if (form.price_inr === '' || parseFloat(form.price_inr) < 0) return toast.error('Valid price is required');

    const formattedData = {
      ...form,
      price_inr: parseFloat(form.price_inr),
      duration_days: parseInt(form.duration_days),
      discount_percentage: parseFloat(form.discount_percentage || 0),
      product_limit: form.product_limit === '' ? null : parseInt(form.product_limit),
      service_limit: form.service_limit === '' ? null : parseInt(form.service_limit),
      reels_limit: form.reels_limit === '' ? null : parseInt(form.reels_limit),
      leads_limit: form.leads_limit === '' ? null : parseInt(form.leads_limit),
      ai_credits: parseInt(form.ai_credits || 0),
    };

    try {
      if (editingPlan) {
        await updatePlan({ id: editingPlan.id, ...formattedData }).unwrap();
        toast.success('Subscription plan updated!');
      } else {
        await createPlan(formattedData).unwrap();
        toast.success('Subscription plan created!');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Operation failed');
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Plan Title *</label>
            <input
              type="text"
              placeholder="e.g. Creator Premium"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Tier Level</label>
            <select
              value={form.plan_type}
              onChange={(e) => handleChange('plan_type', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-purple"
            >
              <option value="basic">Basic Tier</option>
              <option value="standard">Standard Tier</option>
              <option value="premium">Premium Tier</option>
              <option value="enterprise">Enterprise Tier</option>
              <option value="custom">Custom Tier</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Description</label>
          <textarea
            rows={2}
            placeholder="Plan description..."
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-purple resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Target Audience</label>
            <select
              value={form.user_type}
              onChange={(e) => handleChange('user_type', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
            >
              <option value="vendor">Vendors</option>
              <option value="creator">Creators</option>
              <option value="all">All Users</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Billing Cycle</label>
            <select
              value={form.billing_cycle}
              onChange={(e) => handleChange('billing_cycle', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Price (INR) *</label>
            <input
              type="number"
              placeholder="e.g. 999"
              value={form.price_inr}
              onChange={(e) => handleChange('price_inr', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Duration (Days)</label>
            <input
              type="number"
              value={form.duration_days}
              onChange={(e) => handleChange('duration_days', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discount_percentage}
              onChange={(e) => handleChange('discount_percentage', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <h3 className="text-[10px] font-bold text-text-tertiary uppercase border-b border-border pb-1 mt-2">Usage Limits (Leave blank for Unlimited)</h3>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block mb-1 text-text-tertiary text-[9px]">Listings</label>
            <input
              type="number"
              placeholder="∞"
              value={form.product_limit}
              onChange={(e) => handleChange('product_limit', e.target.value)}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary text-[9px]">Services</label>
            <input
              type="number"
              placeholder="∞"
              value={form.service_limit}
              onChange={(e) => handleChange('service_limit', e.target.value)}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary text-[9px]">Reels</label>
            <input
              type="number"
              placeholder="∞"
              value={form.reels_limit}
              onChange={(e) => handleChange('reels_limit', e.target.value)}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 text-text-tertiary text-[9px]">Leads</label>
            <input
              type="number"
              placeholder="∞"
              value={form.leads_limit}
              onChange={(e) => handleChange('leads_limit', e.target.value)}
              className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-text-tertiary font-bold uppercase tracking-wider text-[10px]">AI Monthly Credits</label>
          <input
            type="number"
            value={form.ai_credits}
            onChange={(e) => handleChange('ai_credits', e.target.value)}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl focus:outline-none"
          />
        </div>

        <h3 className="text-[10px] font-bold text-text-tertiary uppercase border-b border-border pb-1 mt-2">Premium Features</h3>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.verified_badge}
              onChange={(e) => handleChange('verified_badge', e.target.checked)}
              className="rounded text-brand-purple focus:ring-brand-purple w-4 h-4"
            />
            <span>Verification Badge</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.priority_ranking}
              onChange={(e) => handleChange('priority_ranking', e.target.checked)}
              className="rounded text-brand-purple focus:ring-brand-purple w-4 h-4"
            />
            <span>Priority Search Ranking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.priority_support}
              onChange={(e) => handleChange('priority_support', e.target.checked)}
              className="rounded text-brand-purple focus:ring-brand-purple w-4 h-4"
            />
            <span>Priority Support (24/7)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.analytics_access}
              onChange={(e) => handleChange('analytics_access', e.target.checked)}
              className="rounded text-brand-purple focus:ring-brand-purple w-4 h-4"
            />
            <span>Advanced Analytics Dashboard</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={creating || updating}
          className="w-full py-2.5 bg-brand-purple text-white rounded-xl font-bold hover:bg-brand-purple/90 transition-all disabled:opacity-50 mt-4"
        >
          {creating || updating ? 'Saving Plan...' : editingPlan ? 'Update Plan' : 'Create Plan'}
        </button>
      </form>
    </AdminModal>
  );
}
