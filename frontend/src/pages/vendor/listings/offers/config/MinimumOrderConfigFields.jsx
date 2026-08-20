import React from 'react';
export default function MinimumOrderConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Minimum Order Value (₹) *</label>
        <input type="number" min={0} value={config.minOrderValue || ''} onChange={(e) => updateConfig('minOrderValue', Number(e.target.value))} placeholder="e.g. 500" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Value (₹) *</label>
          <input type="number" min={0} value={config.discountValue || ''} onChange={(e) => updateConfig('discountValue', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Discount (₹)</label>
          <input type="number" min={0} value={config.maxDiscountLimit || ''} onChange={(e) => updateConfig('maxDiscountLimit', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );
}
