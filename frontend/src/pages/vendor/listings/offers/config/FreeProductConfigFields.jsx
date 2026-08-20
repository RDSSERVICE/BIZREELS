import React from 'react';

export default function FreeProductConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Purchase Requirement Type *</label>
        <select value={config.purchaseRequirementType || 'min_amount'} onChange={(e) => updateConfig('purchaseRequirementType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="min_amount">Minimum Amount (₹)</option>
          <option value="min_qty">Minimum Quantity</option>
          <option value="specific_product">Specific Product</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Requirement Value *</label>
        <input type={config.purchaseRequirementType === 'specific_product' ? 'text' : 'number'} min={0} value={config.purchaseRequirementValue || ''} onChange={(e) => updateConfig('purchaseRequirementValue', config.purchaseRequirementType === 'specific_product' ? e.target.value : Number(e.target.value))} placeholder={config.purchaseRequirementType === 'specific_product' ? 'Product ID' : 'Value'} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Free Quantity</label>
          <input type="number" min={1} value={config.freeQuantity || 1} onChange={(e) => updateConfig('freeQuantity', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Gift Value (₹)</label>
          <input type="number" min={0} value={config.giftValue || ''} onChange={(e) => updateConfig('giftValue', Number(e.target.value) || null)} placeholder="Optional" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Gift Stock Limit</label>
        <input type="number" min={0} value={config.giftStockLimit || ''} onChange={(e) => updateConfig('giftStockLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
