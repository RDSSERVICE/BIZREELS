import React from 'react';

export default function BuyXGetYConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Buy Quantity *</label>
          <input type="number" min={1} value={config.buyQuantity || 1} onChange={(e) => updateConfig('buyQuantity', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Get Quantity *</label>
          <input type="number" min={1} value={config.getQuantity || 1} onChange={(e) => updateConfig('getQuantity', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Free Item Type</label>
        <select value={config.freeItemType || 'same_product'} onChange={(e) => updateConfig('freeItemType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="same_product">Same Product</option>
          <option value="different_product">Different Product</option>
        </select>
      </div>
      {config.freeItemType === 'different_product' && (
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Free Product ID</label>
          <input type="text" value={config.freeProductId || ''} onChange={(e) => updateConfig('freeProductId', e.target.value)} placeholder="Product ID" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      )}
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Redemptions / Customer</label>
        <input type="number" min={1} value={config.maxRedemptionsPerCustomer || ''} onChange={(e) => updateConfig('maxRedemptionsPerCustomer', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
    </div>
  );
}
