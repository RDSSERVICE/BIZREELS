import React from 'react';

export default function DiscountConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Type *</label>
          <select value={config.discountType || 'percent'} onChange={(e) => updateConfig('discountType', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
            <option value="up_to">Up to (%)</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Discount Value *</label>
          <input type="number" min={0} value={config.discountValue || ''} onChange={(e) => updateConfig('discountValue', Number(e.target.value))} placeholder={config.discountType === 'fixed' ? '₹ Amount' : '% Value'} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Applicable On</label>
        <select value={config.applicableOn || 'store'} onChange={(e) => updateConfig('applicableOn', e.target.value)} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs">
          <option value="store">Entire Store</option>
          <option value="single_product">Single Product</option>
          <option value="multiple_products">Multiple Products</option>
          <option value="category">Category</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Min Order (₹)</label>
          <input type="number" min={0} value={config.minOrderAmount || ''} onChange={(e) => updateConfig('minOrderAmount', Number(e.target.value))} placeholder="0" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Max Discount (₹)</label>
          <input type="number" min={0} value={config.maxDiscountLimit || ''} onChange={(e) => updateConfig('maxDiscountLimit', Number(e.target.value) || null)} placeholder="No limit" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );
}
