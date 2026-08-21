import React from 'react';
import { FiZap } from 'react-icons/fi';
import { useLanguage } from '../../../../context/LanguageContext';

const getNowDate = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * SharedOfferFields — Common fields used by all offer categories.
 * Title, description, dates, coupon code, priority, banner, product/service targeting.
 */
export default function SharedOfferFields({
  form, updateForm,
  allListings = [],
  showCouponField = false,
  generateCouponCode,
}) {
  const { bi } = useLanguage();
  const products = allListings.filter(l => l.type === 'product');
  const services = allListings.filter(l => l.type === 'service');

  const toggleTarget = (listId, type) => {
    const key = type === 'product' ? 'targetProducts' : 'targetServices';
    const current = form[key] || [];
    updateForm(key, current.includes(listId) ? current.filter(id => id !== listId) : [...current, listId]);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
          {bi('Offer Title *', 'ऑफर शीर्षक *')}
        </label>
        <input
          type="text" required
          value={form.title || ''}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder={bi("e.g. Festival Special 20% OFF", "उदा. फेस्टिवल स्पेशल 20% छूट")}
          className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
        />
      </div>

      {/* Coupon Code (conditional) */}
      {showCouponField && (
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
            {bi('Coupon Code', 'कूपन कोड')}
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={form.couponCode || ''}
              onChange={(e) => updateForm('couponCode', e.target.value.toUpperCase())}
              className="flex-1 p-2.5 bg-surface border border-border rounded-xl text-xs font-mono"
            />
            {generateCouponCode && (
              <button
                type="button"
                onClick={() => updateForm('couponCode', generateCouponCode())}
                className="px-2.5 bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-bold hover:bg-brand-purple/20 transition"
                title={bi('Generate new code', 'नया कोड जनरेट करें')}
              >
                <FiZap className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
            {bi('Start Date & Time *', 'प्रारंभ तिथि व समय *')}
          </label>
          <input
            type="datetime-local" required
            value={form.startDate || getNowDate()}
            onChange={(e) => updateForm('startDate', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
            {bi('End Date & Time *', 'समाप्ति तिथि व समय *')}
          </label>
          <input
            type="datetime-local" required
            min={getNowDate()}
            value={form.endDate || getNextWeekDate()}
            onChange={(e) => updateForm('endDate', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">
          {bi('Offer Description', 'ऑफर का विवरण')}
        </label>
        <textarea
          rows={2}
          value={form.description || ''}
          onChange={(e) => updateForm('description', e.target.value)}
          className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
        />
      </div>

      {/* Target Products */}
      {products.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-tertiary uppercase block">Apply to Products (optional)</label>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {products.map(p => {
              const pid = p._id || p.id;
              const selected = (form.targetProducts || []).includes(pid);
              return (
                <button key={pid} type="button" onClick={() => toggleTarget(pid, 'product')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    selected ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' : 'border-border text-text-secondary hover:border-brand-purple/30'
                  }`}>
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
              const selected = (form.targetServices || []).includes(sid);
              return (
                <button key={sid} type="button" onClick={() => toggleTarget(sid, 'service')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    selected ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-border text-text-secondary hover:border-blue-500/30'
                  }`}>
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
          <input
            type="number" min={0} max={10}
            value={form.priority || 0}
            onChange={(e) => updateForm('priority', e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Banner Image URL</label>
          <input
            type="url"
            value={form.bannerImage || ''}
            onChange={(e) => updateForm('bannerImage', e.target.value)}
            placeholder="https://..."
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs"
          />
        </div>
      </div>
    </div>
  );
}
