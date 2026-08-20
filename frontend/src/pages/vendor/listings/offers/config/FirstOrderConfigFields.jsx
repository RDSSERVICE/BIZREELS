import React from 'react';
export default function FirstOrderConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Type *</label>
          <select value={config.discountType || 'percent'} onChange={(e) => updateConfig('discountType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Value *</label>
          <input type="number" min={0} value={config.discountValue || ''} onChange={(e) => updateConfig('discountValue', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order (₹)</label>
          <input type="number" min={0} value={config.minOrderAmount || ''} onChange={(e) => updateConfig('minOrderAmount', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Benefit (₹)</label>
          <input type="number" min={0} value={config.maxBenefit || ''} onChange={(e) => updateConfig('maxBenefit', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">New Customer Definition (days)</label>
        <input type="number" min={1} value={config.newCustomerDefinitionDays || 30} onChange={(e) => updateConfig('newCustomerDefinitionDays', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        <p className="text-[9px] text-slate-400 mt-1">Customers with no orders in the last N days qualify</p>
      </div>
    </div>
  );
}
