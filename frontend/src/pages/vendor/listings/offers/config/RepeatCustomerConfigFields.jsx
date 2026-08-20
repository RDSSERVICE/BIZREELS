import React from 'react';
export default function RepeatCustomerConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Required Previous Orders *</label>
          <input type="number" min={1} value={config.requiredPreviousOrders || 1} onChange={(e) => updateConfig('requiredPreviousOrders', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Previous Spend (₹)</label>
          <input type="number" min={0} value={config.requiredPreviousPurchaseAmount || ''} onChange={(e) => updateConfig('requiredPreviousPurchaseAmount', Number(e.target.value) || null)} placeholder="Any" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
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
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Valid After Previous Order (days)</label>
        <input type="number" min={1} value={config.validityAfterPreviousOrderDays || ''} onChange={(e) => updateConfig('validityAfterPreviousOrderDays', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
