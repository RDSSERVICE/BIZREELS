import React from 'react';
export default function CustomerSpecificConfigFields({ config, updateConfig }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Customer Group</label>
        <input type="text" value={config.customerGroup || ''} onChange={(e) => updateConfig('customerGroup', e.target.value)} placeholder="e.g. VIP, Gold Members" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Eligibility Criteria</label>
        <input type="text" value={config.eligibility || ''} onChange={(e) => updateConfig('eligibility', e.target.value)} placeholder="e.g. 5+ orders, ₹10000+ spent" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Special Price (₹)</label>
          <input type="number" min={0} value={config.specialPrice || ''} onChange={(e) => updateConfig('specialPrice', Number(e.target.value) || null)} placeholder="Optional" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Usage Limit</label>
          <input type="number" min={1} value={config.usageLimit || ''} onChange={(e) => updateConfig('usageLimit', Number(e.target.value) || null)} placeholder="Unlimited" className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={config.hiddenFromPublicFeed !== false} onChange={(e) => updateConfig('hiddenFromPublicFeed', e.target.checked)} className="rounded" />
        <label className="text-xs font-bold text-text-secondary">Hidden from public feed</label>
      </div>
    </div>
  );
}
