import React from 'react';
import { FiZap } from 'react-icons/fi';

const generateCode = () => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let r = 'BIZ'; for (let i = 0; i < 5; i++) r += c.charAt(Math.floor(Math.random() * c.length)); return r; };

export default function CouponConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Coupon Code *</label>
        <div className="flex gap-1">
          <input type="text" value={config.couponCode || ''} onChange={(e) => updateConfig('couponCode', e.target.value.toUpperCase())} className="flex-1 p-2.5 bg-surface border border-border rounded-xl text-xs font-mono" />
          <button type="button" onClick={() => updateConfig('couponCode', generateCode())} className="px-2.5 bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-bold hover:bg-brand-purple/20 transition" title="Generate"><FiZap className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Coupon Type *</label>
          <select value={config.couponType || 'percent'} onChange={(e) => updateConfig('couponType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order (₹)</label>
          <input type="number" min={0} value={config.minOrderAmount || ''} onChange={(e) => updateConfig('minOrderAmount', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Discount (₹)</label>
          <input type="number" min={0} value={config.maxDiscountLimit || ''} onChange={(e) => updateConfig('maxDiscountLimit', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Per Customer</label>
          <input type="number" min={1} value={config.usagePerCustomer || 1} onChange={(e) => updateConfig('usagePerCustomer', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Total Usage</label>
          <input type="number" min={1} value={config.totalUsageLimit || ''} onChange={(e) => updateConfig('totalUsageLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Visibility</label>
        <select value={config.visibility || 'public'} onChange={(e) => updateConfig('visibility', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="public">Public — visible to all</option>
          <option value="private">Private — hidden, direct link only</option>
          <option value="selected_customers">Selected Customers only</option>
        </select>
      </div>
    </div>
  );
}
