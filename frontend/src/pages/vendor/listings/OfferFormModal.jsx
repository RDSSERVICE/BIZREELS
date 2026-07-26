import React, { useState, useEffect } from 'react';
import { FiPercent, FiCalendar, FiTag, FiGift, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminModal from '../../../features/admin/components/AdminModal';

const OFFER_TYPES = [
  { value: 'percentage', label: 'Percentage Discount', icon: '🏷️' },
  { value: 'fixed', label: 'Flat Discount', icon: '💰' },
  { value: 'bogo', label: 'Buy One Get One', icon: '🎁' },
  { value: 'bundle', label: 'Bundle Offer', icon: '📦' },
  { value: 'festival', label: 'Festival Offer', icon: '🎊' },
  { value: 'flash_sale', label: 'Flash Sale', icon: '⚡' },
  { value: 'limited_time', label: 'Limited Time Offer', icon: '⏰' },
];

const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getNowDate = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BIZ';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

/**
 * OfferFormModal — Complete dynamic offer creation/editing system
 * Supports: Percentage, Flat, BOGO, Bundle, Festival, Flash Sale, Limited Time offers
 */
export default function OfferFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  allListings = [],
}) {
  const isEdit = !!editData;

  const [form, setForm] = useState({
    title: '',
    description: 'Special seasonal promotion discount',
    offerType: 'percentage',
    discountType: 'percentage',
    discountValue: 15,
    couponCode: generateCouponCode(),
    startDate: getNowDate(),
    endDate: getNextWeekDate(),
    targetProducts: [],
    targetServices: [],
    usageLimit: '',
    bannerImage: '',
    priority: 0,
    minOrderAmount: 0,
    maxDiscountLimit: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || '',
        description: editData.description || '',
        offerType: editData.offerType || editData.discountType || 'percentage',
        discountType: editData.discountType || 'percentage',
        discountValue: editData.discountValue || editData.discountPct || 15,
        couponCode: editData.couponCode || editData.code || '',
        startDate: editData.startTime ? new Date(editData.startTime).toISOString().slice(0, 16) : getNowDate(),
        endDate: editData.endTime ? new Date(editData.endTime).toISOString().slice(0, 16) : editData.validTill || getNextWeekDate(),
        targetProducts: editData.applicableProducts || editData.targetProducts || [],
        targetServices: editData.applicableServices || editData.targetServices || [],
        usageLimit: editData.usageLimit || '',
        bannerImage: editData.image || editData.bannerImage || '',
        priority: editData.priority || 0,
        minOrderAmount: editData.minOrderAmount || 0,
        maxDiscountLimit: editData.maxDiscountLimit || '',
      });
    } else {
      setForm(prev => ({ ...prev, couponCode: generateCouponCode() }));
    }
  }, [editData, isOpen]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const products = allListings.filter(l => l.type === 'product');
  const services = allListings.filter(l => l.type === 'service');

  const toggleTarget = (listId, type) => {
    const key = type === 'product' ? 'targetProducts' : 'targetServices';
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(listId)
        ? prev[key].filter(id => id !== listId)
        : [...prev[key], listId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Offer title is required');
    if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error('End date must be after start date');
    if (new Date(form.endDate) < new Date()) return toast.error('End date must be in the future');

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        discountType: form.offerType === 'bogo' || form.offerType === 'bundle' ? 'percentage' : form.discountType,
        discountValue: Number(form.discountValue),
        discountPct: form.discountType === 'percentage' ? Number(form.discountValue) : 0,
        couponCode: form.couponCode.toUpperCase(),
        code: form.couponCode.toUpperCase(),
        startTime: new Date(form.startDate).toISOString(),
        endTime: new Date(form.endDate).toISOString(),
        validTill: form.endDate,
        applicableProducts: form.targetProducts,
        applicableServices: form.targetServices,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        image: form.bannerImage,
        priority: Number(form.priority),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscountLimit: form.maxDiscountLimit ? Number(form.maxDiscountLimit) : null,
        offerType: form.offerType,
        targetRoles: ['customer'],
        status: 'Active',
      };

      if (isEdit) payload._editId = editData._id || editData.id;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Dynamic Offer' : 'Create Dynamic Customer Offer'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Offer Type Selection */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-2">Offer Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OFFER_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  updateForm('offerType', type.value);
                  if (type.value === 'fixed') updateForm('discountType', 'fixed');
                  else updateForm('discountType', 'percentage');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                  form.offerType === type.value
                    ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                    : 'border-border text-text-secondary hover:border-brand-purple/30'
                }`}
              >
                <span className="text-base block mb-0.5">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Title *</label>
          <input type="text" required value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="e.g. Festival Special 20% OFF" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>

        {/* Discount & Coupon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Type</label>
            <select value={form.discountType} onChange={(e) => updateForm('discountType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
              Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
            </label>
            <input type="number" min={0} value={form.discountValue} onChange={(e) => updateForm('discountValue', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Coupon Code</label>
            <div className="flex gap-1">
              <input type="text" value={form.couponCode} onChange={(e) => updateForm('couponCode', e.target.value.toUpperCase())} className="flex-1 p-2.5 bg-surface border border-border rounded-xl text-xs font-mono" />
              <button type="button" onClick={() => updateForm('couponCode', generateCouponCode())} className="px-2.5 bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-bold hover:bg-brand-purple/20 transition" title="Generate new code">
                <FiZap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Start Date & Time *</label>
            <input type="datetime-local" required value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">End Date & Time *</label>
            <input type="datetime-local" required min={getNowDate()} value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Usage Limit</label>
            <input type="number" min={0} value={form.usageLimit} onChange={(e) => updateForm('usageLimit', e.target.value)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order (₹)</label>
            <input type="number" min={0} value={form.minOrderAmount} onChange={(e) => updateForm('minOrderAmount', e.target.value)} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Discount (₹)</label>
            <input type="number" min={0} value={form.maxDiscountLimit} onChange={(e) => updateForm('maxDiscountLimit', e.target.value)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => updateForm('description', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>

        {/* Target Products */}
        {products.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Apply to Products (optional)</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {products.map(p => {
                const pid = p._id || p.id;
                const selected = form.targetProducts.includes(pid);
                return (
                  <button key={pid} type="button" onClick={() => toggleTarget(pid, 'product')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${selected ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' : 'border-border text-text-secondary hover:border-brand-purple/30'}`}>
                    {p.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Target Services */}
        {services.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase block">Apply to Services (optional)</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {services.map(s => {
                const sid = s._id || s.id;
                const selected = form.targetServices.includes(sid);
                return (
                  <button key={sid} type="button" onClick={() => toggleTarget(sid, 'service')} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${selected ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-border text-text-secondary hover:border-blue-500/30'}`}>
                    {s.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority & Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Priority (0-10)</label>
            <input type="number" min={0} max={10} value={form.priority} onChange={(e) => updateForm('priority', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Banner Image URL</label>
            <input type="url" value={form.bannerImage} onChange={(e) => updateForm('bannerImage', e.target.value)} placeholder="https://..." className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 gradient-brand text-white rounded-xl font-bold text-xs shadow-premium disabled:opacity-50 transition">
          {submitting ? 'Publishing...' : isEdit ? 'Update Dynamic Offer' : 'Publish Dynamic Offer to Database'}
        </button>
      </form>
    </AdminModal>
  );
}
