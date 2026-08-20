import React from 'react';
export default function SpecialPriceConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Regular Price (₹) *</label>
          <input type="number" min={0} value={config.regularPrice || ''} onChange={(e) => updateConfig('regularPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Offer Price (₹) *</label>
          <input type="number" min={0} value={config.offerPrice || ''} onChange={(e) => updateConfig('offerPrice', Number(e.target.value))} className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Customer Eligibility</label>
        <input type="text" value={config.customerEligibility || ''} onChange={(e) => updateConfig('customerEligibility', e.target.value)} placeholder="e.g. All customers, Members only" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Validity (days)</label>
          <input type="number" min={1} value={config.validityDays || ''} onChange={(e) => updateConfig('validityDays', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Quantity Limit</label>
          <input type="number" min={1} value={config.quantityLimit || ''} onChange={(e) => updateConfig('quantityLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
    </div>
  );
}
